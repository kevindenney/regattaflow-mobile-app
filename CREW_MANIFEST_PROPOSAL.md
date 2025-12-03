# Race Officer Crew Manifest Feature

## Overview
Add crew visibility to race officer dashboard for safety and compliance.

## Proposed UI Addition

### In `/app/club/race/control/[id].tsx`

Add new tab: **"Crew Manifest"**

```
┌─────────────────────────────────────────┐
│ Timer │ Finishes │ Flags │ Protests │ CREW │
└─────────────────────────────────────────┘

CREW MANIFEST - Race 3, Dragon Class
╔════════════════════════════════════════╗
║ HKG 888 - Marcus Thompson             ║
║ ┌────────────────────────────────────┐ ║
║ │ ✓ James Chen (Tactician)           │ ║
║ │ ✓ Sophie Martinez (Trimmer)        │ ║
║ │ ✓ Marcus Williams (Bowman)         │ ║
║ └────────────────────────────────────┘ ║
║ Crew: 3/3 ✓ Safety Briefing: ✓       ║
╚════════════════════════════════════════╝

╔════════════════════════════════════════╗
║ HKG 999 - Demo Sailor                 ║
║ ┌────────────────────────────────────┐ ║
║ │ ⚠️  No crew assigned yet            │ ║
║ └────────────────────────────────────┘ ║
║ Crew: 0/3 ✗ Safety Briefing: -        ║
╚════════════════════════════════════════╝

Summary: 12/15 boats have full crew assigned
```

## Implementation

### 1. Add RLS Policy
Allow race officers to view crew assignments for their races:

```sql
CREATE POLICY "Race officers can view crew for their races"
  ON public.race_crew_assignments
  FOR SELECT
  USING (
    race_id IN (
      SELECT rr.id FROM public.regatta_races rr
      INNER JOIN public.regattas r ON rr.regatta_id = r.id
      INNER JOIN public.club_members cm ON cm.club_id = r.club_id
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('race_officer', 'admin', 'sailing_manager')
    )
  );
```

### 2. Add Service Method

```typescript
// crewManagementService.ts
async getRaceCrewManifest(raceId: string): Promise<CrewManifest[]> {
  const { data, error } = await supabase
    .from('race_participants')
    .select(`
      id,
      sail_number,
      boat_name,
      user_id,
      race_crew_assignments (
        crew_members (
          name,
          role,
          certifications
        )
      )
    `)
    .eq('regatta_id', raceId);

  return data.map(entry => ({
    sailNumber: entry.sail_number,
    boatName: entry.boat_name,
    assignedCrew: entry.race_crew_assignments.crew_members,
    crewCount: entry.race_crew_assignments.length,
    hasCompliance: checkCompliance(entry)
  }));
}
```

### 3. Add UI Component

```typescript
// components/race-control/CrewManifestTab.tsx
export function CrewManifestTab({ raceId }: { raceId: string }) {
  const [manifest, setManifest] = useState([]);

  useEffect(() => {
    loadManifest();
  }, [raceId]);

  return (
    <ScrollView>
      {manifest.map(entry => (
        <CrewManifestCard
          key={entry.sailNumber}
          entry={entry}
          onContactSkipper={handleContact}
        />
      ))}
    </ScrollView>
  );
}
```

## Benefits

1. **Safety**: Race officers know who's on each boat
2. **Compliance**: Quick check for minimum crew requirements
3. **Communication**: Easy to identify and contact incomplete crews
4. **Documentation**: Crew manifests for insurance/liability
5. **Search & Rescue**: Critical info if boat in distress

## Privacy Considerations

- Crew member names visible only to race officers
- Contact info kept private (skipper contacted instead)
- Compliance status shown, not personal certifications
- Option to mark crew data as "race official use only"

## User Story

> **As a race officer**, I want to see which boats have assigned crew before the start,
> so I can ensure safety compliance and have accurate manifests for emergency response.

## Next Steps

1. Discuss with RHKYC: Do they need this feature?
2. Review safety/compliance requirements
3. Implement if valuable for their operations

---

**Alternative**: Start with just a count badge
```
Entry #42 - HKG 888
Crew: 3/3 ✓
```
Simple, non-intrusive, shows compliance status without full manifest.
