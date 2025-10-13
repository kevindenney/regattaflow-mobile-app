# Direct Paste Fields Implementation

## Overview
Added direct paste/upload fields to help users manually input racing calendar data, SI/NOR text, and race area images when automatic web scraping fails or is incomplete.

## Problem Solved
- Web scraping finds PDFs but doesn't extract CSV calendar data
- Users need a way to manually provide calendar information
- SIs/NORs often need manual text input for AI analysis
- Race area images/maps need easy upload option

## Features Added

### 1. Calendar CSV/Table Paste Field
**Location**: Comprehensive onboarding form (Section 5: Next Race)
- **Purpose**: Allow users to copy/paste racing calendar data from Excel, Google Sheets, or CSV files
- **UI**: Purple-themed multi-line text input (100px min height)
- **Placeholder**: Example CSV format guidance
- **Database**: Stored in `races.calendar_paste_data` (TEXT column)

### 2. SIs/NORs Text Paste Field
**Location**: Comprehensive onboarding form (Section 5: Next Race)
- **Purpose**: Allow users to copy/paste Sailing Instructions or Notice of Race text for AI analysis
- **UI**: Purple-themed multi-line text input (120px min height)
- **Placeholder**: Explains AI will extract course details, marks, timing
- **Database**: Stored in `races.si_nor_paste_data` (TEXT column)

### 3. Race Area Image URL Field
**Location**: Comprehensive onboarding form (Section 5: Next Race)
- **Purpose**: Allow users to paste link to course map, race area diagram, or aerial photo
- **UI**: Purple-themed single-line text input
- **Placeholder**: URL format guidance
- **Database**: Stored in `races.race_area_image_url` (TEXT column)

## User Experience

### Chat Interface Updates
- Updated help text to mention CSV/calendar data pasting
- Added guidance for SIs/NORs text pasting
- Purple-themed "Quick Paste Options" section clearly separated from manual form fields

### Form Interface
- New purple-bordered section titled "📋 Quick Paste Options"
- Positioned between race selector and manual race input fields
- Clear labels and placeholder text guide users
- Visual separation from other form sections

## Database Schema

### Migration: `20251107_add_race_paste_fields.sql`

```sql
ALTER TABLE races
ADD COLUMN IF NOT EXISTS calendar_paste_data TEXT,
ADD COLUMN IF NOT EXISTS si_nor_paste_data TEXT,
ADD COLUMN IF NOT EXISTS race_area_image_url TEXT;
```

### Column Descriptions
- `calendar_paste_data`: Raw CSV or table data from Excel/Sheets
- `si_nor_paste_data`: SI/NOR text for AI extraction
- `race_area_image_url`: Link to course map/aerial image

## Future Enhancements

### Immediate Next Steps
1. **AI Processing**: Use Anthropic/Gemini to parse `calendar_paste_data` and extract race events
2. **AI Extraction**: Analyze `si_nor_paste_data` to extract course details, marks, timing
3. **Image Analysis**: Use vision AI to extract course info from `race_area_image_url`

### Advanced Features
1. **CSV Parsing**: Automatic detection of column headers and race data structure
2. **Document Upload**: Native file picker for PDFs instead of just URLs
3. **Image Upload**: Direct image upload with vision AI analysis
4. **Batch Race Import**: Parse calendar data to create multiple upcoming races

## Files Modified

### Frontend
1. `src/app/(auth)/sailor-onboarding-chat.tsx`
   - Updated help text with paste field information

2. `src/app/(auth)/sailor-onboarding-comprehensive.tsx`
   - Added 3 new state variables: `calendarPasteData`, `siNorPasteData`, `raceAreaImageUri`
   - Added purple-themed "Quick Paste Options" UI section
   - Updated `raceData` object in `handleSubmit` to include new fields

### Backend
1. `supabase/migrations/20251107_add_race_paste_fields.sql`
   - New migration adding 3 TEXT columns to races table

## Testing Checklist

- [ ] Calendar CSV paste saves to database
- [ ] SI/NOR text paste saves to database
- [ ] Race area image URL saves to database
- [ ] Fields persist when switching between chat and form
- [ ] Purple UI section renders correctly on mobile
- [ ] Multiline text inputs expand properly
- [ ] Form validation works with optional paste fields
- [ ] Data displays correctly in dashboard after onboarding

## Usage Instructions

### For Users:
1. **Calendar Data**: Copy racing calendar from Excel/Google Sheets → Paste into "Paste Racing Calendar" field
2. **SI/NOR Text**: Copy text from sailing instructions PDF → Paste into "Paste SIs/NORs Text" field
3. **Race Area Image**: Find course map URL → Paste into "Race Area Image URL" field

### For Developers:
- Access paste data via race object: `race.calendar_paste_data`, `race.si_nor_paste_data`, `race.race_area_image_url`
- Integrate AI parsing in future sprint to extract structured data
- Consider vision AI integration for race area image analysis
