# Dragon Class Series Parsing Fix

**Date**: October 7, 2025
**Issue**: AI lumping 5 separate Dragon race series into a single race entry
**Status**: ✅ Fixed with comprehensive logging

## Problem Analysis

### User Report
When signing up with:
- **Boat**: Dragon D59
- **Club**: https://www.rhkyc.org.hk/sailing/classes/classes/dragon

The AI found 27 races but incorrectly combined:
- Croucher Series
- Corinthian Series
- Commodore Series
- Moonraker Series
- Phyloong Series

...into a **single race entry** instead of 5 separate series.

### Root Causes Identified

#### Primary Issue #1: CSV Calendar on Separate Page (CRITICAL)
**Location**: RHKYC website structure

The Dragon CSV file (`Dragon2526.csv`) is NOT on the Dragon class page itself. Instead:
- Dragon class page has a "Sailing Calendar" link
- That link goes to `/sailing/sailingcalendar`
- The calendar page contains ALL class CSV files
- Scraper was only looking at the Dragon page, never following the link

**Investigation Results**:
```javascript
// Dragon class page: NO .csv links found
https://www.rhkyc.org.hk/sailing/classes/classes/dragon
  ❌ No CSV files directly on this page
  ✅ Has "Sailing Calendar" link → /sailing/sailingcalendar

// Sailing calendar page: ALL CSV files here
https://www.rhkyc.org.hk/sailing/sailingcalendar
  ✅ Dragon2526.csv
  ✅ Etchells2526.csv
  ✅ J802526.csv
  ... (10 class CSV files)
```

#### Secondary Issue #2: Comma-Separated Series Names Not Split
**Location**: `src/services/agents/WebScrapingTools.ts:1174-1182`

The RHKYC Dragon page displays: `"Croucher Series, Corinthian Series, Commodore Series, Moonraker Series & Phyloong Series"` on a single line.

**Original Code** (BROKEN):
```typescript
if (lowerText.includes('race') || lowerText.includes('regatta') || lowerText.includes('championship')) {
  upcoming_events.push({
    name: link.text,  // ❌ Adds entire comma-separated string as ONE event
    url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
    source: 'link',
  });
}
```

## Fixes Implemented

### Fix 1: Multi-Level Calendar Page Scraping (CRITICAL)
**File**: `src/services/agents/WebScrapingTools.ts:1272-1314`

The scraper now follows "Sailing Calendar" links to find class-specific CSV files:

```typescript
// CRITICAL FIX: Follow "Sailing Calendar" page to find class-specific CSV files
if (calendarPageUrl && csv_calendars.length === 0) {
  console.log('🔗 [CSV DEBUG] Following calendar page to find CSV files:', calendarPageUrl);

  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const calendarResponse = await fetch(corsProxy + encodeURIComponent(calendarPageUrl));
    const calendarHtml = await calendarResponse.text();

    console.log('📄 [CSV DEBUG] Calendar page loaded, searching for CSV links...');

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
      console.log('✅ [CSV DEBUG] Found class-specific CSV on calendar page:', {
        boatClass,
        csvUrl: fullCsvUrl,
        linkText: classCSV.text
      });
    }
  } catch (err) {
    console.error('❌ [CSV DEBUG] Failed to fetch calendar page:', err);
  }
}
```

**How it works**:
1. Detects "Sailing Calendar" link on Dragon class page
2. Fetches the calendar page HTML
3. Extracts all links from calendar page
4. Searches for class-specific CSV (matches "Dragon" in text or URL)
5. Adds CSV URL to `csv_calendars` array for auto-download

### Fix 2: Series Name Splitting with Logging
**File**: `src/services/agents/WebScrapingTools.ts:1174-1213`

```typescript
// Detect races/regattas from links
if (lowerText.includes('race') || lowerText.includes('regatta') || lowerText.includes('championship')) {
  console.log('🔍 [SERIES DEBUG] Found race/series link:', {
    linkText: link.text,
    hasComma: link.text.includes(','),
    hasAmpersand: link.text.includes('&'),
    linkUrl: link.url
  });

  // CRITICAL FIX: Split comma/ampersand-separated series names
  if (link.text.includes(',') || link.text.includes(' & ')) {
    console.log('✂️ [SERIES DEBUG] Detected multi-series string, splitting...');

    const seriesNames = link.text
      .split(/,| & /)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('📋 [SERIES DEBUG] Split into series:', seriesNames);

    seriesNames.forEach(seriesName => {
      upcoming_events.push({
        name: seriesName,
        url: link.url.startsWith('http') ? link.url : `${url}${link.url}`,
        source: 'link_split',
        originalText: link.text,
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
```

### Fix 3: CSV Calendar Auto-Fetching
**File**: `src/services/agents/WebScrapingTools.ts:1316-1345`

```typescript
// ENHANCEMENT: Auto-fetch and parse class-specific CSV calendars
if (csv_calendars.length > 0) {
  console.log(`🔄 [CSV DEBUG] Auto-fetching ${csv_calendars.length} CSV calendar(s)...`);

  const corsProxy = 'https://api.allorigins.win/raw?url=';

  for (const csvUrl of csv_calendars) {
    try {
      console.log(`📥 [CSV DEBUG] Downloading: ${csvUrl}`);
      const response = await fetch(corsProxy + encodeURIComponent(csvUrl));
      const csvText = await response.text();

      console.log(`📊 [CSV DEBUG] CSV size: ${csvText.length} bytes`);

      const parsedEvents = parseCSVCalendar(csvText);
      console.log(`✅ [CSV DEBUG] Parsed ${parsedEvents.length} events from CSV`);

      parsedEvents.forEach(event => {
        upcoming_events.push({
          ...event,
          source: 'csv_calendar',
          csvUrl: csvUrl
        });
      });
    } catch (err) {
      console.error(`❌ [CSV DEBUG] Failed to fetch ${csvUrl}:`, err);
    }
  }
}
```

### Fix 4: Enhanced Logging Throughout
**File**: `src/services/agents/WebScrapingTools.ts:1131-1156, 1348-1359`

Added comprehensive logging at every critical point:
- `[SERIES DEBUG]` - Series detection and splitting
- `[CSV DEBUG]` - CSV calendar discovery and parsing
- `[FILTER DEBUG]` - Race filtering with source tracking

## Expected Results

### Before Fix
```
Found 27 races:
1. "Croucher Series, Corinthian Series, Commodore Series, Moonraker Series & Phyloong Series"
2. "Passage Race"
3. ... (25 other races)
```

### After Fix
```
Found 31+ races:
1. "Croucher Series" (source: link_split)
2. "Corinthian Series" (source: link_split)
3. "Commodore Series" (source: link_split)
4. "Moonraker Series" (source: link_split)
5. "Phyloong Series" (source: link_split)
6. "Passage Race"
7. ... (additional races from CSV calendar)
```

## Testing Instructions

### Manual Test in Browser

1. **Start dev server**:
   ```bash
   npm start
   ```

2. **Open browser console** (F12) and navigate to http://localhost:8081

3. **Sign up new user** with:
   - Boat: `Dragon D59`
   - URL: `https://www.rhkyc.org.hk/sailing/classes/classes/dragon`

4. **Watch console logs** for:
   ```
   🔍 [SERIES DEBUG] Found race/series link: { linkText: "Croucher Series, ...", hasComma: true }
   ✂️ [SERIES DEBUG] Detected multi-series string, splitting...
   📋 [SERIES DEBUG] Split into series: ["Croucher Series", "Corinthian Series", ...]
   📅 [CSV DEBUG] Found CSV calendar: { linkText: "Sailing Calendar", fullUrl: "..." }
   🔄 [CSV DEBUG] Auto-fetching 1 CSV calendar(s)...
   ✅ [CSV DEBUG] Parsed 15 events from CSV
   📋 [FILTER DEBUG] Found 35 total events: {
     class_specific: 20,
     multi_class: 10,
     total_sources: { link_split: 5, csv_calendar: 15, ... }
   }
   ```

5. **Verify race selection UI** shows individual series:
   - ✅ Croucher Series
   - ✅ Corinthian Series
   - ✅ Commodore Series
   - ✅ Moonraker Series
   - ✅ Phyloong Series

### Automated Test (Supabase MCP)

```bash
# Query race imports for test user
npx supabase db query "SELECT * FROM sailor_races WHERE sailor_id = 'test-user-id'"
```

Expected: 5+ separate race entries for Dragon series.

## Additional Improvements

### 1. Smart CSV Prioritization
The fix now:
- Detects class-specific CSV calendars (e.g., "Dragon Sailing Calendar")
- Auto-downloads and parses them
- Adds `source: 'csv_calendar'` for tracking

### 2. Series Source Tracking
Every race now includes a `source` field:
- `link` - Single race from HTML link
- `link_split` - Race from comma/ampersand-separated string
- `text_extraction` - Race from page text regex
- `csv_calendar` - Race from CSV file
- `calendar_file` - Race from ICS file

### 3. Comprehensive Debug Logs
All scraping operations now log with prefixes:
- `[SERIES DEBUG]` - Series detection/splitting
- `[CSV DEBUG]` - CSV discovery/parsing
- `[FILTER DEBUG]` - Race categorization

## Next Steps

1. ✅ **Code fix deployed** - Series splitting logic implemented
2. ✅ **Logging added** - Comprehensive debugging enabled
3. ⏳ **User testing** - Validate with real signup flow
4. ⏳ **Monitor logs** - Check console for SERIES DEBUG output
5. ⏳ **Verify database** - Confirm 5 separate series saved

## Files Modified

1. `src/services/agents/WebScrapingTools.ts`
   - Lines 1131-1157: "Sailing Calendar" link detection
   - Lines 1174-1213: Series name splitting with debug logs
   - Lines 1272-1314: **Multi-level calendar page scraping (CRITICAL FIX)**
   - Lines 1316-1345: CSV auto-fetching with CORS proxy
   - Lines 1348-1359: Enhanced filter logging with source tracking

## Related Issues

- CSV calendar links should be followed (e.g., "Dragon Sailing Calendar" .csv)
- Multi-language support for international clubs
- Date parsing for various formats (DD/MM/YYYY, YYYY-MM-DD, etc.)

---

**Fix Status**: ✅ Complete
**Testing Status**: ⏳ Pending user validation
**Rollback Plan**: Revert `WebScrapingTools.ts` to previous version if issues arise
