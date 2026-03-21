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
const PEOPLE_TRIGGER_PATTERN = /\b(?:with|meet|ask|call|invite|join|tell|contact|text|email)\s+((?:[a-z]+(?:\s+[a-z]+)*(?:(?:,\s*|\s+and\s+|\s+&\s+|\s+and\s+then\s+)(?:[a-z]+(?:\s+[a-z]+)*))*)+)/gi;

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
      // Skip very short tokens or tokens with numbers
      if (name.length < 2 || /\d/.test(name)) continue;
      // Skip multi-word phrases that look like activities (>2 words)
      if (name.split(/\s+/).length > 2) continue;
      people.add(titleCase(lower));
    }
  }

  return Array.from(people);
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
}

export function parseBrainDump(text: string): ParsedBrainDump {
  return {
    extracted_urls: extractUrls(text),
    extracted_people: extractPeople(text),
    extracted_topics: extractTopics(text),
  };
}

/**
 * Create initial BrainDumpData from raw text.
 */
export function createBrainDumpData(
  text: string,
  sourceStepId?: string,
  sourceReviewNotes?: string,
): BrainDumpData {
  const parsed = parseBrainDump(text);
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
