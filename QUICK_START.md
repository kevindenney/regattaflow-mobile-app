# 🚀 Quick Start - Race Detail Enhancements

## Test It Now!

### 1. View Enhanced Race Detail
```bash
# Open your app
npm start
# OR
npx expo start

# Then:
# 1. Navigate to Races tab
# 2. Tap any race
# 3. Scroll down to see all new features!
```

### 2. What You'll See

**New Components (in order):**
1. **Tactical Plan** - AI-generated leg-by-leg strategy
2. **Contingency Plans** - Scenario-based race planning ⚠️
3. **Crew & Equipment** - Who's sailing with you 👥
4. **Fleet Racers** - Who else is racing this event ⛵
5. **Documents** - Race documents with AI processing 📄

---

## Enable Fleet Connectivity

### Step 1: Users Register for Races

Add this to your race detail header (or create a FAB button):

```tsx
import { raceParticipantService } from '@/services/RaceParticipantService';
import { useAuth } from '@/providers/AuthProvider';

// In your component:
const { user } = useAuth();

const handleRegisterForRace = async () => {
  if (!user?.id) return;

  await raceParticipantService.registerForRace({
    userId: user.id,
    regattaId: race.id,
    fleetId: 'your-fleet-id', // Optional
    boatName: 'My Boat Name',
    sailNumber: 'HKG 123',
    visibility: 'public', // or 'fleet', 'private'
  });

  Alert.alert('Success', 'Registered for race!');
  // Refresh participants list
};

// Add button:
<TouchableOpacity onPress={handleRegisterForRace}>
  <Text>Register for Race</Text>
</TouchableOpacity>
```

### Step 2: Create Fleets

Use `FleetDiscoveryService` to create fleets:

```tsx
import { FleetDiscoveryService } from '@/services/FleetDiscoveryService';

await FleetDiscoveryService.createFleet(user.id, {
  name: 'RHKYC Dragon Class',
  description: 'Hong Kong Dragon Fleet',
  class_id: 'dragon-class-id',
  region: 'Hong Kong',
  whatsapp_link: 'https://chat.whatsapp.com/your-group-link',
  visibility: 'public',
});
```

---

## Enable Document Upload

### Connect Upload Handler

In `race/scrollable/[id].tsx`, replace the console.log with:

```tsx
import * as DocumentPicker from 'expo-document-picker';
import { raceDocumentService } from '@/services/RaceDocumentService';

const handleDocumentUpload = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.type === 'success') {
      const file = await fetch(result.uri);
      const blob = await file.blob();

      await raceDocumentService.uploadRaceDocument({
        regattaId: race.id,
        userId: user.id,
        file: blob,
        documentType: 'sailing_instructions', // or other types
        filename: result.name,
      });

      Alert.alert('Success', 'Document uploaded!');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to upload document');
  }
};
```

---

## Database Quick Check

### Verify Tables Exist

Run in Supabase SQL Editor:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('race_participants', 'race_documents');

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('race_participants', 'race_documents');
```

Should return:
- 2 tables
- 9 policies total (5 for participants, 4 for documents)

---

## Test With Mock Data

### Add Test Participants

```sql
-- Insert test participants for a race
INSERT INTO race_participants (regatta_id, user_id, boat_name, sail_number, status, visibility)
VALUES
  ('your-race-id', 'user-1-id', 'Sea Dragon', 'HKG 123', 'confirmed', 'public'),
  ('your-race-id', 'user-2-id', 'Phoenix', 'HKG 456', 'confirmed', 'public'),
  ('your-race-id', 'user-3-id', 'Thunder', 'HKG 789', 'registered', 'public');
```

### Create Test Fleet

```sql
-- Create a test fleet
INSERT INTO fleets (name, description, class_id, visibility, whatsapp_link, region)
VALUES (
  'RHKYC Dragon Class',
  'Hong Kong Dragon Fleet',
  'dragon-class-id',
  'public',
  'https://chat.whatsapp.com/test',
  'Hong Kong'
)
RETURNING id;

-- Add members to fleet
INSERT INTO fleet_members (fleet_id, user_id, role, status)
VALUES
  ('fleet-id-from-above', 'user-1-id', 'member', 'active'),
  ('fleet-id-from-above', 'user-2-id', 'member', 'active');
```

---

## Troubleshooting

### Fleet Card Shows Empty
**Problem**: No participants registered
**Solution**: Add test participants (SQL above) OR implement registration button

### Crew Card Shows Empty
**Problem**: No crew assigned
**Solution**: Use existing crew management to add crew members

### Documents Card Shows Empty
**Problem**: No documents uploaded
**Solution**: Implement upload handler (code above)

### Tactical Plan Not Generating
**Problem**: Race strategy not created
**Solution**: Card auto-generates on first view (wait a moment)

---

## Performance Tips

### For Large Fleets

Add pagination to `FleetRacersCard`:

```tsx
// In FleetRacersCard.tsx
const [page, setPage] = useState(0);
const ITEMS_PER_PAGE = 10;

const displayParticipants = participants.slice(
  page * ITEMS_PER_PAGE,
  (page + 1) * ITEMS_PER_PAGE
);
```

### For Many Documents

Add filtering to `RaceDocumentsCard`:

```tsx
const [filter, setFilter] = useState<RaceDocumentType | 'all'>('all');

const filteredDocs = filter === 'all'
  ? documents
  : documents.filter(d => d.type === filter);
```

---

## Feature Flags

### Enable/Disable Features

Add to your race detail component:

```tsx
const FEATURE_FLAGS = {
  showFleetRacers: true,
  showDocuments: true,
  showContingencyPlans: true,
  showCrewCard: true,
};

// Then conditionally render:
{FEATURE_FLAGS.showFleetRacers && (
  <FleetRacersCard ... />
)}
```

---

## What's Next?

### Phase 1: Core Testing ✅
- [x] Verify all components render
- [x] Check database integration
- [x] Test with mock data

### Phase 2: Real Data (Current)
- [ ] Add registration button
- [ ] Connect document upload
- [ ] Create fleets for venues
- [ ] Test with real users

### Phase 3: Fleet Features
- [ ] WhatsApp integration
- [ ] Fleet chat
- [ ] Shared documents
- [ ] Fleet leaderboards

### Phase 4: Advanced Features
- [ ] Real-time updates
- [ ] Push notifications
- [ ] Document annotations
- [ ] Equipment checklists

---

## Support

### Documentation
- `INTEGRATION_COMPLETE.md` - Full integration details
- `RACE_DETAIL_ENHANCEMENT_SUMMARY.md` - Feature overview
- `DATABASE_SETUP_GUIDE.md` - Database guide

### Code Locations
- Components: `components/race-detail/`
- Services: `services/RaceParticipantService.ts`, `services/RaceDocumentService.ts`
- Screen: `app/(tabs)/race/scrollable/[id].tsx`

---

**Ready to test!** 🎉

Just navigate to any race in your app and scroll down to see all the new features in action!
