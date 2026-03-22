/**
 * BrainDumpAIService — Client-side parsing of brain dump text.
 *
 * Extracts URLs, classifies platforms (YouTube, PDF, article),
 * fetches oEmbed metadata for YouTube, and detects people mentions.
 */

import type { ExtractedUrl, BrainDumpData, MediaLinkPlatform } from '@/types/step-detail';
import type { ResourceType } from '@/types/library';
import { getUserLibrary, addResource } from '@/services/LibraryService';

// ---------------------------------------------------------------------------
// URL extraction + classification
// ---------------------------------------------------------------------------

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: ExtractedUrl['platform'] }> = [
  { pattern: /youtu\.?be/i, platform: 'youtube' },
  { pattern: /instagram\.com/i, platform: 'instagram' },
  { pattern: /tiktok\.com/i, platform: 'tiktok' },
  { pattern: /photos\.google\.com/i, platform: 'google_photos' },
  { pattern: /\.pdf(\?|$)/i, platform: 'pdf' },
];

function classifyUrl(url: string): ExtractedUrl['platform'] {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  // Heuristic: if it looks like an article (has a path with words), classify as article
  try {
    const parsed = new URL(url);
    if (parsed.pathname.length > 5 && /\/[a-z]/.test(parsed.pathname)) {
      return 'article';
    }
  } catch {}
  return 'unknown';
}

function extractUrls(text: string): ExtractedUrl[] {
  const matches = text.match(URL_REGEX) ?? [];
  const seen = new Set<string>();
  const results: ExtractedUrl[] = [];

  for (const raw of matches) {
    // Clean trailing punctuation
    const url = raw.replace(/[.,;:!?)]+$/, '');
    if (seen.has(url)) continue;
    seen.add(url);
    results.push({
      url,
      platform: classifyUrl(url),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// YouTube oEmbed metadata
// ---------------------------------------------------------------------------

async function fetchYouTubeMetadata(
  url: string,
): Promise<{ title?: string; thumbnail_url?: string }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return {};
    const data = await res.json();
    return {
      title: data.title,
      thumbnail_url: data.thumbnail_url,
    };
  } catch {
    return {};
  }
}

/**
 * Enrich extracted URLs with metadata (YouTube thumbnails/titles).
 * Call this after initial parse for async enrichment.
 */
export async function enrichUrls(urls: ExtractedUrl[]): Promise<ExtractedUrl[]> {
  return Promise.all(
    urls.map(async (item) => {
      if (item.platform === 'youtube' && !item.title) {
        const meta = await fetchYouTubeMetadata(item.url);
        return { ...item, ...meta };
      }
      return item;
    }),
  );
}

// ---------------------------------------------------------------------------
// People detection
// ---------------------------------------------------------------------------

// Match patterns like "with Rita and Eric", "meet Bram at the boat"
// Trigger words: with, meet, ask, call, invite, join, tell, contact, text, email
// Captures names up to a preposition, punctuation, or end of clause
// Case-insensitive to catch both "Rita" and "rita"
const PEOPLE_TRIGGER_PATTERN = /\b(?:with|meet|ask|call|invite|join|tell|contact|text|email)\s+((?:[a-z][a-z0-9]*(?:\s+[a-z][a-z0-9]*)*(?:(?:,\s*|\s+and\s+|\s+&\s+|\s+and\s+then\s+)(?:[a-z][a-z0-9]*(?:\s+[a-z][a-z0-9]*)*))*)+)/gi;

// Prepositions and conjunctions that end a name sequence
const NAME_BOUNDARY_WORDS = new Set([
  'at', 'on', 'in', 'to', 'for', 'about', 'from', 'into', 'during',
  'before', 'after', 'until', 'since', 'near', 'by', 'around',
]);

// Common words that appear after trigger words but aren't names
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'my', 'our', 'some', 'no', 'this', 'that', 'these', 'those',
  'up', 'out',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'youtube', 'google', 'discord', 'zoom', 'whatsapp', 'slack',
  'dragon', 'laser', 'optimist', 'lightning', 'soling', 'star',
  'what', 'when', 'where', 'how', 'why', 'who',
  'north', 'south', 'east', 'west', 'pdf',
  'it', 'them', 'us', 'him', 'her', 'me', 'you', 'everyone', 'someone',
]);

/** Capitalize first letter of each word */
function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractPeople(text: string): string[] {
  const people = new Set<string>();

  // "with/meet/ask/call Name1 and Name2" patterns
  let match: RegExpExecArray | null;
  while ((match = PEOPLE_TRIGGER_PATTERN.exec(text)) !== null) {
    let namesBlock = match[1];
    // Truncate at boundary words (prepositions) to avoid capturing "at dragon boat..."
    const words = namesBlock.split(/\s+/);
    const boundaryIdx = words.findIndex((w) => NAME_BOUNDARY_WORDS.has(w.toLowerCase()));
    if (boundaryIdx > 0) {
      namesBlock = words.slice(0, boundaryIdx).join(' ');
    }
    // Split on comma, "and", "and then", "&"
    const names = namesBlock
      .split(/,\s*|\s+and\s+then\s+|\s+and\s+|\s+&\s+/)
      .map((n) => n.trim())
      .filter(Boolean);
    for (const name of names) {
      const lower = name.toLowerCase();
      // Skip common words (single word check)
      if (STOP_WORDS.has(lower)) continue;
      // Skip very short tokens or purely numeric tokens
      if (name.length < 2 || /^\d+$/.test(name)) continue;
      // Skip multi-word phrases that look like activities (>2 words)
      if (name.split(/\s+/).length > 2) continue;
      people.add(titleCase(lower));
    }
  }

  return Array.from(people);
}

// ---------------------------------------------------------------------------
// Date extraction (lightweight client-side detection for instant pills)
// ---------------------------------------------------------------------------

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function getNextDayOfWeek(dayIndex: number, referenceWord: string): string {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sunday
  // Convert our dayIndex (0=Monday) to JS day (0=Sunday)
  const targetJsDay = (dayIndex + 1) % 7;
  let daysAhead = targetJsDay - currentDay;

  if (referenceWord === 'next') {
    // "next Monday" always means the coming week's Monday
    if (daysAhead <= 0) daysAhead += 7;
  } else if (referenceWord === 'this') {
    // "this Monday" means this week
    if (daysAhead < 0) daysAhead += 7;
  } else {
    // bare "Monday" — next occurrence
    if (daysAhead <= 0) daysAhead += 7;
  }

  const target = new Date(now);
  target.setDate(now.getDate() + daysAhead);
  return target.toISOString().split('T')[0];
}

export interface ExtractedDate {
  raw: string;
  rough_iso: string;  // YYYY-MM-DD or YYYY-MM-DDTHH:MM when time detected
}

/**
 * Parse a time expression like "12 pm", "2:30pm", "14:00", "3 am" into HH:MM (24h).
 * Returns null if no valid time found.
 */
function parseTime(timeStr: string): string | null {
  // "14:00", "13:30"
  const mil = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (mil) {
    const h = parseInt(mil[1], 10);
    const m = parseInt(mil[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  // "12pm", "2:30 am", "3 pm", "12:00pm"
  const ampm = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2] || '0', 10);
    const period = ampm[3].toLowerCase();
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return null;
}

/**
 * Look for a time expression near a date match in the text.
 * Scans for patterns like "at 12 pm", "at 2:30pm", "at 14:00" following the date text.
 */
function findTimeNearDate(text: string, dateRaw: string): { time24: string; timeRaw: string } | null {
  const idx = text.toLowerCase().indexOf(dateRaw.toLowerCase());
  if (idx < 0) return null;

  // Look at text after the date match (up to 30 chars)
  const after = text.substring(idx + dateRaw.length, idx + dateRaw.length + 30);
  const timeMatch = after.match(/^\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)|\d{1,2}:\d{2})\b/);
  if (timeMatch) {
    const parsed = parseTime(timeMatch[1].trim());
    if (parsed) return { time24: parsed, timeRaw: timeMatch[0].trim() };
  }
  return null;
}

function extractDates(text: string): ExtractedDate[] {
  const dates: ExtractedDate[] = [];
  const seen = new Set<string>();

  // Helper to add a date, checking for nearby time
  function addDate(dateIso: string, raw: string) {
    const timeInfo = findTimeNearDate(text, raw);
    const fullRaw = timeInfo ? `${raw} ${timeInfo.timeRaw}` : raw;
    const fullIso = timeInfo ? `${dateIso}T${timeInfo.time24}` : dateIso;
    if (!seen.has(dateIso)) {
      seen.add(dateIso);
      dates.push({ raw: fullRaw, rough_iso: fullIso });
    }
  }

  // "tomorrow"
  if (/\btomorrow\b/i.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const iso = d.toISOString().split('T')[0];
    addDate(iso, 'tomorrow');
  }

  // "day after tomorrow"
  const datMatch = text.match(/\bday after tomorrow\b/i);
  if (datMatch) {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const iso = d.toISOString().split('T')[0];
    addDate(iso, 'day after tomorrow');
  }

  // "next/this [day]" or bare "[day]"
  const dayPattern = /\b(next|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
  let dm: RegExpExecArray | null;
  while ((dm = dayPattern.exec(text)) !== null) {
    const qualifier = (dm[1] || '').toLowerCase();
    const dayName = dm[2].toLowerCase();
    const dayIdx = DAY_NAMES.indexOf(dayName);
    if (dayIdx >= 0) {
      const iso = getNextDayOfWeek(dayIdx, qualifier || 'next');
      addDate(iso, dm[0].trim());
    }
  }

  // "March 28", "28th March", "March 28th"
  const monthDatePattern = new RegExp(
    `\\b(${MONTH_NAMES.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b` +
    `|\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES.join('|')})\\b`,
    'gi'
  );
  let mdm: RegExpExecArray | null;
  while ((mdm = monthDatePattern.exec(text)) !== null) {
    const monthName = (mdm[1] || mdm[4]).toLowerCase();
    const day = parseInt(mdm[2] || mdm[3], 10);
    const monthIdx = MONTH_NAMES.indexOf(monthName);
    if (monthIdx >= 0 && day >= 1 && day <= 31) {
      const year = new Date().getFullYear();
      const iso = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      addDate(iso, mdm[0].trim());
    }
  }

  // "3/28" or "03/28" — US date format
  const slashPattern = /\b(\d{1,2})\/(\d{1,2})\b/g;
  let sm: RegExpExecArray | null;
  while ((sm = slashPattern.exec(text)) !== null) {
    const month = parseInt(sm[1], 10);
    const day = parseInt(sm[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const year = new Date().getFullYear();
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      addDate(iso, sm[0]);
    }
  }

  return dates;
}

// ---------------------------------------------------------------------------
// Equipment hint extraction (sailing-first, lightweight)
// ---------------------------------------------------------------------------

const SAILING_BOAT_CLASSES = [
  'dragon', 'laser', 'ilca', 'optimist', 'j/70', 'j70', 'etchells', '49er', '470',
  'finn', 'star', 'soling', 'lightning', 'snipe', 'sunfish', 'hobie',
  'nacra', 'rs200', 'rs400', 'rs800', 'rs aero', '29er', 'moth', 'waszp',
  'dinghy', 'keelboat', 'catamaran',
];

const SAILING_SAIL_TERMS = [
  'spinnaker', 'genoa', 'jib', 'mainsail', 'main', 'gennaker',
  'code zero', 'storm jib', 'trysail', 'light jib', 'heavy jib', 'medium jib',
  'north sails', 'quantum', 'doyle', 'hyde sails', 'ullman',
];

const SAILING_EQUIPMENT_TERMS = [
  'loos gauge', 'shroud', 'halyard', 'winch', 'tiller', 'rudder',
  'backstay', 'forestay', 'spreader', 'vang', 'cunningham', 'outhaul',
  'trapeze', 'harness', 'buoyancy aid', 'life jacket', 'wetsuit', 'drysuit',
  'compass', 'gps', 'b&g', 'garmin', 'velocitek', 'tacktic',
  'boat cover', 'trailer', 'launching trolley', 'dolly',
];

function extractEquipmentHints(text: string, interestSlug?: string): string[] {
  const equipment = new Set<string>();

  // For sailing (or if no interest specified, try sailing terms anyway)
  const isSailing = !interestSlug || interestSlug.includes('sail');

  if (isSailing) {
    // Match known class names, sail terms, and equipment terms
    const allTerms = [
      ...SAILING_BOAT_CLASSES,
      ...SAILING_SAIL_TERMS,
      ...SAILING_EQUIPMENT_TERMS,
    ];
    for (const term of allTerms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
      const match = text.match(pattern);
      if (match) equipment.add(match[0]);
    }

    // Also detect "boat [name]" or "our boat [name]" or "my boat [name]"
    // This captures boat proper names like "Dragonfly", "Dorado"
    const boatNamePattern = /\b(?:my|our|the)\s+boat\s+([a-zA-Z][a-zA-Z0-9]+)/gi;
    let bm: RegExpExecArray | null;
    while ((bm = boatNamePattern.exec(text)) !== null) {
      equipment.add(bm[1]);
    }

    // Detect "on [boat name]" after "on" (common in sailing: "on dragonfly", "on Dorado")
    const onBoatPattern = /\bon\s+(?:the\s+)?([a-zA-Z][a-zA-Z0-9]+)\b/gi;
    let obm: RegExpExecArray | null;
    while ((obm = onBoatPattern.exec(text)) !== null) {
      const name = obm[1];
      // Skip common false positives after "on"
      const skipAfterOn = new Set([
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
        'september', 'october', 'november', 'december',
        'discord', 'zoom', 'youtube', 'instagram',
        'the', 'my', 'our', 'your', 'his', 'her', 'its', 'their',
        'this', 'that', 'these', 'those',
        'port', 'starboard',
      ]);
      if (!skipAfterOn.has(name.toLowerCase()) && name.length > 2) {
        equipment.add(name);
      }
    }
  }

  return Array.from(equipment);
}

// ---------------------------------------------------------------------------
// Location hint extraction (lightweight)
// ---------------------------------------------------------------------------

function extractLocationHints(text: string): string[] {
  const locations = new Set<string>();

  // Common false positives to skip
  const skipPhrases = new Set([
    'the', 'a', 'an', 'my', 'our', 'your', 'this', 'that', 'it',
    'home', 'work', 'school', 'practice', 'session', 'class',
    'general', 'mind', 'order', 'place', 'fact', 'case',
    'addition', 'advance', 'total', 'time', 'person',
  ]);

  // "at [Place]", "in [Place]", "near [Place]", "from [Place]"
  // Case-insensitive — captures multi-word place names up to commas/periods/prepositions
  const locationPattern = /\b(?:at|in|near|from)\s+([a-zA-Z][a-zA-Z]+(?:\s+[a-zA-Z][a-zA-Z]+){0,4})/gi;
  let lm: RegExpExecArray | null;
  while ((lm = locationPattern.exec(text)) !== null) {
    let place = lm[1].trim();

    // Trim trailing common words that aren't part of a place name
    const trailingNonPlace = /\s+(?:tomorrow|today|tonight|next|this|and|or|with|at|on|for|to|the)$/i;
    place = place.replace(trailingNonPlace, '').trim();

    // Trim at comma boundaries
    if (place.includes(',')) {
      // "victoria harbor, hong kong" → treat as two separate places
      const parts = place.split(',').map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (!skipPhrases.has(part.toLowerCase()) && part.length > 2) {
          locations.add(titleCase(part));
        }
      }
      continue;
    }

    if (!skipPhrases.has(place.toLowerCase()) && place.length > 2) {
      locations.add(titleCase(place));
    }
  }

  return Array.from(locations);
}

// ---------------------------------------------------------------------------
// Topic extraction (lightweight — just key phrases)
// ---------------------------------------------------------------------------

function extractTopics(text: string): string[] {
  // Simple keyword extraction: find phrases that appear to be activities/skills
  const topics: string[] = [];
  const activityPatterns = [
    // Multi-word phrases (check these first for more specific matches)
    /\b(roll tack(?:ing|s)?)\b/gi,
    /\b(spinnaker\s+(?:flying|work|trim|sets?|handling))\b/gi,
    /\b(downwind\s+(?:tips|sailing|technique|speed))\b/gi,
    /\b(upwind\s+(?:tips|sailing|technique|trim|speed))\b/gi,
    /\b(sail\s+trim(?:ming)?)\b/gi,
    /\b(mast\s+ram)\b/gi,
    /\b(shroud\s+tension)\b/gi,
    /\b(rig\s+tuning)\b/gi,
    /\b(boat\s+handling)\b/gi,
    /\b(mark\s+roundings?)\b/gi,
    /\b(starting\s+(?:technique|line|strategy))\b/gi,
    /\b(race\s+tactics?)\b/gi,
    /\b(light\s+wind\s+\w+)\b/gi,
    /\b(heavy\s+wind\s+\w+)\b/gi,
    /\b(balance\b.*?\bkeel)\b/gi,
    /\b(shifting\s+gears)\b/gi,
    /\b(running\s+backstays?)\b/gi,
    /\b(jumper\s+stays?)\b/gi,
    /\b(mast\s+(?:setup|bend|pre-?bend))\b/gi,
    /\b(crew\s+(?:work|technique|coordination))\b/gi,
    // Single-word sailing terms
    /\b(tacking)\b/gi,
    /\b(gybing|jibing)\b/gi,
    /\b(spinnaker)\b/gi,
    /\b(downwind)\b/gi,
    /\b(upwind)\b/gi,
  ];

  const seen = new Set<string>();
  for (const pattern of activityPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const topic = m[1].trim().toLowerCase();
      if (!seen.has(topic)) {
        seen.add(topic);
        topics.push(m[1].trim());
      }
    }
  }

  return topics;
}

// ---------------------------------------------------------------------------
// Main parse function (synchronous, instant)
// ---------------------------------------------------------------------------

export interface ParsedBrainDump {
  extracted_urls: ExtractedUrl[];
  extracted_people: string[];
  extracted_topics: string[];
  extracted_dates: ExtractedDate[];
  extracted_equipment: string[];
  extracted_locations: string[];
}

export function parseBrainDump(text: string, interestSlug?: string): ParsedBrainDump {
  return {
    extracted_urls: extractUrls(text),
    extracted_people: extractPeople(text),
    extracted_topics: extractTopics(text),
    extracted_dates: extractDates(text),
    extracted_equipment: extractEquipmentHints(text, interestSlug),
    extracted_locations: extractLocationHints(text),
  };
}

/**
 * Create initial BrainDumpData from raw text.
 */
export function createBrainDumpData(
  text: string,
  sourceStepId?: string,
  sourceReviewNotes?: string,
  interestSlug?: string,
): BrainDumpData {
  const parsed = parseBrainDump(text, interestSlug);
  return {
    raw_text: text,
    ...parsed,
    source_step_id: sourceStepId,
    source_review_notes: sourceReviewNotes,
    created_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Save extracted URLs to library
// ---------------------------------------------------------------------------

function platformToResourceType(platform: ExtractedUrl['platform']): ResourceType {
  switch (platform) {
    case 'youtube': return 'youtube_video';
    case 'pdf': return 'book_digital';
    case 'article': return 'website';
    case 'instagram':
    case 'tiktok': return 'social_media';
    default: return 'website';
  }
}

function platformToSourcePlatform(platform: ExtractedUrl['platform']): string {
  switch (platform) {
    case 'youtube': return 'YouTube';
    case 'instagram': return 'Instagram';
    case 'tiktok': return 'TikTok';
    case 'google_photos': return 'Google Photos';
    case 'pdf': return 'PDF';
    case 'article': return 'Web';
    default: return 'Web';
  }
}

/**
 * Save extracted URLs from a brain dump to the user's library.
 * Skips URLs that already exist (by URL match). Runs in the background
 * — callers don't need to await this.
 */
export async function saveUrlsToLibrary(
  urls: ExtractedUrl[],
  userId: string,
  interestId: string,
): Promise<string[]> {
  console.log('[BrainDump] saveUrlsToLibrary called:', { urlCount: urls.length, userId: userId.slice(0, 8), interestId: interestId.slice(0, 8) });
  if (!urls.length || !userId || !interestId) {
    console.log('[BrainDump] saveUrlsToLibrary: skipped — missing params');
    return [];
  }

  const savedIds: string[] = [];

  try {
    console.log('[BrainDump] Getting user library for interest:', interestId);
    const library = await getUserLibrary(userId, interestId);
    console.log('[BrainDump] Got library:', library.id);

    const results = await Promise.allSettled(
      urls.map(async (u) => {
        const title = u.title || new URL(u.url).hostname + new URL(u.url).pathname.slice(0, 40);
        console.log('[BrainDump] Adding resource:', { title, url: u.url, platform: u.platform, resourceType: platformToResourceType(u.platform) });
        try {
          const resource = await addResource(userId, {
            library_id: library.id,
            title,
            url: u.url,
            resource_type: platformToResourceType(u.platform),
            source_platform: platformToSourcePlatform(u.platform),
            thumbnail_url: u.thumbnail_url ?? null,
            metadata: { from_brain_dump: true },
          });
          console.log('[BrainDump] Resource saved:', resource.id, title);
          savedIds.push(resource.id);
          return resource;
        } catch (err) {
          console.warn('[BrainDump] addResource failed for', u.url, err);
          throw err;
        }
      }),
    );

    console.log('[BrainDump] saveUrlsToLibrary results:', results.map((r) => r.status));
    return savedIds;
  } catch (err) {
    console.error('[BrainDump] saveUrlsToLibrary failed:', err);
    return savedIds;
  }
}
