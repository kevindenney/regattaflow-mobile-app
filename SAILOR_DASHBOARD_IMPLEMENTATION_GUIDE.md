# Sailor Dashboard Improvements - Implementation Guide

## Overview
This guide covers the implementation of the enhanced sailor dashboard with class-centric features, crew management, tuning guides, and improved race status indicators.

## What's New

### 1. **Class Selector & Multi-Class View**
- Horizontal scrollable class selector with boat names and sail numbers
- "All Classes" view to see data across all boats
- Visual indicators for primary boat
- Class grouping support (e.g., One Design, Handicap fleets)

### 2. **Tuning Guides Integration**
- Auto-scraping from popular sources (North Sails, Quantum, etc.)
- User upload capability
- Quick access section with ratings
- Personal library management with favorites

### 3. **Crew Management**
- Invite crew members by email
- Role-based access (view, edit, full)
- Status tracking (active, pending, inactive)
- Role assignment (helmsman, tactician, trimmer, etc.)
- Performance notes for crew members

### 4. **Enhanced Race Status Indicators**
- Strategy status (ready, in progress, pending)
- Documents ready/missing
- Tuning guides availability
- Crew assignment status
- Weather data confidence

## Database Setup

### Step 1: Run the Migration

```bash
# Via MCP Supabase (if connected):
mcp_supabase_apply_migration --name "sailor_dashboard_enhancements" --query "$(cat supabase/migrations/20250929_sailor_dashboard_enhancements.sql)"

# Or manually in Supabase Dashboard:
# Navigate to SQL Editor and run the migration file
```

### Step 2: Verify Tables Created

The migration creates these new tables:
- `crew_members` - Crew member data and invites
- `tuning_guides` - Tuning guide storage
- `sailor_tuning_guides` - Personal tuning guide library

And adds columns to `regattas`:
- `class_id` - Link race to specific boat class
- `crew_assigned` - Boolean flag
- `tuning_guide_ready` - Boolean flag
- `strategy_status` - Enum status

## Component Integration

### Example 1: Basic Sailor Dashboard with All Features

```tsx
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { useSailorDashboardData } from '@/src/hooks';

// Import new components
import { 
  ClassSelector, 
  TuningGuidesSection, 
  CrewManagement 
} from '@/src/components/sailor';

import { SailorOverview } from '@/src/components/dashboard/sailor';

export default function EnhancedSailorDashboard() {
  const { user } = useAuth();
  const {
    classes,
    activeClassId,
    setActiveClassId,
    races,
    stats,
    currentVenue,
    loading,
  } = useSailorDashboardData();

  const activeClass = classes.find(c => c.id === activeClassId);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ padding: 16 }}>
        
        {/* 1. Class Selector - Shown at top */}
        <ClassSelector
          classes={classes}
          selectedClass={activeClassId}
          onClassChange={setActiveClassId}
          onAddBoat={() => router.push('/boats/add')}
          showAddButton={true}
        />

        {/* 2. Tuning Guides Section - Class-specific */}
        {activeClass && (
          <TuningGuidesSection
            classId={activeClass.id}
            className={activeClass.name}
            sailorId={user?.id || ''}
            onUpload={() => router.push('/tuning-guides/upload')}
          />
        )}

        {/* 3. Crew Management - Class-specific */}
        {activeClass && (
          <CrewManagement
            sailorId={user?.id || ''}
            classId={activeClass.id}
            className={activeClass.name}
            sailNumber={activeClass.sailNumber}
            compact={true}
            onManagePress={() => router.push(`/crew/${activeClass.id}`)}
          />
        )}

        {/* 4. Sailor Overview with Enhanced Status */}
        <SailorOverview
          upcomingRaces={races.map(race => ({
            id: race.id,
            title: race.name,
            venue: race.venue,
            country: 'USA',
            startDate: race.startDate,
            daysUntil: Math.ceil(
              (new Date(race.startDate).getTime() - Date.now()) / 
              (1000 * 60 * 60 * 24)
            ),
            strategyStatus: race.hasStrategy ? 'ready' : 'pending',
            weatherConfidence: race.weatherConfidence || 80,
            hasDocuments: race.documentsReady,
            hasTuningGuides: race.tuningGuideReady,
            hasCrewAssigned: race.crewAssigned,
            classId: race.classId,
          }))}
          stats={stats}
          currentVenue={currentVenue}
          onRacePress={(raceId) => router.push(`/races/${raceId}`)}
          onPlanStrategy={(raceId) => router.push(`/strategy/${raceId}`)}
          onUploadDocuments={() => router.push('/documents/upload')}
          onCheckWeather={() => router.push('/weather')}
          onViewVenues={() => router.push('/venues')}
        />
      </View>
    </ScrollView>
  );
}
```

### Example 2: Compact View for Race Detail Page

```tsx
import { CrewManagement } from '@/src/components/sailor';

export default function RaceDetailScreen({ raceId, classId }: Props) {
  const { user } = useAuth();

  return (
    <View>
      {/* Other race details */}
      
      {/* Compact crew view */}
      <CrewManagement
        sailorId={user?.id || ''}
        classId={classId}
        className="Dragon"
        sailNumber="USA 123"
        compact={true}
        onManagePress={() => router.push(`/crew/${classId}`)}
      />
    </View>
  );
}
```

### Example 3: Standalone Crew Management Page

```tsx
import { CrewManagement } from '@/src/components/sailor';

export default function CrewManagementScreen({ classId }: Props) {
  const { user } = useAuth();
  const boatClass = useBoatClass(classId);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <CrewManagement
        sailorId={user?.id || ''}
        classId={classId}
        className={boatClass.name}
        sailNumber={boatClass.sailNumber}
        compact={false}
      />
    </View>
  );
}
```

## Service Usage

### Tuning Guide Service

```typescript
import { tuningGuideService } from '@/src/services/tuningGuideService';

// Get guides for a class
const guides = await tuningGuideService.getGuidesForClass(classId);

// Search for guides
const searchResults = await tuningGuideService.searchGuides({
  query: 'light wind',
  classId: 'dragon-class-id',
  tags: ['rigging', 'sail-trim'],
});

// Upload a guide
const newGuide = await tuningGuideService.uploadGuide({
  classId: 'dragon-class-id',
  title: 'North Sails Dragon Guide 2024',
  source: 'North Sails',
  file: pdfBlob,
  year: 2024,
  tags: ['sail-trim', 'rigging'],
  isPublic: true,
});

// Trigger auto-scraping
await tuningGuideService.triggerAutoScrape(classId);

// Add to personal library
await tuningGuideService.addToLibrary(sailorId, guideId);

// Mark as favorite
await tuningGuideService.toggleFavorite(sailorId, guideId, true);
```

### Crew Management Service

```typescript
import { crewManagementService } from '@/src/services/crewManagementService';

// Get crew for a class
const crew = await crewManagementService.getCrewForClass(sailorId, classId);

// Invite a crew member
await crewManagementService.inviteCrewMember(sailorId, classId, {
  email: 'sarah@example.com',
  name: 'Sarah Chen',
  role: 'tactician',
  accessLevel: 'edit',
  notes: 'Dragon World Championship crew',
});

// Update crew member
await crewManagementService.updateCrewMember(crewMemberId, {
  role: 'helmsman',
  status: 'active',
});

// Remove crew member
await crewManagementService.removeCrewMember(crewMemberId);

// Check if crew is assigned for race
const hasCreW = await crewManagementService.checkCrewAssignment(
  sailorId,
  classId
);

// Get crew statistics
const stats = await crewManagementService.getCrewStats(sailorId);
// Returns: { totalCrew, activeCrew, pendingInvites, crewByRole }

// Add performance note
await crewManagementService.addPerformanceNote(crewMemberId, {
  date: '2024-09-29',
  race: 'Hong Kong Regatta',
  note: 'Excellent spinnaker work in heavy conditions',
});
```

## Update Existing useSailorDashboardData Hook

Add these enhancements to fetch crew and tuning guide status:

```typescript
// In useSailorDashboardData.ts

import { crewManagementService } from '@/src/services/crewManagementService';
import { tuningGuideService } from '@/src/services/tuningGuideService';

// Add to data fetching logic:
const processedRaces: SailorRace[] = await Promise.all(
  racesData?.map(async (race) => {
    // Check crew assignment
    const hasCrewAssigned = race.class_id
      ? await crewManagementService.checkCrewAssignment(user.id, race.class_id)
      : false;

    // Check tuning guides
    const tuningGuides = race.class_id
      ? await tuningGuideService.getGuidesForClass(race.class_id)
      : [];
    const hasTuningGuides = tuningGuides.length > 0;

    return {
      id: race.id,
      name: race.name,
      venue: race.venue,
      startDate: race.start_date,
      endDate: race.end_date || race.start_date,
      status: race.status,
      hasStrategy: strategiesData?.some(s => s.regatta_id === race.id) || false,
      weatherConfidence: 0.8,
      documentsReady: race.documents_ready,
      hasTuningGuides,
      hasCrewAssigned,
      classId: race.class_id,
    };
  }) || []
);
```

## Key Features & Best Practices

### Class Selector
- Always show at the top of the dashboard for easy switching
- Highlight the primary boat
- Show boat names and sail numbers for easy identification
- Include an "All Classes" option to view aggregated data

### Tuning Guides
- Encourage users to trigger auto-scraping for their class
- Allow ratings and favorites for community-driven quality
- Support multiple file formats (PDF, DOC, images, links)
- Track download/view counts

### Crew Management
- Use compact view for inline displays
- Full view for dedicated crew management page
- Send email invites automatically (requires email service setup)
- Track invite status and allow resending
- Support different access levels for data privacy

### Race Status Indicators
- Show all 5 status indicators:
  1. Strategy Status (with color coding)
  2. Documents (ready/missing)
  3. Tuning Guides (available/not available)
  4. Crew Assignment (assigned/not assigned)
  5. Weather Confidence (percentage)
  
- Use color coding:
  - Green (#10B981) = Ready/Complete
  - Amber (#F59E0B) = In Progress/Warning
  - Red (#EF4444) = Pending/Missing
  - Gray (#94A3B8) = Not Available

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Tables created with proper RLS policies
- [ ] Class selector shows all boats
- [ ] Can select and switch between classes
- [ ] Tuning guides section displays correctly
- [ ] Can upload tuning guides
- [ ] Auto-scraping triggers correctly
- [ ] Crew invites send successfully
- [ ] Crew members display with correct roles
- [ ] Can remove crew members
- [ ] Race cards show all 5 status indicators
- [ ] Status colors are correct
- [ ] Compact views work on race detail pages

## Troubleshooting

### Tuning Guides Not Showing
1. Check if guides exist in database for the class
2. Verify RLS policies allow reading
3. Try triggering auto-scrape
4. Check console for API errors

### Crew Invites Not Sending
1. Verify email service is configured (Supabase Edge Function or third-party)
2. Check crew_members table has invite_token
3. Verify RLS policies allow insert
4. Check console for errors

### Class Selector Not Updating
1. Verify `sailor_classes` table has data
2. Check `setActiveClassId` function is passed correctly
3. Verify class IDs match in database
4. Check hook dependencies and re-render logic

## Next Steps

### Phase 2 Enhancements
1. **Email Service Integration**: Set up Supabase Edge Function for crew invites
2. **Real-time Collaboration**: Add real-time crew chat using Supabase Realtime
3. **Tuning Guide OCR**: Extract text from PDF guides for searchability
4. **Performance Analytics**: Link crew roles to race results
5. **Weather Integration**: Auto-check weather and update confidence scores
6. **Smart Notifications**: Remind users when race needs attention

### API Improvements
1. Add pagination to tuning guides list
2. Implement guide versioning
3. Add crew availability calendar
4. Create crew skill rating system

## Support

For issues or questions:
1. Check Supabase logs for database errors
2. Review React Native debugger for component errors
3. Verify all services are properly imported
4. Check that user is authenticated before calling services

---

**Last Updated**: September 29, 2025  
**Version**: 1.0.0  
**Author**: RegattaFlow Team
