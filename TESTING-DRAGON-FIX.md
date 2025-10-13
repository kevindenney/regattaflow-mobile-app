# Dragon Series Parsing - Debug Testing Instructions

## What Was Fixed

### 1. Multi-Level Calendar Scraping (CRITICAL FIX)
**File**: `WebScrapingTools.ts:1272-1314`

The scraper now follows "Sailing Calendar" links from class pages:
- Detects "Sailing Calendar" link on Dragon class page
- Follows link to `/sailing/sailingcalendar` page
- Searches for class-specific CSV files (e.g., `Dragon2526.csv`)
- Downloads and parses CSV calendar automatically

**Why this was needed**: RHKYC organizes CSV files on a separate calendar page, not on individual class pages. The scraper was only looking at the Dragon page itself.

### 2. URL Classification Logic
**File**: `ConversationalOnboardingAgent.ts:697-720`

The agent now detects if a URL is a **class website** (Dragon, J/70, etc.) vs a club website and calls the appropriate scraper:
- Class URLs → `scrapeClassWebsite()` with CSV auto-fetch
- Club URLs → `scrapeClubWebsite()`

### 3. Series Name Splitting
**File**: `WebScrapingTools.ts:1174-1213`

Comma/ampersand-separated series are now split:
- `"Croucher Series, Corinthian Series, Commodore Series..."` → 5 separate races

### 4. Comprehensive Debugging
Added debug logs at every step:
- `[SCRAPE DEBUG]` - URL classification & scraping
- `[SERIES DEBUG]` - Series detection & splitting
- `[CSV DEBUG]` - CSV discovery, page following & parsing
- `[CSV PARSE DEBUG]` - Individual CSV row parsing
- `[NEXT RACE DEBUG]` - Next race selection logic

## Testing Steps

### 1. Open Browser Console

1. Start dev server:
   ```bash
   npm start
   ```

2. Open http://localhost:8081 in Chrome

3. Open DevTools Console (F12 → Console tab)

4. **Enable all log levels** (click filter dropdown, check all)

### 2. Run Test Signup

Enter in the onboarding chat:
```
Dragon D59. https://www.rhkyc.org.hk/sailing/classes/classes/dragon
```

### 3. Monitor Console Logs

You should see logs in this sequence:

#### Step 1: URL Classification
```javascript
🌐 [SCRAPE DEBUG] Starting to scrape URL: https://www.rhkyc.org.hk/sailing/classes/classes/dragon
🔍 [SCRAPE DEBUG] Document type: ...
🔍 [SCRAPE DEBUG] Extracted boats: [{className: "Dragon", ...}]
🎯 [SCRAPE DEBUG] URL classification: {
  isClassWebsite: true,  // ← CRITICAL: Must be true!
  url: "https://www.rhkyc.org.hk/sailing/classes/classes/dragon",
  hasBoatClass: true
}
🚢 [SCRAPE DEBUG] Using scrapeClassWebsite for: Dragon  // ← Using correct scraper!
```

#### Step 2: Calendar Page Following (NEW!)
```javascript
📅 [CSV DEBUG] Found sailing calendar page link: https://www.rhkyc.org.hk/sailing/sailingcalendar
🔗 [CSV DEBUG] Following calendar page to find CSV files: https://www.rhkyc.org.hk/sailing/sailingcalendar
📄 [CSV DEBUG] Calendar page loaded, searching for CSV links...
✅ [CSV DEBUG] Found class-specific CSV on calendar page: {
  boatClass: "Dragon",
  csvUrl: "https://www.rhkyc.org.hk/storage/app/media/Sailing/sailing%20calendar/Dragon2526.csv",
  linkText: "Dragon - updated on 19 Sept"
}
```

#### Step 3: CSV Auto-Fetch
```javascript
🔄 [CSV DEBUG] Auto-fetching 1 CSV calendar(s)...
📥 [CSV DEBUG] Downloading: https://...Dragon2526.csv
📊 [CSV DEBUG] CSV size: 3241 bytes  // ← Actual data downloaded!
```

#### Step 4: CSV Parsing
```javascript
📄 [CSV PARSE DEBUG] Starting CSV parse, total lines: 35
📄 [CSV PARSE DEBUG] First 3 lines: [
  "Subject,Start Date,Location,All Day Event,Private",
  "Champ of Champs,30/08/2025,Middle Island,TRUE,FALSE",
  "Champ of Champs Resail,31/08/2025,Middle Island,TRUE,FALSE"
]
📊 [CSV PARSE DEBUG] CSV column mapping: {
  dateIdx: 1,      // ← "Start Date" column found
  nameIdx: 0,      // ← "Subject" column found
  timeIdx: -1,
  locationIdx: 2,  // ← "Location" column found
  headers: ["subject", "start date", "location", "all day event", "private"]
}
```

#### Step 5: Individual Row Parsing
```javascript
📝 [CSV PARSE DEBUG] Row 1: ["Champ of Champs", "30/08/2025", "Middle Island", "TRUE"]
📅 [CSV PARSE DEBUG] Date converted: 30/08/2025 -> 2025-08-30
✅ [CSV PARSE DEBUG] Added event: Champ of Champs on 2025-08-30

📝 [CSV PARSE DEBUG] Row 6: ["Croucher 3 & 4", "19/10/2025", "Port Shelter", "TRUE"]
📅 [CSV PARSE DEBUG] Date converted: 19/10/2025 -> 2025-10-19
✅ [CSV PARSE DEBUG] Added event: Croucher 3 & 4 on 2025-10-19  // ← FOUND IT!
```

#### Step 6: Series Splitting (HTML Links)
```javascript
🔍 [SERIES DEBUG] Found race/series link: {
  linkText: "Croucher Series, Corinthian Series, Commodore Series, Moonraker Series & Phyloong Series",
  hasComma: true,
  hasAmpersand: true
}
✂️ [SERIES DEBUG] Detected multi-series string, splitting...
📋 [SERIES DEBUG] Split into series: [
  "Croucher Series",
  "Corinthian Series",
  "Commodore Series",
  "Moonraker Series",
  "Phyloong Series"
]
```

#### Step 7: Race Filtering
```javascript
📋 [FILTER DEBUG] Found 60 total events: {
  class_specific: 40,
  multi_class: 15,
  other_races: 5,
  csv_calendars: 1,
  total_sources: {
    link: 5,
    link_split: 5,           // ← Series from split
    text_extraction: 8,
    csv_calendar: 42         // ← CSV events!
  }
}
```

#### Step 8: Next Race Selection
```javascript
🏁 [NEXT RACE DEBUG] Starting next race selection: {
  hasExtractedNextRace: false,
  hasPreviousNextRace: false,
  totalUpcomingRaces: 60
}
📅 [NEXT RACE DEBUG] Today's date: 2025-10-07T...
📋 [NEXT RACE DEBUG] All upcoming races: [
  {name: "Croucher 3 & 4", date: "2025-10-19", source: "csv_calendar"},
  {name: "Corinthian 3 & 4", date: "2025-11-08", source: "csv_calendar"},
  ...
]
📆 [NEXT RACE DEBUG] Croucher 3 & 4: 2025-10-19 -> FUTURE  // ← Correctly identified!
📆 [NEXT RACE DEBUG] Passage Race: 2025-09-06 -> PAST
🔮 [NEXT RACE DEBUG] Future races: [
  {name: "Croucher 3 & 4", date: "2025-10-19", source: "csv_calendar"},
  ...
]
✅ [NEXT RACE DEBUG] Auto-selected next race: {
  name: "Croucher 3 & 4",     // ← CORRECT!
  date: "2025-10-19",          // ← October 19!
  startTime: "",
  location: "Port Shelter"
}
```

#### Step 9: Final Scraping Summary
```javascript
✅ [SCRAPE DEBUG] Scraping completed: {
  upcoming_events: 60,
  documents: 8,
  csv_calendars: 1
}
📅 [SCRAPE DEBUG] Adding 60 events: [
  {name: "Croucher 3 & 4", source: "csv_calendar", date: "2025-10-19"},
  {name: "Corinthian Series", source: "link_split", date: undefined},
  ...
]
```

## Expected Results

### Race List Should Show:
1. ✅ **Separate series entries**:
   - Croucher Series
   - Corinthian Series
   - Commodore Series
   - Moonraker Series
   - Phyloong Series

2. ✅ **CSV calendar races**:
   - Croucher 3 & 4 (Oct 19, 2025)
   - Croucher 5 & 6 (Oct 25, 2025)
   - Corinthian 1 & 2 (Nov 1, 2025)
   - etc.

### Next Race Should Be:
- **Name**: "Croucher 3 & 4"
- **Date**: October 19, 2025
- **Location**: Port Shelter

## Troubleshooting

### Issue 1: Still shows lumped series
**Check console for**:
```javascript
🎯 [SCRAPE DEBUG] URL classification: { isClassWebsite: false }  // ← WRONG!
🏛️ [SCRAPE DEBUG] Using scrapeClubWebsite  // ← Using wrong scraper!
```

**Fix**: URL classification logic needs adjustment

### Issue 2: CSV not found
**Check console for**:
```javascript
📅 [CSV DEBUG] Found CSV calendar: ...  // ← Should appear
🔄 [CSV DEBUG] Auto-fetching...  // ← Should appear
```

**If missing**: CSV link detection failed

### Issue 3: CSV parsing failed
**Check console for**:
```javascript
📄 [CSV PARSE DEBUG] CSV size: 0 bytes  // ← No data!
❌ [CSV DEBUG] Failed to fetch ...  // ← CORS error?
```

**Fix**: CORS proxy issue or wrong URL

### Issue 4: Wrong next race
**Check console for**:
```javascript
📆 [NEXT RACE DEBUG] Croucher 3 & 4: 2025-10-19 -> PAST  // ← Date logic wrong!
```

**Fix**: Date comparison or parsing issue

## Debug Checklist

- [ ] URL classified as `isClassWebsite: true`
- [ ] Uses `scrapeClassWebsite` (not `scrapeClubWebsite`)
- [ ] **"Sailing Calendar" link detected on Dragon page**
- [ ] **Calendar page followed and loaded**
- [ ] **Dragon2526.csv found on calendar page**
- [ ] CSV downloaded (size > 0 bytes)
- [ ] CSV headers mapped correctly
- [ ] Croucher 3 & 4 parsed from CSV row 6
- [ ] Date converted: `19/10/2025` → `2025-10-19`
- [ ] Croucher 3 & 4 marked as FUTURE
- [ ] Next race = "Croucher 3 & 4" on Oct 19
- [ ] Series split into 5 separate entries

## Files Modified

1. `src/services/agents/ConversationalOnboardingAgent.ts`
   - Lines 690-743: URL classification & scraping
   - Lines 746-804: Next race selection with debug logs

2. `src/services/agents/WebScrapingTools.ts`
   - Lines 212-293: CSV parsing with debug logs
   - Lines 1174-1213: Series splitting with debug logs
   - Lines 1251-1280: CSV auto-fetch with debug logs

## Next Steps After Testing

1. **If logs show CSV is found and parsed**:
   - Check why it's not showing in UI
   - Verify data flow from scraper → agent → UI

2. **If logs show CSV is NOT found**:
   - Inspect actual HTML of Dragon page
   - Check if CSV link pattern changed

3. **If series still lumped**:
   - Check which scraper is being used
   - Verify URL classification logic

4. **If next race is wrong**:
   - Check date parsing logic
   - Verify future/past filtering

---

**Run the test and paste console logs in bug report for analysis!**
