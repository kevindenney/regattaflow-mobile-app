# Sailor Onboarding: Web Scraping Enhancement

## Overview

The sailor onboarding flow now includes intelligent web scraping to automatically import racing data from club and boat class websites. This significantly reduces manual data entry and provides a richer initial profile.

## Feature Flow

### 1. URL Collection
After collecting boat details (class, sail number, boat name), the AI agent asks:

```
"Do you have a link to your club's website?"
"Do you have a link to your boat class website or association?"
```

### 2. Web Scraping
When the sailor provides a URL, the agent uses Claude to intelligently scrape and extract:

#### Club Website Data:
- **Race Calendar**: Upcoming club races, series, and regattas
- **Fleet Information**: Boats, sail numbers, and owner names
- **Members**: Publicly listed sailors and contact info
- **Documents**: Sailing instructions, notices of race, results PDFs
- **Club Info**: Racing schedule, popular boat classes, general info

#### Class Website Data:
- **International Calendar**: World Championships, Continental Championships
- **Fleet Information**: Regional fleets and boat counts
- **Rankings**: World and national rankings (if available)
- **Class Documents**: Class rules, measurement forms, tuning guides
- **Class Info**: Boat statistics, history, technical specs

### 3. Data Verification
The agent presents scraped data in a user-friendly summary:

```
🎯 I found some great info from Royal Hong Kong Yacht Club!

**Race Calendar**: 12 upcoming races including Wednesday Night Series, Spring Regatta
**Fleet**: 25 Dragon boats with sail numbers like HKG 59, HKG 82, HKG 115
**Members**: 45 sailors listed including John Smith (Sailing Secretary)
**Documents**: 8 racing documents like Spring Series SIs, Annual Race Program

Does this look like the right club? Would you like me to import any of this data?
```

### 4. Data Import
If the sailor confirms, the agent automatically:
- Adds race calendar events to the sailor's calendar
- Verifies boat/sail number ownership matches
- Saves racing documents to the sailor's library
- Suggests social connections with other members

## Technical Implementation

### New Tools

#### `scrape_club_website`
Located in: `src/services/agents/WebScrapingTools.ts`

**Input Schema:**
```typescript
{
  url: string;           // Club website URL
  club_name: string;     // Name of the yacht club
  sailor_id: string;     // Current sailor ID
}
```

**Output:**
```typescript
{
  success: boolean;
  data: {
    race_calendar: RaceEvent[];
    boats: Boat[];
    members: Member[];
    documents: Document[];
    club_info: any;
  };
  summary: {
    races_found: number;
    boats_found: number;
    members_found: number;
    documents_found: number;
  };
  message: string;
}
```

#### `scrape_class_website`
Located in: `src/services/agents/WebScrapingTools.ts`

**Input Schema:**
```typescript
{
  url: string;           // Class association website URL
  boat_class: string;    // Name of boat class
  sailor_id: string;     // Current sailor ID
}
```

**Output:**
```typescript
{
  success: boolean;
  data: {
    race_calendar: RaceEvent[];
    fleets: Fleet[];
    rankings: Ranking[];
    documents: Document[];
    class_info: any;
  };
  summary: {
    races_found: number;
    fleets_found: number;
    rankings_found: number;
    documents_found: number;
  };
  message: string;
}
```

### Scraping Strategy

The scraping tools use simple HTML parsing and pattern matching:

1. **Fetch Website**: URL content is fetched using standard fetch API
2. **HTML Parsing**: Remove scripts/styles and extract text and links
3. **Pattern Matching**: Search for keywords like "race", "regatta", "sailing instructions", "results"
4. **Link Detection**: Identify racing documents (PDFs, SIs, NORs) from link text and URLs
5. **Structured Output**: Return organized data for user verification
6. **User Verification**: Human-in-the-loop confirms before import

**Note**: This is a simplified approach that works client-side without requiring AI inference. For more sophisticated extraction, users can click discovered links to view detailed information.

### Agent Integration

The ConversationalOnboardingAgent now includes:

**Updated Conversation Flow (Step 6):**
```typescript
6. **Club & Class URLs** - Ask for website links to scrape:
   - "Do you have a link to your club's website?" (e.g., "https://rhkyc.com.hk")
   - "Do you have a link to your boat class website or association?" (e.g., "https://intdragon.net")
   - If URLs provided, call scrape_club_website and scrape_class_website tools
   - Present discovered data (race calendar, members, boats, documents) and ask sailor to verify
   - "I found [X races, Y boats, Z members] from your club. Does this look right?"
   - Import verified data automatically
```

**New System Prompt Section:**
```typescript
WEBSITE SCRAPING VERIFICATION FLOW:
1. After sailor provides club/class URL, call appropriate scraping tool
2. Present discoveries in a friendly summary with key highlights
3. If sailor confirms, automatically import relevant data
4. If sailor says no or data is wrong, ask for clarification
```

## Example Conversation

```
AI: "What's your sail number for the Dragon?"
User: "HKG 59"

AI: "Great! Do you have a link to your club's website? This will help me import race calendars and find other sailors."
User: "https://rhkyc.org.hk"

AI: [Calls scrape_club_website tool]

AI: "🎯 I found some great info from Royal Hong Kong Yacht Club!

**Race Calendar**: 12 upcoming races including:
  - Wednesday Night Series (starts Mar 20)
  - Spring Regatta (Apr 15-17)
  - Dragon Championship (May 20-22)

**Fleet**: 25 Dragon boats including HKG 59 (that's you!), HKG 82, HKG 115
**Members**: 45 sailors listed including Peter Wong (Dragon Fleet Captain)
**Documents**: 8 racing documents including Spring Series SIs

Does this look right? Would you like me to import this race calendar?"

User: "Yes, looks perfect!"

AI: "Excellent! I've imported the race calendar. Now, do you have a link to the International Dragon Association website?"
User: "https://intdragon.net"

AI: [Calls scrape_class_website tool]

AI: "🎯 Found the Dragon class calendar!

**International Races**: 8 major events including:
  - Dragon World Championship (Helsinki, Aug 15-22)
  - European Championship (Cascais, Jun 10-15)

**Class Documents**: Dragon Class Rules 2024, Tuning Guide, Measurement Certificate

Want me to add these to your calendar too?"
```

## Benefits

1. **Reduced Manual Entry**: Automatically populates race calendar, fleet info, and documents
2. **Data Accuracy**: Scrapes directly from authoritative sources (club/class websites)
3. **Social Discovery**: Finds other sailors and suggests connections
4. **Document Library**: Automatically saves important racing documents
5. **Competitive Intelligence**: Imports rankings and fleet statistics

## Error Handling

If scraping fails (protected site, authentication required, etc.):

```
AI: "I wasn't able to access that website automatically. It might require a login or be protected. No worries though! I can still help you add races manually. What's your next race?"
```

## Testing

Test the scraping functionality:

```bash
npx tsx scripts/test-web-scraping.ts
```

This will test scraping against:
- Royal Hong Kong Yacht Club (https://rhkyc.org.hk)
- International Dragon Association (https://intdragon.net)

## Future Enhancements

1. **Authentication Support**: Handle login-protected club member areas
2. **Smart Caching**: Cache scraped data for other sailors from same club
3. **Automatic Updates**: Periodic re-scraping to keep calendars current
4. **Multi-language Support**: Extract data from non-English websites
5. **Results Import**: Scrape past race results and import performance data
6. **Fleet Analytics**: Generate insights from discovered fleet data

## Privacy Considerations

- Only scrapes **publicly available** information
- Respects robots.txt and website terms of service
- Requires explicit sailor confirmation before importing data
- Does not store or share website credentials
- Sailor can skip URL collection entirely

## File Locations

- Web Scraping Tools: `src/services/agents/WebScrapingTools.ts`
- Agent Integration: `src/services/agents/ConversationalOnboardingAgent.ts`
- Test Script: `scripts/test-web-scraping.ts`
- Documentation: `docs/onboarding-web-scraping.md` (this file)
