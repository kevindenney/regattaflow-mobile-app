# 📱 Sailor Dashboard - Quick Reference Card

## 🚀 Quick Start (3 Steps)

```bash
# 1. Run migration
# In Supabase SQL Editor, execute: supabase/migrations/20250929_sailor_dashboard_enhancements.sql

# 2. Import components
import { ClassSelector, TuningGuidesSection, CrewManagement } from '@/src/components/sailor';

# 3. Use in dashboard
<ClassSelector classes={classes} selectedClass={activeClassId} onClassChange={setActiveClassId} />
<TuningGuidesSection classId={classId} className={className} sailorId={user.id} />
<CrewManagement sailorId={user.id} classId={classId} className={className} compact />
```

---

## 📦 Component Props Cheat Sheet

### ClassSelector
```typescript
<ClassSelector
  classes={classes}                    // BoatClass[]
  selectedClass={activeClassId}        // string | null
  onClassChange={(id) => {...}}       // (id: string | null) => void
  onAddBoat={() => {...}}             // Optional
  showAddButton={true}                // Optional, default true
/>
```

### TuningGuidesSection
```typescript
<TuningGuidesSection
  classId="dragon-class-id"           // Required
  className="Dragon"                   // Required
  sailorId={user.id}                  // Required
  onUpload={() => {...}}              // Optional
/>
```

### CrewManagement
```typescript
<CrewManagement
  sailorId={user.id}                  // Required
  classId={classId}                   // Required
  className="Dragon"                   // Required
  sailNumber="USA 123"                // Optional
  compact={true}                      // Optional, default false
  onManagePress={() => {...}}        // Optional
/>
```

---

## 🔧 Service Quick Reference

### Tuning Guides
```typescript
import { tuningGuideService } from '@/src/services/tuningGuideService';

// Get guides
await tuningGuideService.getGuidesForClass(classId);
await tuningGuideService.getSailorLibrary(sailorId);
await tuningGuideService.getFavoriteGuides(sailorId);

// Manage guides
await tuningGuideService.uploadGuide({ classId, title, source, file, ... });
await tuningGuideService.triggerAutoScrape(classId);
await tuningGuideService.addToLibrary(sailorId, guideId);
await tuningGuideService.toggleFavorite(sailorId, guideId, true);

// Search
await tuningGuideService.searchGuides({ query, classId, tags, source });
```

### Crew Management
```typescript
import { crewManagementService } from '@/src/services/crewManagementService';

// Get crew
await crewManagementService.getCrewForClass(sailorId, classId);
await crewManagementService.getAllCrew(sailorId);

// Manage crew
await crewManagementService.inviteCrewMember(sailorId, classId, {
  email: 'crew@example.com',
  name: 'Crew Name',
  role: 'tactician',
});
await crewManagementService.updateCrewMember(crewMemberId, { role: 'helmsman' });
await crewManagementService.removeCrewMember(crewMemberId);

// Stats
await crewManagementService.getCrewStats(sailorId);
await crewManagementService.checkCrewAssignment(sailorId, classId);
```

---

## 🎨 Design Tokens

### Colors
```typescript
// Status
const STATUS_COLORS = {
  ready: '#10B981',      // Green
  warning: '#F59E0B',    // Amber
  error: '#EF4444',      // Red
  inactive: '#94A3B8',   // Gray
  primary: '#3B82F6',    // Blue
};

// Roles
const ROLE_COLORS = {
  helmsman: '#3B82F6',   // Blue
  tactician: '#8B5CF6',  // Purple
  trimmer: '#10B981',    // Green
  bowman: '#F59E0B',     // Amber
  pit: '#EF4444',        // Red
  grinder: '#6366F1',    // Indigo
  other: '#64748B',      // Gray
};
```

### Icons
```typescript
import { Ionicons } from '@expo/vector-icons';

// Status Icons
<Ionicons name="checkmark-circle" />  // Success
<Ionicons name="alert-circle" />      // Warning/Missing
<Ionicons name="book" />               // Tuning guides (filled)
<Ionicons name="book-outline" />      // No tuning guides
<Ionicons name="people" />             // Crew assigned (filled)
<Ionicons name="people-outline" />    // No crew

// Role Icons
const ROLE_ICONS = {
  helmsman: 'navigate-circle',
  tactician: 'compass',
  trimmer: 'hand-left',
  bowman: 'arrow-up-circle',
  pit: 'construct',
  grinder: 'fitness',
  other: 'person',
};
```

---

## 📋 Database Tables Quick Reference

### crew_members
```sql
SELECT * FROM crew_members WHERE sailor_id = 'user-id' AND class_id = 'class-id';

-- Columns: id, sailor_id, class_id, email, name, role, access_level, status, 
--          invite_token, notes, performance_notes, created_at, updated_at
```

### tuning_guides
```sql
SELECT * FROM tuning_guides WHERE class_id = 'class-id' AND is_public = true;

-- Columns: id, class_id, title, source, source_url, file_url, file_type,
--          year, tags, auto_scraped, downloads, rating, created_at
```

### sailor_tuning_guides (Personal Library)
```sql
SELECT * FROM sailor_tuning_guides WHERE sailor_id = 'user-id';

-- Columns: sailor_id, guide_id, is_favorite, personal_notes, last_viewed_at
```

### regattas (Enhanced)
```sql
SELECT * FROM regattas 
WHERE created_by = 'user-id' 
  AND class_id = 'class-id'
  AND crew_assigned = true 
  AND tuning_guide_ready = true;

-- New columns: class_id, crew_assigned, tuning_guide_ready, 
--               strategy_status, documents_ready, weather_checked
```

---

## 🔐 RLS Policies

```sql
-- Crew: Sailors manage their own crew
CREATE POLICY "sailors_manage_crew" ON crew_members FOR ALL USING (auth.uid() = sailor_id);

-- Tuning Guides: View public or your class guides
CREATE POLICY "view_public_guides" ON tuning_guides FOR SELECT USING (is_public = true);
CREATE POLICY "view_class_guides" ON tuning_guides FOR SELECT USING (
  class_id IN (SELECT class_id FROM sailor_classes WHERE sailor_id = auth.uid())
);

-- Personal Library: Manage your own library
CREATE POLICY "manage_own_library" ON sailor_tuning_guides FOR ALL USING (auth.uid() = sailor_id);
```

---

## 🧪 Testing Snippets

### Test Class Selector
```typescript
const testClasses = [
  { id: '1', name: 'Dragon', sailNumber: 'USA 123', isPrimary: true },
  { id: '2', name: 'J/70', sailNumber: 'USA 456', isPrimary: false },
];

<ClassSelector
  classes={testClasses}
  selectedClass={testClasses[0].id}
  onClassChange={(id) => console.log('Selected:', id)}
/>
```

### Test Crew Management
```typescript
// Add test crew
await crewManagementService.inviteCrewMember('sailor-id', 'class-id', {
  email: 'test@example.com',
  name: 'Test Crew',
  role: 'tactician',
  accessLevel: 'edit',
});

// Check assignment
const hasСrew = await crewManagementService.checkCrewAssignment('sailor-id', 'class-id');
console.log('Has crew:', hasCrew);
```

### Test Tuning Guides
```typescript
// Trigger auto-scrape
await tuningGuideService.triggerAutoScrape('dragon-class-id');

// Get guides
const guides = await tuningGuideService.getGuidesForClass('dragon-class-id');
console.log('Guides found:', guides.length);
```

---

## 🐛 Common Issues & Fixes

### "Guides not showing"
```typescript
// Check RLS
SELECT * FROM tuning_guides WHERE class_id = 'your-class-id';

// Trigger auto-scrape
await tuningGuideService.triggerAutoScrape(classId);
```

### "Crew invites not working"
```typescript
// Check table
SELECT * FROM crew_members WHERE sailor_id = 'user-id';

// Check invite token
SELECT invite_token, status FROM crew_members WHERE id = 'crew-id';

// Note: Email sending requires Edge Function setup
```

### "Class selector not updating"
```typescript
// Ensure proper state management
const [activeClassId, setActiveClassId] = useState<string | null>(null);

// Pass correct handler
<ClassSelector
  selectedClass={activeClassId}
  onClassChange={setActiveClassId}  // Not (id) => setActiveClassId
/>
```

---

## 📱 Component Hierarchy

```
Dashboard
  └─ EnhancedSailorOverview (recommended)
      ├─ ClassSelector (always visible)
      ├─ TuningGuidesSection (if class selected)
      ├─ CrewManagement (if class selected, compact mode)
      └─ SailorOverview (traditional overview with enhanced status)
          ├─ Current Venue Card
          ├─ Upcoming Races (with 5 status indicators)
          ├─ Performance Stats
          └─ Quick Actions

OR

Dashboard (custom)
  ├─ Your Header
  ├─ ClassSelector (standalone)
  ├─ TuningGuidesSection (standalone)
  ├─ CrewManagement (standalone)
  └─ Your Content
```

---

## 🎯 Typical Workflow

### 1. Sailor Signs Up
```typescript
// 1. Create sailor_classes entry
INSERT INTO sailor_classes (sailor_id, class_id, sail_number, is_primary);

// 2. Components auto-populate
<ClassSelector /> // Shows their boats
```

### 2. Sailor Adds Crew
```typescript
// Via component
<CrewManagement onManagePress={() => showInviteModal()} />

// Or service
await crewManagementService.inviteCrewMember(sailorId, classId, {...});
```

### 3. Sailor Gets Tuning Guides
```typescript
// Auto-scrape
await tuningGuideService.triggerAutoScrape(classId);

// Or manual upload
await tuningGuideService.uploadGuide({...});
```

### 4. Sailor Plans Race
```typescript
// Check status
const race = {
  hasDocuments: true,
  hasTuningGuides: await checkTuningGuides(classId),
  hasCrewAssigned: await crewManagementService.checkCrewAssignment(sailorId, classId),
  strategyStatus: 'in_progress',
};

// Display with status indicators
<SailorOverview upcomingRaces={[race]} />
```

---

## 💡 Pro Tips

1. **Use compact mode** for crew management in space-constrained areas
2. **Always show ClassSelector** at the top - it's the primary navigation
3. **Filter races** by selected class for focused view
4. **Trigger auto-scrape** on first class selection for better onboarding
5. **Use EnhancedSailorOverview** for fastest integration
6. **Check crew assignment** status when creating/editing races
7. **Show tuning guides** prominently before races for better preparation

---

## 📚 File Locations

```
Database:
  supabase/migrations/20250929_sailor_dashboard_enhancements.sql

Services:
  src/services/tuningGuideService.ts
  src/services/crewManagementService.ts

Components:
  src/components/sailor/ClassSelector.tsx
  src/components/sailor/TuningGuidesSection.tsx
  src/components/sailor/CrewManagement.tsx
  src/components/sailor/index.ts

Dashboard:
  src/components/dashboard/sailor/SailorOverview.tsx (enhanced)
  src/components/dashboard/sailor/EnhancedSailorOverview.tsx (all-in-one)

Docs:
  SAILOR_DASHBOARD_IMPLEMENTATION_GUIDE.md (detailed guide)
  SAILOR_DASHBOARD_IMPROVEMENTS_SUMMARY.md (overview)
  SAILOR_DASHBOARD_QUICK_REFERENCE.md (this file)
```

---

**Quick Links**:
- [Implementation Guide](./SAILOR_DASHBOARD_IMPLEMENTATION_GUIDE.md)
- [Summary](./SAILOR_DASHBOARD_IMPROVEMENTS_SUMMARY.md)

---

*Keep this handy for quick reference while developing! 🚀*
