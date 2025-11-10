# How to Apply the NOR Fields Migration

## Quick Start

The database migration file is ready at:
`supabase/migrations/20251107000000_add_nor_document_fields.sql`

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20251107000000_add_nor_document_fields.sql`
6. Click **Run** (or press Cmd+Enter)
7. Verify success message

## Option 2: Via Supabase CLI

```bash
# If your migration history is clean:
npx supabase db push

# If you get migration history errors, first repair:
npx supabase migration repair --status reverted 20251104
npx supabase db pull
# Then try push again
npx supabase db push
```

## Verify Migration Applied

Run this query in the Supabase SQL Editor to verify:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'regattas'
  AND column_name IN (
    'supplementary_si_url',
    'nor_amendments',
    'governing_rules',
    'event_series_name',
    'event_type',
    'racing_days',
    'course_area_designation',
    'prizes_description'
  )
ORDER BY column_name;
```

You should see 8 rows (sample of the new fields).

## Testing After Migration

1. **Start the app**: `npm start` or `npx expo start`
2. **Navigate to**: Add Race or Edit Race screen
3. **Look for new sections**:
   - Governing Rules & Eligibility
   - Event Schedule
   - Course & Area Details
   - Series Scoring
   - Safety & Insurance
   - Prizes & Awards
   - Document References

4. **Test data entry**:
   - Fill in some fields from the Dragon Class NOR
   - Save the race
   - Edit the race again
   - Verify all data persists

## Sample Test Data (from Dragon Class NOR)

Use this to test the implementation:

```
Event Series Name: Corinthian Series
Event Type: Series Race
Racing Rules System: RRS 2021-2024
Class Rules: Dragon Class Rules
Prescriptions: HKSF Prescriptions
Course Area Designation: Port Shelter
Races Per Day: 2
Discards Policy: No discards
Notice of Race URL: https://rhkyc.org.hk/storage/app/media/Classes/Dragon/DragonStandardNOR.pdf
```

## Troubleshooting

### Error: "column already exists"
This is fine - the migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times.

### Error: "permission denied"
Make sure you're using the Supabase dashboard SQL Editor with your logged-in session, or that your CLI is properly authenticated.

### Fields not showing in UI
1. Make sure you've restarted the Metro bundler
2. Clear cache: `npx expo start --clear`
3. Check browser console for any TypeScript errors

## Next Steps

Once the migration is applied and tested:
1. Use the new fields to enter NOR data for the Corinthian 3 & 4 race
2. The URLs will be stored for future reference
3. All NOR information will be available for race preparation
