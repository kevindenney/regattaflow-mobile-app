/**
 * Web Scraping Tools for Onboarding
 * Extract racing data from club and class websites using simple HTML parsing
 */

import { z } from 'zod';
import { AgentTool } from './BaseAgentService';

/**
 * Extract date from text with multiple format support
 */
function extractDate(text: string): string | null {
  // Try various date formats
  const formats = [
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    // Month DD, YYYY (e.g., "March 15, 2025")
    /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i,
    // DD Month YYYY (e.g., "15 March 2025")
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
  ];

  for (const format of formats) {
    const match = text.match(format);
    if (match) {
      // Convert to YYYY-MM-DD format
      if (match[0].includes('-') && match[0].match(/^\d{4}/)) {
        return match[0]; // Already YYYY-MM-DD
      } else if (match[1] && match[2] && match[3]) {
        // Handle different formats
        if (isNaN(Number(match[1]))) {
          // Month name format
          const monthMap: any = {
            'january': '01', 'jan': '01', 'february': '02', 'feb': '02',
            'march': '03', 'mar': '03', 'april': '04', 'apr': '04',
            'may': '05', 'june': '06', 'jun': '06', 'july': '07', 'jul': '07',
            'august': '08', 'aug': '08', 'september': '09', 'sep': '09',
            'october': '10', 'oct': '10', 'november': '11', 'nov': '11',
            'december': '12', 'dec': '12'
          };
          const month = monthMap[match[1].toLowerCase()];
          const day = match[2].padStart(2, '0');
          const year = match[3];
          return `${year}-${month}-${day}`;
        } else if (match[1].length === 4) {
          // YYYY-MM-DD
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          // DD/MM/YYYY or DD Month YYYY
          const day = match[1].padStart(2, '0');
          const month = isNaN(Number(match[2])) ?
            { 'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
              'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12',
              'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'jun': '06', 'jul': '07',
              'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            }[match[2].toLowerCase()] : match[2].padStart(2, '0');
          const year = match[3];
          return `${year}-${month}-${day}`;
        }
      }
    }
  }
  return null;
}

/**
 * Extract time from text (HH:MM format)
 */
function extractTime(text: string): string | null {
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?/,
    /(\d{1,2})(\d{2})\s*(hrs|hours?)?/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] || '00';
      const meridiem = match[3]?.toLowerCase();

      // Convert to 24-hour format
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }
  return null;
}

/**
 * Extract location/venue from text
 */
function extractLocation(text: string): string | null {
  const locationPatterns = [
    /(?:at|venue|location):\s*([A-Z][^\n,;]+)/i,
    /([A-Z][a-z]+\s+(?:Yacht\s+Club|YC|Sailing\s+Club|Marina|Harbor|Harbour|Bay|Sound))/,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract all links from HTML
 */
function extractLinksFromHTML(html: string): Array<{ url: string; text: string }> {
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  const links: { url: string; text: string }[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    links.push({ url: match[1], text: match[2].trim() });
  }
  return links;
}

/**
 * Get surrounding text context from HTML for a given search string
 */
function getSurroundingText(html: string, searchText: string, contextLength: number = 200): string {
  const plainText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const index = plainText.indexOf(searchText);
  if (index === -1) return '';

  const start = Math.max(0, index - contextLength);
  const end = Math.min(plainText.length, index + searchText.length + contextLength);

  return plainText.substring(start, end);
}

/**
 * Parse HTML table into rows and cells
 * Handles basic <table><tr><td> structure
 */
function parseHTMLTable(html: string): string[][] {
  const tables: string[][] = [];

  // Extract all table rows
  const tableRegex = /<table[^>]*>(.*?)<\/table>/gis;
  const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
  const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gis;

  let tableMatch;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHTML = tableMatch[1];
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableHTML)) !== null) {
      const rowHTML = rowMatch[1];
      const cells: string[] = [];
      let cellMatch;

      while ((cellMatch = cellRegex.exec(rowHTML)) !== null) {
        // Strip HTML tags and clean up text
        const cellText = cellMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        cells.push(cellText);
      }

      if (cells.length > 0) {
        tables.push(cells);
      }
    }
  }

  return tables;
}

/**
 * Extract fleet members from HTML tables
 * Looks for tables with columns: [Boat Name, Sail #, Owner]
 */
function extractFleetMembers(html: string, boatClass: string): Array<{
  boat_name: string;
  sail_number: string;
  owner_name: string;
}> {
  const tables = parseHTMLTable(html);
  const fleetMembers: Array<{ boat_name: string; sail_number: string; owner_name: string }> = [];

  // Look for tables that have boat/sail/owner pattern
  for (const row of tables) {
    if (row.length >= 3) {
      // Check if this looks like a fleet table row
      // Pattern: [Boat Name, Sail #, Owner Name]
      const boatName = row[0];
      const sailNum = row[1];
      const ownerName = row[2];

      // Validate: sail number should be numeric or have class prefix
      if (sailNum && /^\d+$/.test(sailNum.trim())) {
        fleetMembers.push({
          boat_name: boatName,
          sail_number: sailNum.trim(),
          owner_name: ownerName,
        });
      }
    }
  }

  return fleetMembers;
}

/**
 * Parse CSV content into structured race events
 * Handles multiple CSV formats intelligently
 */
function parseCSVCalendar(csvText: string): Array<{
  name: string;
  date: string;
  startTime?: string;
  location?: string;
  type: string;
}> {
  const events: Array<any> = [];
  const lines = csvText.trim().split('\n').filter(line => line.trim());

  if (lines.length < 2) {

    return events;
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  // Find column indices - support multiple naming conventions
  const dateIdx = headers.findIndex(h =>
    h.includes('date') || h.includes('start date')
  );
  const nameIdx = headers.findIndex(h =>
    h.includes('subject') || h.includes('event') || h.includes('race') ||
    h.includes('name') || h.includes('title')
  );
  const timeIdx = headers.findIndex(h =>
    h.includes('time') || h.includes('start time')
  );
  const locationIdx = headers.findIndex(h =>
    h.includes('location') || h.includes('venue') || h.includes('place')
  );

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim());

    if (cells.length > Math.max(dateIdx, nameIdx)) {
      let rawDate = dateIdx >= 0 ? cells[dateIdx] : '';

      // Convert DD/MM/YYYY to YYYY-MM-DD
      if (rawDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = rawDate.split('/');
        rawDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const event: any = {
        name: nameIdx >= 0 ? cells[nameIdx] : `Race ${i}`,
        date: rawDate,
        type: 'club_race'
      };

      if (timeIdx >= 0 && cells[timeIdx]) {
        event.startTime = cells[timeIdx];
      }

      if (locationIdx >= 0 && cells[locationIdx]) {
        event.location = cells[locationIdx];
      }

      if (event.name && event.date) {
        events.push(event);
      } else {
      }
    }
  }

  return events;
}

/**
 * Parse ICS (iCalendar) content into structured race events
 */
function parseICSCalendar(icsText: string): Array<{
  name: string;
  date: string;
  startTime?: string;
  location?: string;
  type: string;
}> {
  const events: Array<any> = [];

  // Split into individual VEVENT blocks
  const eventBlocks = icsText.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) || [];

  eventBlocks.forEach(block => {
    const event: any = { type: 'club_race' };

    // Extract SUMMARY (event name)
    const summaryMatch = block.match(/SUMMARY:(.*)/i);
    if (summaryMatch) event.name = summaryMatch[1].trim();

    // Extract DTSTART (date/time)
    const dtStartMatch = block.match(/DTSTART[;:]([^\r\n]*)/i);
    if (dtStartMatch) {
      const dtStart = dtStartMatch[1].replace(/[TZ]/g, ' ').trim();
      event.date = dtStart.substring(0, 8); // YYYYMMDD
      const time = dtStart.substring(8, 12); // HHMM
      if (time) event.startTime = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    }

    // Extract LOCATION
    const locationMatch = block.match(/LOCATION:(.*)/i);
    if (locationMatch) event.location = locationMatch[1].trim();

    if (event.name && event.date) {
      events.push(event);
    }
  });

  return events;
}

// Simple HTML parser to extract text and links (enhanced for multi-level scraping)
async function fetchAndParseWebsite(url: string, options: {
  followCalendarLinks?: boolean;
  maxDepth?: number;
  currentDepth?: number;
} = {}) {
  const {
    followCalendarLinks = false,
    maxDepth = 2,
    currentDepth = 0
  } = options;

  try {
    // Use CORS proxy for web browsers
    // Note: In production, this should be replaced with a Supabase Edge Function
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const fetchUrl = url.startsWith('http') ? corsProxy + encodeURIComponent(url) : url;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract basic text content (simplified parsing)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract links
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    const links: { url: string; text: string }[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({ url: match[1], text: match[2].trim() });
    }

    // NEW: Multi-level calendar discovery
    const calendarData: Array<any> = [];

    if (followCalendarLinks && currentDepth < maxDepth) {

      // Find calendar-related links
      const calendarLinks = links.filter(link => {
        const lowerText = link.text.toLowerCase();
        const lowerUrl = link.url.toLowerCase();
        return (
          lowerText.includes('calendar') ||
          lowerText.includes('racing') ||
          lowerText.includes('events') ||
          lowerText.includes('schedule') ||
          lowerUrl.includes('calendar') ||
          lowerUrl.includes('.csv') ||
          lowerUrl.includes('.ics')
        );
      });

      // Follow calendar links (limit to 3 to avoid excessive requests)
      for (const calLink of calendarLinks.slice(0, 3)) {
        const fullUrl = calLink.url.startsWith('http')
          ? calLink.url
          : new URL(calLink.url, url).href;

        try {
          // Check if it's a CSV or ICS file
          if (fullUrl.toLowerCase().endsWith('.csv')) {
            const csvResponse = await fetch(corsProxy + encodeURIComponent(fullUrl));
            const csvText = await csvResponse.text();
            const events = parseCSVCalendar(csvText);
            calendarData.push({
              url: fullUrl,
              type: 'csv',
              events,
              source: calLink.text
            });
          } else if (fullUrl.toLowerCase().endsWith('.ics')) {
            const icsResponse = await fetch(corsProxy + encodeURIComponent(fullUrl));
            const icsText = await icsResponse.text();
            const events = parseICSCalendar(icsText);
            calendarData.push({
              url: fullUrl,
              type: 'ics',
              events,
              source: calLink.text
            });
          } else {
            // Recursively scrape calendar page
            const subPage = await fetchAndParseWebsite(fullUrl, {
              followCalendarLinks: true,
              maxDepth,
              currentDepth: currentDepth + 1
            });

            // Merge discovered calendars
            if (subPage.calendarData && subPage.calendarData.length > 0) {
              calendarData.push(...subPage.calendarData);
            }
          }
        } catch (err) {
        }
      }
    }

    return { textContent, links, html, calendarData };
  } catch (error: any) {
    console.error('Failed to fetch website:', error);
    throw error;
  }
}

// Schema for scraped race calendar event
const RaceEventSchema = z.object({
  name: z.string(),
  date: z.string(),
  type: z.enum(['club_race', 'regatta', 'championship', 'series']),
  venue: z.string().optional(),
  boat_classes: z.array(z.string()).optional(),
});

// Schema for scraped boat/sailor
const BoatSchema = z.object({
  sail_number: z.string(),
  boat_name: z.string().optional(),
  owner: z.string().optional(),
  boat_class: z.string().optional(),
});

// Schema for scraped member
const MemberSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
});

// Schema for scraped document
const DocumentSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(['sailing_instructions', 'notice_of_race', 'results', 'newsletter', 'other']),
});

/**
 * Tool: Scrape Club Website
 * Extract race calendar, members, boats, and documents from yacht club website
 */
export function createScrapeClubWebsiteTool(): AgentTool {
  return {
    name: 'scrape_club_website',
    description: `Scrape a yacht club website to extract useful sailing data.

    This tool will:
    1. Fetch and analyze the club website
    2. Extract race calendar events
    3. Find member lists and boats/sail numbers
    4. Discover racing documents (NORs, SIs, results)
    5. Return structured data for sailor verification

    Use this after sailor provides their club's website URL.`,

    input_schema: z.object({
      url: z.string().url().describe('The yacht club website URL to scrape'),
      club_name: z.string().describe('Name of the yacht club for context'),
      sailor_id: z.string().describe('Current sailor ID for data association'),
    }),

    execute: async (input) => {

      try {
        const { textContent, links, calendarData } = await fetchAndParseWebsite(input.url, {
          followCalendarLinks: true, // Enable multi-level scraping
          maxDepth: 2 // Follow links up to 2 levels deep
        });

        // Simple pattern matching for racing data
        const raceCalendar: any[] = [];
        const boats: any[] = [];
        const members: any[] = [];
        const documents: any[] = [];

        // NEW: Add events from discovered CSV/ICS calendars
        if (calendarData && calendarData.length > 0) {

          calendarData.forEach(cal => {
            raceCalendar.push(...cal.events.map((e: any) => ({
              ...e,
              source: 'calendar_file',
              calendarType: cal.type,
              calendarUrl: cal.url
            })));

            // Add calendar file as a document
            documents.push({
              title: cal.source || `${cal.type.toUpperCase()} Calendar`,
              url: cal.url,
              type: 'calendar',
            });
          });
        }

        // Look for race-related links and text
        links.forEach(link => {
          const lowerText = link.text.toLowerCase();
          const lowerUrl = link.url.toLowerCase();

          // Detect race documents
          if (lowerText.includes('sailing instructions') || lowerUrl.includes('si_') || lowerUrl.includes('sailing')) {
            documents.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
              type: 'sailing_instructions',
            });
          } else if (lowerText.includes('notice of race') || lowerText.includes('nor') || lowerUrl.includes('nor')) {
            documents.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
              type: 'notice_of_race',
            });
          } else if (lowerText.includes('results') || lowerUrl.includes('results')) {
            documents.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
              type: 'results',
            });
          }

          // Detect races/regattas
          if (lowerText.includes('race') || lowerText.includes('regatta') || lowerText.includes('series')) {
            raceCalendar.push({
              name: link.text,
              type: 'club_race',
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
            });
          }
        });

        // Extract dates from text content
        const datePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g;
        const dates = textContent.match(datePattern) || [];

        // Build informative message
        let message = '';
        const calendarFiles = calendarData?.length || 0;
        const totalRaces = raceCalendar.length;

        if (calendarFiles > 0) {
          const calendarRaces = raceCalendar.filter(r => r.source === 'calendar_file').length;
          message = `🎯 Jackpot! I found ${calendarFiles} calendar file(s) with ${calendarRaces} race events from ${input.club_name}! Also discovered ${documents.length - calendarFiles} additional documents. Would you like me to import these races to your calendar?`;
        } else {
          message = `Found ${totalRaces} race links and ${documents.length} documents from ${input.club_name}. (Note: For automatic calendar import, try providing a direct link to the racing calendar page.)`;
        }

        const result = {
          success: true,
          data: {
            race_calendar: raceCalendar.slice(0, 50), // Increased limit for calendar files
            boats,
            members,
            documents: documents.slice(0, 20),
            club_info: {
              url: input.url,
              dates_found: dates.slice(0, 10),
            },
            calendar_files: calendarData || [],
          },
          summary: {
            races_found: totalRaces,
            boats_found: boats.length,
            members_found: members.length,
            documents_found: documents.length,
            calendar_files_found: calendarFiles,
          },
          message,
        };

        return result;

      } catch (error: any) {

        return {
          success: false,
          error: error.message,
          message: `Failed to scrape ${input.url}. The website might be protected or inaccessible. You can manually add races instead.`,
        };
      }
    },
  };
}

/**
 * Tool: Scrape Class Association Website
 * Extract race calendar, fleet info, and class documents from boat class website
 */
export function createScrapeClassWebsiteTool(): AgentTool {
  return {
    name: 'scrape_class_website',
    description: `Scrape a boat class association website to extract fleet and racing data.

    This tool will:
    1. Fetch and analyze the class association website
    2. Extract international race calendar (Worlds, Euros, etc.)
    3. Find fleet information and rankings
    4. Discover class rules and documents
    5. **Extract owner names linked to sail numbers**
    6. Return structured data for sailor verification

    Use this after sailor provides their boat class website URL.`,

    input_schema: z.object({
      url: z.string().url().describe('The boat class association website URL to scrape'),
      boat_class: z.string().describe('Name of the boat class (e.g., "Dragon", "J/70")'),
      sailor_id: z.string().describe('Current sailor ID for data association'),
      sail_number: z.string().optional().describe('Sail number to look up owner name for'),
    }),

    execute: async (input) => {

      try {
        const { textContent, links, html } = await fetchAndParseWebsite(input.url);

        // Extract fleet members from HTML tables
        const fleetMembers = extractFleetMembers(html, input.boat_class);

        // Simple pattern matching for class racing data
        const raceCalendar: any[] = [];
        const fleets: any[] = [];
        const rankings: any[] = [];
        const documents: any[] = [];
        let ownerName: string | null = null;

        // Look for race-related links and championships
        links.forEach(link => {
          const lowerText = link.text.toLowerCase();
          const lowerUrl = link.url.toLowerCase();

          // Detect championships and major events
          if (lowerText.includes('world') || lowerText.includes('championship') ||
              lowerText.includes('european') || lowerText.includes('national')) {
            raceCalendar.push({
              name: link.text,
              type: 'championship',
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
            });
          } else if (lowerText.includes('race') || lowerText.includes('regatta')) {
            raceCalendar.push({
              name: link.text,
              type: 'regatta',
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
            });
          }

          // Detect class documents - improved patterns
          if (lowerText.includes('notice of race') || lowerText.includes('nor')) {
            documents.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
              type: 'notice_of_race',
            });
          } else if (lowerText.includes('sailing instructions') || lowerText.includes('si')) {
            documents.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
              type: 'sailing_instructions',
            });
          } else if (lowerText.includes('rules') || lowerUrl.includes('rules') || lowerUrl.includes('.pdf')) {
            documents.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
              type: lowerText.includes('rules') ? 'class_rules' : 'other',
            });
          } else if (lowerText.includes('tuning') || lowerText.includes('guide')) {
            documents.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
              type: 'tuning_guide',
            });
          } else if (lowerText.includes('event') || lowerText.includes('calendar')) {
            documents.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
              type: 'calendar',
            });
          }

          // Detect fleet info
          if (lowerText.includes('fleet') || lowerText.includes('region')) {
            fleets.push({
              name: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
            });
          }

          // Detect rankings
          if (lowerText.includes('ranking') || lowerText.includes('results')) {
            rankings.push({
              title: link.text,
              url: link.url.startsWith('http') ? link.url : `${input.url}${link.url}`,
            });
          }
        });

        // Find owner name from fleet members if sail number provided
        if (input.sail_number && fleetMembers.length > 0) {
          const sailNum = input.sail_number.replace(/[^0-9]/g, ''); // Extract just numbers

          const matchingMember = fleetMembers.find(member =>
            member.sail_number === sailNum
          );

          if (matchingMember) {
            ownerName = matchingMember.owner_name;
          }
        }

        // Build message based on what was found
        let message = '';
        if (ownerName && fleetMembers.length > 0) {
          message = `Found owner **${ownerName}** for ${input.boat_class} #${input.sail_number}! Also discovered your local fleet with ${fleetMembers.length} sailors. Would you like me to suggest connecting with them in RegattaFlow?`;
        } else if (fleetMembers.length > 0) {
          message = `Found your local fleet with ${fleetMembers.length} sailors! Also found ${raceCalendar.length} race events and ${documents.length} documents.`;
        } else if (ownerName) {
          message = `Found owner **${ownerName}** for ${input.boat_class} #${input.sail_number}! Also found ${raceCalendar.length} race events and ${documents.length} documents.`;
        } else {
          message = `Found ${raceCalendar.length} race events, ${fleets.length} fleets, ${rankings.length} ranking links, and ${documents.length} documents for ${input.boat_class}.`;
        }

        const result = {
          success: true,
          data: {
            race_calendar: raceCalendar.slice(0, 20),
            fleets: fleets.slice(0, 10),
            rankings: rankings.slice(0, 10),
            documents: documents.slice(0, 20),
            fleet_members: fleetMembers, // NEW: Full fleet list for network building
            class_info: {
              url: input.url,
              boat_class: input.boat_class,
            },
            owner_name: ownerName,
          },
          summary: {
            races_found: raceCalendar.length,
            fleets_found: fleets.length,
            rankings_found: rankings.length,
            documents_found: documents.length,
            fleet_members_found: fleetMembers.length,
            owner_found: !!ownerName,
          },
          owner_name: ownerName,
          fleet_members: fleetMembers,
          message,
        };

        return result;

      } catch (error: any) {

        return {
          success: false,
          error: error.message,
          message: `Failed to scrape ${input.url}. The website might be protected or inaccessible. You can manually add race events instead.`,
        };
      }
    },
  };
}

/**
 * Smart Race Filtering
 * Categorizes races by relevance to a specific boat class
 */
interface RaceCategory {
  class_specific: Array<{ name: string; url?: string; source?: string }>;
  multi_class: Array<{ name: string; url?: string; source?: string }>;
  other_races: Array<{ name: string; url?: string; source?: string }>;
}

function filterRacesByClass(
  events: Array<{ name: string; url?: string; source?: string }>,
  boatClass: string
): RaceCategory {
  const result: RaceCategory = {
    class_specific: [],
    multi_class: [],
    other_races: [],
  };

  const classLower = boatClass.toLowerCase();
  const classVariations = [
    classLower,
    classLower.replace(/\//g, ''), // "J/70" → "j70"
    classLower.replace(/\s+/g, ''), // "International Dragon" → "internationaldragon"
  ];

  events.forEach(event => {
    const eventNameLower = event.name.toLowerCase();

    // Class-specific patterns
    const isClassSpecific = classVariations.some(variation => {
      return (
        eventNameLower.includes(variation + ' ') ||
        eventNameLower.includes(' ' + variation) ||
        eventNameLower.startsWith(variation) ||
        eventNameLower.endsWith(variation) ||
        eventNameLower === variation
      );
    });

    if (isClassSpecific) {
      result.class_specific.push(event);
      return;
    }

    // Multi-class indicators (fleet racing, club series, etc.)
    const multiClassKeywords = [
      'fleet',
      'series',
      'trophy',
      'cup',
      'championship',
      'regatta',
      'race day',
      'pursuit',
      'handicap',
    ];

    const isMultiClass = multiClassKeywords.some(keyword => eventNameLower.includes(keyword));

    // Exclude clearly different classes
    const excludedClasses = [
      'rolex',
      'china sea',
      'offshore',
      'keelboat',
      'dinghy',
      'catamaran',
      'match race',
      'team race',
    ];

    const isExcluded = excludedClasses.some(excluded => {
      return eventNameLower.includes(excluded) && !classVariations.some(v => eventNameLower.includes(v));
    });

    if (isExcluded) {
      result.other_races.push(event);
    } else if (isMultiClass) {
      result.multi_class.push(event);
    } else {
      result.other_races.push(event);
    }
  });

  return result;
}

/**
 * Enhanced PDF Document Categorization
 * Classifies documents by type based on URL and title
 */
function categorizePDFDocument(title: string, url: string): {
  title: string;
  url: string;
  type: 'notice_of_race' | 'sailing_instructions' | 'course_config' | 'results' | 'protest_form' | 'other';
} {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();

  // Notice of Race
  if (
    lowerTitle.includes('notice of race') ||
    lowerTitle.includes('nor') ||
    lowerUrl.includes('nor') ||
    lowerUrl.includes('notice_of_race')
  ) {
    return { title, url, type: 'notice_of_race' };
  }

  // Sailing Instructions
  if (
    lowerTitle.includes('sailing instructions') ||
    lowerTitle.includes('si') ||
    lowerUrl.includes('si_') ||
    lowerUrl.includes('sailing_instructions')
  ) {
    return { title, url, type: 'sailing_instructions' };
  }

  // Course Configuration
  if (
    lowerTitle.includes('course') ||
    lowerTitle.includes('marks') ||
    lowerTitle.includes('race area') ||
    lowerUrl.includes('course')
  ) {
    return { title, url, type: 'course_config' };
  }

  // Results
  if (lowerTitle.includes('results') || lowerUrl.includes('results')) {
    return { title, url, type: 'results' };
  }

  // Protest Forms
  if (
    lowerTitle.includes('protest') ||
    lowerTitle.includes('request for redress') ||
    lowerUrl.includes('protest')
  ) {
    return { title, url, type: 'protest_form' };
  }

  // Default to other
  return { title, url, type: 'other' };
}

/**
 * Standalone scraping functions for direct use (non-agent)
 * These are used by the onboarding processing screen
 */

export async function scrapeClubWebsite(url: string) {

  try {
    const { textContent, links, html, calendarData } = await fetchAndParseWebsite(url, {
      followCalendarLinks: true,
      maxDepth: 2
    });

    // Parse HTML tables for fleet data AND race schedules
    const tables = parseHTMLTable(html);

    // Simple pattern matching for racing data
    const upcoming_events: any[] = [];
    const documents: any[] = [];
    const fleet_members: any[] = [];

    // Extract races from HTML tables (common format for sailing calendars)
    tables.forEach(row => {
      // Look for table rows with race information
      // Common patterns: [Date, Event Name, Location] or [Event, Date, Time, Venue]
      if (row.length >= 2) {
        let raceName = '';
        let raceDate = null;
        let raceTime = null;
        let raceLocation = null;

        // Try to identify columns by content
        row.forEach(cell => {
          if (!raceName && (cell.toLowerCase().includes('race') || cell.toLowerCase().includes('regatta') || cell.toLowerCase().includes('series'))) {
            raceName = cell;
          }
          if (!raceDate) {
            const date = extractDate(cell);
            if (date) raceDate = date;
          }
          if (!raceTime) {
            const time = extractTime(cell);
            if (time) raceTime = time;
          }
          if (!raceLocation) {
            const location = extractLocation(cell);
            if (location) raceLocation = location;
          }
        });

        // If we found at least a name and date, add it
        if (raceName && raceDate) {
          upcoming_events.push({
            name: raceName,
            date: raceDate,
            startTime: raceTime || undefined,
            location: raceLocation || undefined,
            source: 'table_parsing'
          });
        }
      }
    });

    // Add events from discovered calendars
    if (calendarData && calendarData.length > 0) {
      calendarData.forEach(cal => {
        upcoming_events.push(...cal.events.map((e: any) => ({
          ...e,
          source: 'calendar_file',
          calendarUrl: cal.url
        })));

        documents.push({
          title: cal.source || `${cal.type.toUpperCase()} Calendar`,
          url: cal.url,
          type: 'calendar',
        });
      });
    }

    // Look for race-related links and text
    links.forEach(link => {
      const lowerText = link.text.toLowerCase();
      const lowerUrl = link.url.toLowerCase();

      // Detect race documents
      if (lowerText.includes('sailing instructions') || lowerUrl.includes('si_') || lowerUrl.includes('sailing')) {
        documents.push({
          title: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          type: 'sailing_instructions',
        });
      } else if (lowerText.includes('notice of race') || lowerText.includes('nor') || lowerUrl.includes('nor')) {
        documents.push({
          title: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          type: 'notice_of_race',
        });
      } else if (lowerText.includes('results') || lowerUrl.includes('results')) {
        documents.push({
          title: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          type: 'results',
        });
      }

      // Detect races/regattas with enhanced data extraction
      if (lowerText.includes('race') || lowerText.includes('regatta') || lowerText.includes('series')) {
        // Try to extract date/time/location from surrounding text
        const surroundingText = getSurroundingText(html, link.text, 200);
        const dateMatch = extractDate(surroundingText);
        const timeMatch = extractTime(surroundingText);
        const locationMatch = extractLocation(surroundingText);

        upcoming_events.push({
          name: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          date: dateMatch || undefined,
          startTime: timeMatch || undefined,
          location: locationMatch || undefined,
          source: 'link_scraping'
        });
      }
    });

    return {
      url,
      title: 'Club Website',
      upcoming_events,
      documents,
      fleet_members,
    };
  } catch (error: any) {
    console.error('Failed to scrape club website:', error);
    throw error;
  }
}

export async function scrapeClassWebsite(url: string, boatClass: string) {

  try {
    const { textContent, links, html } = await fetchAndParseWebsite(url);

    // Parse HTML tables for fleet data
    const tables = parseHTMLTable(html);
    const fleet_members = extractFleetMembers(html, boatClass);

    // Simple pattern matching for racing data
    const upcoming_events: any[] = [];
    const documents: any[] = [];
    const csv_calendars: string[] = [];

    // Look for race-related links
    let calendarPageUrl: string | null = null;

    links.forEach(link => {
      const lowerText = link.text.toLowerCase();
      const lowerUrl = link.url.toLowerCase();

      // Detect "Sailing Calendar" link to follow
      if (lowerText.includes('sailing calendar') && !lowerUrl.endsWith('.csv')) {
        calendarPageUrl = link.url.startsWith('http') ? link.url : `${url}${link.url}`;
      }

      // Detect CSV calendar files
      if (lowerUrl.endsWith('.csv') || lowerUrl.includes('calendar') && lowerUrl.includes('.csv')) {
        const fullUrl = link.url.startsWith('http') ? link.url : `${url}${link.url}`;
        csv_calendars.push(fullUrl);
        documents.push({
          title: link.text || 'Racing Calendar',
          url: fullUrl,
          type: 'calendar',
        });
      }

      // Detect PDF documents (enhanced categorization)
      if (lowerUrl.endsWith('.pdf') || lowerText.includes('.pdf')) {
        const fullUrl = link.url.startsWith('http') ? link.url : `${url}${link.url}`;
        const categorized = categorizePDFDocument(link.text, fullUrl);
        documents.push(categorized);
      }
      // Detect race documents (non-PDF)
      else if (lowerText.includes('sailing instructions') || lowerUrl.includes('si_') || lowerUrl.includes('sailing')) {
        documents.push({
          title: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          type: 'sailing_instructions',
        });
      } else if (lowerText.includes('notice of race') || lowerText.includes('nor') || lowerUrl.includes('nor')) {
        documents.push({
          title: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          type: 'notice_of_race',
        });
      } else if (lowerText.includes('results') || lowerUrl.includes('results')) {
        documents.push({
          title: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          type: 'results',
        });
      } else if (lowerText.includes('course') || lowerText.includes('marks')) {
        documents.push({
          title: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          type: 'course_config',
        });
      } else if (lowerText.includes('protest')) {
        documents.push({
          title: link.text,
          url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
          type: 'protest_form',
        });
      }

      // Detect races/regattas from links
      if (lowerText.includes('race') || lowerText.includes('regatta') || lowerText.includes('championship')) {
        // CRITICAL FIX: Split comma/ampersand-separated series names
        // "Croucher Series, Corinthian Series, Commodore Series, Moonraker Series & Phyloong Series"
        // Should become 5 separate races, not 1
        if (link.text.includes(',') || link.text.includes(' & ')) {

          // Split by comma and ampersand
          const seriesNames = link.text
            .split(/,| & /)
            .map(s => s.trim())
            .filter(s => s.length > 0);

          seriesNames.forEach(seriesName => {
            upcoming_events.push({
              name: seriesName,
              url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
              source: 'link_split',
              originalText: link.text, // Keep reference to original
            });
          });
        } else {
          // Single race/series
          upcoming_events.push({
            name: link.text,
            url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
            source: 'link',
          });
        }
      }
    });

    // Extract race/series names from page text
    // Common series patterns: "Croucher Series", "Commodore Series", "Phyllis Series"
    const seriesPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Series/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Trophy/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Championship/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Cup/gi,
    ];

    const foundSeries = new Set<string>();
    seriesPatterns.forEach(pattern => {
      const matches = textContent.matchAll(pattern);
      for (const match of matches) {
        const seriesName = match[0].trim();
        // Avoid generic words
        if (!['The Series', 'A Series', 'This Series', 'Next Series'].includes(seriesName)) {
          foundSeries.add(seriesName);
        }
      }
    });

    // Add series to events
    foundSeries.forEach(series => {
      if (!upcoming_events.find(e => e.name === series)) {
        upcoming_events.push({
          name: series,
          source: 'text_extraction',
        });
      }
    });

    // CRITICAL FIX: Follow "Sailing Calendar" page to find class-specific CSV files
    if (calendarPageUrl && csv_calendars.length === 0) {
      try{
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const calendarResponse = await fetch(corsProxy + encodeURIComponent(calendarPageUrl));
        const calendarHtml = await calendarResponse.text();

        // Extract all links from calendar page
        const calendarLinks = extractLinksFromHTML(calendarHtml);

        // Find class-specific CSV file
        const classCSV = calendarLinks.find(link => {
          const lowerUrl = link.url.toLowerCase();
          const lowerText = link.text.toLowerCase();
          return lowerUrl.endsWith('.csv') &&
                 (lowerText.includes(boatClass.toLowerCase()) ||
                  lowerUrl.includes(boatClass.toLowerCase()));
        });

        if (classCSV) {
          const fullCsvUrl = classCSV.url.startsWith('http') ? classCSV.url :
                            calendarPageUrl.split('/').slice(0, 3).join('/') + classCSV.url;
          csv_calendars.push(fullCsvUrl);
        }
      } catch (err) {

      }
    }

    // ENHANCEMENT: Auto-fetch and parse class-specific CSV calendars
    if (csv_calendars.length > 0) {

      const corsProxy = 'https://api.allorigins.win/raw?url=';

      for (const csvUrl of csv_calendars) {
        try {
          const response = await fetch(corsProxy + encodeURIComponent(csvUrl));
          const csvText = await response.text();

          const parsedEvents = parseCSVCalendar(csvText);

          // Add parsed events with source tracking
          parsedEvents.forEach(event => {
            upcoming_events.push({
              ...event,
              source: 'csv_calendar',
              csvUrl: csvUrl
            });
          });
        } catch (err) {
        }
      }
    }

    // Smart race filtering by boat class
    const categorized = filterRacesByClass(upcoming_events, boatClass);

    return {
      url,
      title: `${boatClass} Class`,
      upcoming_events: categorized.class_specific, // Primary: class-specific races
      multi_class_events: categorized.multi_class, // Secondary: might be relevant
      other_events: categorized.other_races, // Hidden by default
      documents,
      fleet_members,
      csv_calendars,
    };
  } catch (error: any) {
    console.error('Failed to scrape class website:', error);
    throw error;
  }
}
