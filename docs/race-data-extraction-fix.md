# Race Data Extraction Fix

**Date:** October 7, 2025
**Issue:** Race cards showing only names, missing date/time/location
**Status:** ✅ Fixed

## Problem

When users went through the conversational onboarding and the AI scraped their club website, the race cards displayed only the race names without dates, start times, or locations:

```
❌ Before:
┌─────────────────────┐
│ Spring Championship │
│ 📅                  │  <- Empty
│ ⏰                  │  <- Empty
│ 📍                  │  <- Empty
└─────────────────────┘
```

## Root Cause

The web scraper had two extraction methods:

1. **Calendar Files (CSV/ICS)** - ✅ Extracted complete data
2. **Link Scraping** - ❌ Only extracted race names

When the RHKYC website (and similar sites) didn't have calendar files, the scraper fell back to link scraping which only captured:
```typescript
{
  name: "Spring Championship",
  url: "https://..."
  // Missing: date, startTime, location
}
```

## Solution

Enhanced the web scraper with intelligent HTML parsing in `src/services/agents/WebScrapingTools.ts`:

### 1. **Added Helper Functions** (Lines 9-130)

```typescript
// Extract dates in multiple formats
extractDate(text: string): string | null
// Supports: DD/MM/YYYY, Month DD YYYY, YYYY-MM-DD, etc.

// Extract times with AM/PM support
extractTime(text: string): string | null
// Supports: HH:MM AM/PM, 24-hour format

// Find venue names
extractLocation(text: string): string | null
// Matches: "Hong Kong YC", "Marina Bay", etc.

// Get context around links
getSurroundingText(html: string, searchText: string): string
```

### 2. **Enhanced Link Scraping** (Lines 1026-1043)

```typescript
// Before
upcoming_events.push({
  name: link.text,
  url: link.url
});

// After
const surroundingText = getSurroundingText(html, link.text, 200);
const dateMatch = extractDate(surroundingText);
const timeMatch = extractTime(surroundingText);
const locationMatch = extractLocation(surroundingText);

upcoming_events.push({
  name: link.text,
  url: link.url,
  date: dateMatch || undefined,           // ✅ NEW
  startTime: timeMatch || undefined,      // ✅ NEW
  location: locationMatch || undefined,   // ✅ NEW
  source: 'link_scraping'
});
```

### 3. **Added HTML Table Parsing** (Lines 983-1025)

```typescript
// Parse race schedule tables
tables.forEach(row => {
  let raceName = '';
  let raceDate = null;
  let raceTime = null;
  let raceLocation = null;

  // Identify columns by content
  row.forEach(cell => {
    if (!raceName && cell.includes('race')) raceName = cell;
    if (!raceDate) raceDate = extractDate(cell);
    if (!raceTime) raceTime = extractTime(cell);
    if (!raceLocation) raceLocation = extractLocation(cell);
  });

  if (raceName && raceDate) {
    upcoming_events.push({
      name: raceName,
      date: raceDate,
      startTime: raceTime || undefined,
      location: raceLocation || undefined,
      source: 'table_parsing'
    });
  }
});
```

## Result

```
✅ After:
┌──────────────────────────────┐
│ Spring Championship          │
│ 📅 2025-04-15               │  <- Extracted from context
│ ⏰ 10:00                     │  <- Extracted from nearby text
│ 📍 Hong Kong YC              │  <- Extracted from surrounding HTML
└──────────────────────────────┘
```

## Testing

To test the improvement:

1. **Reset onboarding** (already done):
```sql
UPDATE users
SET onboarding_completed = false,
    onboarding_step = 'user_type_selected',
    onboarding_data = '{}'::jsonb
WHERE id = '51241049-02ed-4e31-b8c6-39af7c9d4d50';
```

2. **Go through onboarding**:
   - Visit `/sailor-onboarding-chat`
   - Paste: `Dragon d59. This is my club: https://www.rhkyc.org.hk/sailing/classes/classes/Dragon`
   - Wait for AI to scrape
   - Click "Switch to Form"
   - **Verify race cards show dates, times, and locations**

## Data Sources (Priority Order)

1. 📅 **Calendar Files** (CSV/ICS) - Full data with high accuracy
2. 📊 **HTML Tables** - Structured race schedules (NEW!)
3. 🔗 **Link Context** - Contextual extraction from surrounding text (NEW!)

## Files Modified

- `src/services/agents/WebScrapingTools.ts`
  - Added: `extractDate()`, `extractTime()`, `extractLocation()`, `getSurroundingText()`
  - Enhanced: `scrapeClubWebsite()` link processing
  - Added: HTML table race extraction

## Edge Cases Handled

- ✅ Multiple date formats (DD/MM/YYYY, Month DD YYYY, YYYY-MM-DD)
- ✅ 12/24 hour time formats with AM/PM
- ✅ Various venue name patterns
- ✅ Missing data (graceful fallback to `undefined`)
- ✅ Tables without headers (content-based column detection)

## Future Improvements

1. **Machine Learning** - Train a model on sailing websites for better accuracy
2. **Venue Intelligence** - Auto-detect venue from club URL
3. **Multi-language Support** - Parse dates in different languages
4. **OCR Integration** - Extract from race calendar images
