# RegattaFlow UX/UI Overview

*Design Review Document - Generated January 2025*

## Table of Contents
1. [App Structure & Navigation](#app-structure--navigation)
2. [Screen Inventory](#screen-inventory)
3. [UI Components & Design System](#ui-components--design-system)
4. [Styling Approach](#styling-approach)
5. [UX Concerns & Recommendations](#ux-concerns--recommendations)
6. [Code Samples](#code-samples)

---

## App Structure & Navigation

### Platform Architecture
**Expo Universal App** - Single codebase for iOS, Android, and Web
- **Framework**: Expo SDK 54+ with React Native
- **Web Rendering**: React Native Web with Expo Router
- **Navigation**: File-based routing with Expo Router
- **State Management**: Zustand + React Query for server state

### Navigation Hierarchy

```
Root (_layout.tsx)
├── Authentication Gate (AuthProvider)
├── Network Status Banner
├── Error Boundary
└── Main Navigation
    ├── Landing (index.tsx) - User type selection
    ├── Auth Flow ((auth)/_layout.tsx)
    │   ├── Login
    │   └── Signup
    └── Tab Navigation ((tabs)/_layout.tsx)
        ├── Sailor Tabs (7 tabs)
        ├── Coach Tabs (6 tabs)
        └── Club Tabs (6 tabs)
```

### Navigation Pattern

**Dynamic Tab Bar** - Changes based on user type:

#### Sailor Navigation (7 visible tabs + overflow menu)
```
┌─────────┬──────────┬─────────┬───────┬────────┬──────┬──────┐
│Dashboard│ Calendar │ Courses │ Boats │ Fleets │ Club │ More │
└─────────┴──────────┴─────────┴───────┴────────┴──────┴──────┘
```
- **More Menu** (hamburger): Venue, Crew, Tuning Guides, Profile, Settings
- Icons: Ionicons with filled/outline variants for active/inactive states

#### Coach Navigation (6 tabs)
```
┌─────────┬─────────┬──────────┬──────────┬─────────┬──────────┐
│Dashboard│ Clients │ Schedule │ Earnings │ Profile │ Settings │
└─────────┴─────────┴──────────┴──────────┴─────────┴──────────┘
```

#### Club Navigation (6 tabs)
```
┌─────────┬────────┬─────────┬───────┬─────────┬──────────┐
│Dashboard│ Events │ Members │ Races │ Profile │ Settings │
└─────────┴────────┴─────────┴───────┴─────────┴──────────┘
```

### Primary User Flows

#### 1. New Sailor Onboarding
```
Landing → Signup → Persona Selection → Sailor Onboarding Flow:
  - Venue Selection
  - Boat Setup
  - Crew Management
  - Coach Matching
  - Review → Dashboard
```

#### 2. Race Strategy Workflow (Core Feature)
```
Dashboard → Courses Tab:
  1. Upload Sailing Instructions (PDF/Photo)
  2. AI Extraction (DocumentProcessingAgent)
  3. 3D Course Visualization (MapLibre)
  4. Strategy Generation (RaceStrategyEngine + Monte Carlo)
  5. Save/Share Strategy
```

#### 3. Venue Intelligence (Global Feature)
```
Any Screen → GPS Detection:
  - Auto-detect venue by GPS
  - Load regional intelligence
  - Apply cultural settings
  - Show tactical insights

Manual Selection:
  Dashboard/Venue Tab → Map View:
  - Browse global venues
  - Filter by saved/favorites
  - View venue intelligence
  - AI venue analysis
```

---

## Screen Inventory

### Authentication Screens
Located in: `src/app/(auth)/`

| Screen | Path | Purpose | Layout | Key Components |
|--------|------|---------|--------|---------------|
| **Login** | `(auth)/login.tsx` | User authentication | Stack | Email/password form, OAuth buttons |
| **Signup** | `(auth)/signup.tsx` | New user registration | Stack | Registration form with validation |
| **Persona Selection** | `(auth)/persona-selection.tsx` | User type selection | Stack | Sailor/Coach/Club cards |

### Sailor Onboarding Flow
Located in: `src/app/(auth)/sailor-onboarding-*.tsx`

| Screen | Purpose | Key Features |
|--------|---------|--------------|
| **Venue Selection** | Choose home sailing location | Global venue map, GPS detection, search |
| **Boat Setup** | Add boat(s) to profile | Boat class selection, equipment tracking |
| **Crew Management** | Add crew members | Contact import, role assignment |
| **Coach Matching** | Find sailing coaches | AI-powered matching, venue expertise |
| **Review** | Confirm onboarding data | Summary with edit options |

### Main Tab Screens

#### Dashboard (`(tabs)/dashboard.tsx`)
**Purpose**: Central hub for sailor activity and race preparation

**Layout**: ScrollView with RefreshControl
- **Header Section** (Primary 500 background)
  - Welcome message with user name
  - GPS venue detection with confidence badge
  - Quick stats: Races, Venues, Avg Position, Ranking
  - Offline indicator + Realtime connection status
  - Notification bell

- **Main Content Sections**:
  1. **AI Venue Intelligence Card** (Purple border, dismissible)
     - Safety recommendations (red background)
     - Racing tips (green background)
     - Cultural notes (blue background)
     - CTA: "View Full Intelligence"

  2. **Next Race Card** (Elevated with hero image)
     - Race name, boat class, venue
     - Countdown timer (days, hours, minutes)
     - Status badges: Docs, Strategy, Weather, Crew
     - CTAs: "Plan Race Strategy", "View Course"
     - Quick actions: Upload, Weather, Crew

  3. **AI Coach Analysis Card** (Auto-triggered after race)
     - Recent timer session analysis
     - Performance insights
     - Strategic recommendations

  4. **Recent Race Card**
     - Position, name, date
     - Quick actions: View Details, Share

  5. **Your Boats Section**
     - List of boats (max 2 preview)
     - "View all X boats" link
     - Empty state: "Add Boat" CTA

  6. **Your Fleets Section**
     - Fleet list (max 2 preview)
     - "View all X fleets" link
     - Empty state: "Join Fleet" CTA

**Notable UX Patterns**:
- Memoized components for performance (BoatCard, FleetCard)
- Empty states for all sections
- Loading skeleton for initial load
- Error boundary with retry
- GPS-triggered AI venue analysis

#### Venue Intelligence (`(tabs)/venue.tsx`)
**Purpose**: Apple Maps-style global venue discovery and intelligence

**Layout**: Full-screen map with floating UI
- **Map Container** (absolute fill)
  - MapLibre GL for 3D visualization
  - Global venue markers
  - Network markers (clubs, sailmakers, coaches, etc.)
  - Toggle between all venues / saved venues

- **Collapsible Sidebar** (Left)
  - Saved venues network
  - Discovery section
  - Filter by type: Yacht Clubs, Sailmakers, Riggers, etc.
  - Venue cards with distance

- **Map Controls** (Upper right)
  - 3D toggle
  - Layers toggle
  - Saved venues filter
  - Search nearby (GPS)

- **Bottom Sheet** (Venue Details)
  - Venue name, type, location
  - Intelligence summary
  - Save/favorite action
  - Navigate to venue

- **Floating AI Buttons** (Bottom center)
  - "Ask AI About This Venue" (Green)
  - "Detect Current Venue" (Purple)

**Modal Flows**:
1. **AI Venue Detection Modal**
   - GPS detection confirmation
   - Venue name + distance
   - Confidence score
   - Regional adaptations (language, currency, weather)
   - Alternative venues nearby
   - Tools used (debug info)
   - Actions: Confirm / Manual Select

2. **AI Venue Analysis Modal**
   - Venue name
   - Safety recommendations (red)
   - Racing tips (green)
   - Cultural notes (blue)
   - Practice areas (yellow)
   - Optimal conditions (indigo)
   - Full analysis text

**Notable UX Patterns**:
- Location-aware with auto-detection
- Multi-modal interaction (map, sidebar, sheets, modals)
- AI-powered insights on demand
- Offline venue caching

#### Race Courses (`(tabs)/races.tsx`)
**Purpose**: AI-powered race course extraction and strategy planning

**Layout**: Multi-modal workflow with map base

**Primary Flow** (7 phases):

1. **Map View** (Base state)
   - 3D course visualization (MapLibre)
   - Quick Actions panel (floating bottom)
     - Upload Docs, AI Strategy, Race Mode, Analysis

2. **Upload Modal** (Phase 1)
   - PDF upload
   - Photo capture
   - Manual entry
   - Recent documents list

3. **AI Extraction Modal** (Phase 2 - Processing overlay)
   - Progress steps with icons:
     - ✓ Document uploaded
     - ⏳ Extracting course data
     - ⏳ Generating 3D visualization
     - ⏳ Analyzing race strategy
     - ⏳ Saving to database
   - Error state with retry
   - Processing status messages

4. **3D Visualization Modal** (Phase 3)
   - Full-screen course map
   - Course prediction card (if available)
     - AI confidence score
     - Predicted course name
     - Alternative courses
   - Course summary:
     - Total distance
     - Estimated time
     - Course type
   - CTA: "Generate Race Strategy"

5. **Strategy Modal** (Phase 4)
   - Course prediction (purple gradient card)
   - Overall approach
   - Start strategy (purple cards)
   - Upwind tactics (blue cards)
   - Downwind tactics (green cards)
   - Monte Carlo simulation results
     - Expected finish
     - Win probability
     - Podium probability
     - Risk factors
   - Save/Share options

6. **Race Mode** (Phase 5)
   - Live tactical overlay
   - Real-time wind updates
   - Race timer
   - Strategic guidance

7. **Analysis Modal** (Phase 6)
   - Performance overview
   - Final position
   - VMG efficiency
   - Strategy execution score
   - AI insights by race phase

**Notable UX Patterns**:
- Agent-driven workflow (DocumentProcessingAgent, CoursePredictionAgent)
- Progressive disclosure (step-by-step modals)
- Multiple empty states based on data availability
- Real-time processing feedback
- Confidence scoring for AI predictions

#### Boats (`(tabs)/boat/`)
**Purpose**: Manage sailor's boat fleet and equipment

**Screens**:
- `index.tsx` - Boat list
- `[id].tsx` - Boat detail with equipment
- `add.tsx` - Add new boat

#### Fleet (`(tabs)/fleet/`)
**Purpose**: Fleet management and social features

**Screens**:
- Fleet list and discovery
- Fleet activity feed
- Settings and administration

#### Additional Tab Screens
- **Calendar** (`calendar.tsx`) - Race schedule and events
- **Crew** (`crew.tsx`) - Crew management and availability
- **Tuning Guides** (`tuning-guides.tsx`) - Boat class tuning guides
- **Profile** (`profile.tsx`) - User settings and preferences
- **Settings** (`settings.tsx`) - App configuration

### Coach Screens
- **Clients** (`clients.tsx`) - Student management
- **Schedule** (`schedule.tsx`) - Session planning
- **Earnings** (`earnings.tsx`) - Stripe Connect dashboard

### Club Screens
- **Events** (`events.tsx`) - Regatta management
- **Members** (`members.tsx`) - Club membership
- **Race Management** (`race-management.tsx`) - Race committee tools

---

## UI Components & Design System

### Component Library: GluestackUI + Custom Components

#### Core UI Components
Located in: `src/components/ui/`

**GluestackUI Components** (with custom variants):
```typescript
// Exported from src/components/ui/index.ts
export { Button, ButtonText, ButtonIcon } from './button';
export { Card } from './card';
export { Badge, BadgeText, BadgeIcon } from './badge';
export { StatCard } from './stat-card';
export { Skeleton, SkeletonText } from './skeleton';
export { Spinner } from './spinner';
```

**Custom Components**:
```typescript
// Loading States
export { DashboardSkeleton, ListSkeleton, ProcessingIndicator } from './loading';

// Error Handling
export { ErrorBoundary, ErrorMessage } from './error';

// Network Status
export { NetworkStatusBanner, OfflineBadge } from './network';

// Empty States
export { EmptyState } from './empty';

// Additional UI
export { OfflineIndicator } from './OfflineIndicator';
export { RealtimeConnectionIndicator } from './RealtimeConnectionIndicator';
```

#### Feature-Specific Components

**Dashboard Components** (`src/components/dashboard/`):
- `AICoachCard.tsx` - Post-race AI analysis
- `CoursePredictor.tsx` - Race course prediction
- `NextRaceCard.tsx` - Upcoming race display
- `RaceCountdownTimer.tsx` - Timer widget
- `RecentRaceAnalysis.tsx` - Past race summary
- `StrategyPreview.tsx` - Strategy quick view
- `WeatherIntelligence.tsx` - Weather widget

**Venue Components** (`src/components/venue/`):
- `VenueMapView.web.tsx` / `VenueMapView.native.tsx` - Platform-specific maps
- `NetworkSidebar.tsx` - Sailing network browser
- `VenueDetailsSheet.tsx` - Venue info sheet
- `MapControls.tsx` - Map interaction controls
- `LocationSelector.tsx` - Venue picker
- `VenueSidebar.tsx` - Saved venues list

**Sailor Components** (`src/components/sailor/`):
- `CrewManagement.tsx` - Crew roster
- `CrewAvailabilityCalendar.tsx` - Scheduling
- `CrewPerformanceCard.tsx` - Crew stats

**Course Components** (`src/components/courses/`):
- `CourseMapView.tsx` - 3D course rendering (MapLibre)

**Navigation Components** (`src/components/navigation/`):
- `NavigationHeader.tsx` - Universal header

### Design Token System

#### Color Palette
**Semantic Colors** (from `tailwind.config.js`):

```javascript
primary: {
  0-950: /* Blue scale for primary actions */
  500: 'Primary action color'
  600: 'Hover state'
  700: 'Active state'
}

secondary: {
  0-950: /* Gray scale for secondary actions */
}

error: { 0-950 }      // Red scale
success: { 0-950 }    // Green scale
warning: { 0-950 }    // Amber scale
info: { 0-950 }       // Blue scale

typography: {
  0-950: /* Text colors */
  white: '#FFFFFF'
  gray: '#D4D4D4'
  black: '#181718'
}

outline: { 0-950 }    // Border colors
background: {
  0-950: /* Background colors */
  error: 'Error background'
  warning: 'Warning background'
  success: 'Success background'
  light: '#FBFBFB'
  dark: '#181719'
}
```

**Usage Pattern**:
```jsx
// Tailwind classes use semantic tokens
className="bg-primary-500 text-typography-0"
className="border-outline-200 bg-background-50"
```

#### Typography

**Font Families**:
- `heading`: Default system font
- `body`: Default system font
- `mono`: Monospace
- `roboto`: Roboto, sans-serif

**Font Sizes**:
```
2xs: 10px
xs: 12px
sm: 14px
base: 16px
lg: 18px
xl: 20px
2xl: 24px
3xl: 30px
```

**Font Weights**:
```
extrablack: 950
bold: 700
semibold: 600
medium: 500
```

#### Spacing & Layout

**Container Patterns**:
```jsx
// Standard page padding
className="px-4 py-4"          // 16px horizontal, 16px vertical

// Card spacing
className="p-4 mb-4"           // 16px padding, 16px bottom margin

// Section gaps
className="gap-2"              // 8px gap
className="gap-3"              // 12px gap
className="gap-4"              // 16px gap
```

**Border Radius**:
```
rounded-lg: 8px    // Standard cards
rounded-xl: 12px   // Feature cards
rounded-2xl: 16px  // Modals
rounded-3xl: 24px  // Special containers
rounded-full: 9999px // Pills/buttons
```

#### Shadows

**Web Shadows** (TailwindCSS):
```javascript
'hard-1': '-2px 2px 8px 0px rgba(38, 38, 38, 0.20)'
'hard-2': '0px 3px 10px 0px rgba(38, 38, 38, 0.20)'
'hard-3': '2px 2px 8px 0px rgba(38, 38, 38, 0.20)'
'hard-4': '0px -3px 10px 0px rgba(38, 38, 38, 0.20)'
'hard-5': '0px 2px 10px 0px rgba(38, 38, 38, 0.10)'
'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)'
'soft-2': '0px 0px 20px rgba(38, 38, 38, 0.2)'
'soft-3': '0px 0px 30px rgba(38, 38, 38, 0.1)'
'soft-4': '0px 0px 40px rgba(38, 38, 38, 0.1)'
```

**Native Shadows**:
```jsx
// Using StyleSheet for elevation
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 8,
elevation: 8  // Android
```

### Component Variants

#### Button Variants
```typescript
// Action types
action: 'primary' | 'secondary' | 'positive' | 'negative' | 'default'

// Visual styles
variant: 'solid' | 'outline' | 'link'

// Sizes
size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Examples:
<Button action="primary" variant="solid" size="md">
  <ButtonIcon as={Upload} />
  <ButtonText>Upload</ButtonText>
</Button>
```

#### Card Variants
```typescript
variant: 'elevated' | 'outlined' | 'filled'
size: 'sm' | 'md' | 'lg'

// Usage:
<Card variant="elevated" className="mb-4 p-4">
  {/* Content */}
</Card>
```

#### Badge Variants
```typescript
action: 'success' | 'warning' | 'error' | 'info' | 'muted'
variant: 'solid' | 'outline'

// Usage:
<Badge action="success" variant="solid">
  <BadgeIcon as={CheckCircle} />
  <BadgeText>Docs uploaded</BadgeText>
</Badge>
```

---

## Styling Approach

### Primary Styling Method: NativeWind (Tailwind for React Native)

**Configuration**:
```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: [
    "src/app/**/*.{tsx,jsx,ts,js}",
    "src/components/**/*.{tsx,jsx,ts,js}",
  ],
  presets: [require("nativewind/preset")],
  plugins: [gluestackPlugin],
}
```

**Global Styles**:
```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Styling Patterns

#### 1. Utility-First with Tailwind Classes
```jsx
<View className="flex-1 bg-gray-50">
  <View className="bg-primary-500 pt-12 pb-6 px-4">
    <Text className="text-white text-2xl font-bold">
      Welcome back
    </Text>
  </View>
</View>
```

#### 2. Component-Level Variants (GluestackUI TVA)
```typescript
// Using Tailwind Variants API (TVA)
const buttonStyle = tva({
  base: 'rounded bg-primary-500 flex-row items-center justify-center',
  variants: {
    size: {
      sm: 'px-4 h-9',
      md: 'px-5 h-10',
      lg: 'px-6 h-11',
    },
    variant: {
      solid: '',
      outline: 'bg-transparent border',
    }
  }
});
```

#### 3. StyleSheet for Platform-Specific Styles
```jsx
// Used when Tailwind is insufficient
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shadow: {
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          elevation: 8
        }
    ),
  }
});
```

### Responsive Design Strategy

#### 1. Platform Detection
```jsx
import { Platform } from 'react-native';

{Platform.OS === 'web' ? (
  <WebOptimizedComponent />
) : (
  <NativeOptimizedComponent />
)}
```

#### 2. Dimension-Based Responsiveness
```jsx
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmall = width < 768;

// Conditional rendering
{isSmall ? <MobileLayout /> : <DesktopLayout />}
```

#### 3. Hook-Based Responsive Layouts
```jsx
import { useWindowDimensions } from 'react-native';

export function ResponsiveLayout() {
  const { width } = useWindowDimensions();

  return (
    <View style={{ flexDirection: width > 768 ? 'row' : 'column' }}>
      <MainContent />
      <Sidebar />
    </View>
  );
}
```

### Common Layout Patterns

#### 1. Full-Screen with Header
```jsx
<View className="flex-1 bg-gray-50">
  {/* Header */}
  <View className="bg-primary-500 pt-12 pb-6 px-4">
    <Text className="text-white text-2xl font-bold">Title</Text>
  </View>

  {/* Scrollable Content */}
  <ScrollView className="flex-1 px-4 py-4">
    {/* Content */}
  </ScrollView>
</View>
```

#### 2. Map with Floating UI
```jsx
<View className="flex-1">
  {/* Full-screen map background */}
  <View style={StyleSheet.absoluteFillObject}>
    <MapView />
  </View>

  {/* Floating sidebar */}
  <View className="absolute left-4 top-4 bottom-4 w-80">
    <Sidebar />
  </View>

  {/* Floating controls */}
  <View className="absolute right-4 top-4">
    <Controls />
  </View>
</View>
```

#### 3. Modal Overlays
```jsx
<Modal
  visible={visible}
  animationType="slide"
  presentationStyle="pageSheet"
  transparent={true}
>
  <View className="flex-1 bg-black/80 items-center justify-center">
    <View className="bg-white rounded-3xl p-8 w-full max-w-md">
      {/* Modal content */}
    </View>
  </View>
</Modal>
```

---

## UX Concerns & Recommendations

### 🔴 Critical Issues

#### 1. **Tab Bar Overflow (7 tabs on mobile)**
**Problem**: Sailor persona has 7 visible tabs, which is cramped on mobile devices.

**Current State**:
```
[Dashboard][Calendar][Courses][Boats][Fleets][Club][More]
```

**Impact**:
- Small touch targets on phones
- Tab labels truncated or illegible
- Poor accessibility (WCAG requires min 44x44 pt)

**Recommendations**:
- **Option A**: Reduce to 5 primary tabs, move others to "More" menu
  ```
  [Dashboard][Races][Boats][Fleets][More]
  ```
- **Option B**: Use bottom sheet navigation for secondary items
- **Option C**: Implement swipeable tab bar with indicators

#### 2. **Inconsistent Modal Presentation Styles**
**Problem**: Mix of `presentationStyle` values across modals

**Examples**:
- Races: `presentationStyle="pageSheet"` (some), `presentationStyle="fullScreen"` (others)
- Venue: `transparent={true}` overlays
- No consistent pattern for when to use each

**Impact**:
- Confusing user experience
- Platform inconsistencies (iOS vs Android vs Web)

**Recommendations**:
- Define modal hierarchy:
  - **Full Screen**: Major workflows (Race Mode, Analysis)
  - **Page Sheet**: Forms and data entry (Upload, Strategy)
  - **Transparent Overlay**: Confirmations and alerts
- Document in style guide

#### 3. **Heavy Reliance on Modal Workflows**
**Problem**: Many features use deeply nested modals (Upload → Extract → Visualize → Strategy)

**Impact**:
- Navigation confusion (how to go back?)
- State management complexity
- Can't deep-link to specific steps

**Recommendations**:
- Convert multi-step modals to stack navigation
- Use wizard pattern with progress indicator
- Allow direct access to each step via routing

### 🟡 Moderate Issues

#### 4. **Inconsistent Empty States**
**Problem**: Different empty state patterns across screens

**Examples**:
- Dashboard: Icon + Title + Description + CTA button
- Races: Multiple variations based on data state
- Some use `EmptyState` component, others custom

**Recommendations**:
- Standardize `EmptyState` component usage
- Define 3 patterns:
  - **Zero State**: First-time user (inspirational)
  - **No Results**: Filtered list empty (suggest removal)
  - **Error State**: Failed to load (retry action)

#### 5. **Color Semantics Unclear**
**Problem**: Purple used for both AI features and some UI elements without clear meaning

**Examples**:
- AI Venue Intelligence: Purple border
- Strategy Modal: Purple header and cards
- But also used for general accent colors

**Recommendations**:
- Codify AI features with consistent purple theme
- Document color semantics:
  - **Purple**: AI/intelligent features
  - **Blue (Primary)**: Standard actions
  - **Green**: Success/positive
  - **Red**: Errors/warnings
  - **Amber**: Alerts/caution

#### 6. **Accessibility Gaps**
**Problem**: No visible focus indicators, inconsistent touch target sizes

**Issues**:
- Buttons sometimes < 44pt min touch target
- No keyboard navigation support (web)
- Color contrast not verified
- No screen reader optimization

**Recommendations**:
- Audit with `mcp__browser-tools__runAccessibilityAudit`
- Add focus styles to all interactive elements
- Test with VoiceOver/TalkBack
- Ensure WCAG AA compliance (4.5:1 contrast)

### 🟢 Minor Issues

#### 7. **Platform-Specific Component Split**
**Problem**: Some components have `.web.tsx` and `.native.tsx` versions without clear strategy

**Files**:
- `VenueMapView.web.tsx` / `VenueMapView.native.tsx`
- `boats.web.tsx` / `boats.tsx`

**Recommendations**:
- Document when to use platform-specific components
- Consider using `Platform.select()` for smaller differences
- Ensure feature parity across platforms

#### 8. **Loading State Consistency**
**Problem**: Mix of loading patterns (ActivityIndicator, Skeleton, custom)

**Recommendations**:
- Use `DashboardSkeleton` for dashboard-like screens
- Use `ListSkeleton` for list screens
- Use `Spinner` for inline/button loading
- Use `ProcessingIndicator` for AI operations

### 🔵 Positive Patterns

#### ✅ **Excellent Use of Memoization**
Dashboard uses `React.memo` for `BoatCard` and `FleetCard` to prevent unnecessary re-renders.

#### ✅ **Progressive Disclosure**
Race workflow reveals complexity gradually (Upload → Extract → Visualize → Strategy).

#### ✅ **Offline-First Architecture**
Network status indicators and offline data caching demonstrate thoughtful UX.

#### ✅ **AI Transparency**
Showing confidence scores, tools used, and reasoning builds trust in AI features.

#### ✅ **Contextual Empty States**
Different messages based on user state (no races vs. races but no course data).

---

## Code Samples

### 1. Dashboard Screen (Main Tab)

```tsx
// src/app/(tabs)/dashboard.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { MapPin, Trophy, Clock, Wind, Users, Bell } from 'lucide-react-native';
import { Card } from '@/src/components/ui/card';
import { Badge, BadgeText, BadgeIcon } from '@/src/components/ui/badge';
import { Button, ButtonText, ButtonIcon } from '@/src/components/ui/button';
import { DashboardSkeleton } from '@/src/components/ui/loading';
import { ErrorMessage } from '@/src/components/ui/error';
import { useDashboardData } from '@/src/hooks/useData';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { useVenueDetection } from '@/src/hooks/useVenueDetection';
import { useOffline } from '@/src/hooks/useOffline';
import { OfflineIndicator } from '@/src/components/ui/OfflineIndicator';
import { AICoachCard } from '@/src/components/dashboard/AICoachCard';
import { useRouter } from 'expo-router';
import { RealtimeConnectionIndicator } from '@/src/components/ui/RealtimeConnectionIndicator';
import { useLiveRaces } from '@/src/hooks/useRaceResults';
import { VenueIntelligenceAgent } from '@/src/services/agents/VenueIntelligenceAgent';

const { width } = Dimensions.get('window');

// Memoized boat card component
const BoatCard = React.memo(({ boat, onPress }: { boat: any; onPress: () => void }) => (
  <TouchableOpacity
    className="mb-3 pb-3 border-b border-gray-100"
    onPress={onPress}
  >
    <Text className="font-bold">{boat.name}</Text>
    <Text className="text-gray-600 text-sm">{boat.boat_class}</Text>
  </TouchableOpacity>
));

const DashboardScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState({ days: 3, hours: 14, minutes: 22 });

  // Fetch data from API
  const {
    profile,
    nextRace,
    recentRaces,
    recentTimerSessions,
    performanceHistory,
    boats,
    fleets,
    loading,
    error,
    refreshing,
    onRefresh
  } = useDashboardData();

  // GPS Venue Detection
  const { currentVenue, isDetecting, confidence } = useVenueDetection();

  // Offline support
  const { isOnline, cacheNextRace } = useOffline();

  // Real-time race updates
  const { liveRaces, loading: liveRacesLoading } = useLiveRaces(user?.id);

  // AI Venue Analysis
  const [venueInsights, setVenueInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Cache next race for offline use
  React.useEffect(() => {
    if (nextRace && user) {
      cacheNextRace(nextRace.id, user.id).catch(err =>
        console.error('Failed to cache race:', err)
      );
    }
  }, [nextRace, user]);

  // Trigger AI venue analysis when venue is detected
  React.useEffect(() => {
    if (currentVenue && confidence > 0.5 && !venueInsights) {
      handleGetVenueInsights();
    }
  }, [currentVenue, confidence]);

  // Get AI insights for current venue
  const handleGetVenueInsights = async () => {
    if (!currentVenue?.id) return;

    setLoadingInsights(true);
    try {
      const agent = new VenueIntelligenceAgent();
      const result = await agent.analyzeVenue(currentVenue.id);

      if (result.success) {
        setVenueInsights(result.insights);
        setShowInsights(true);
      }
    } catch (error: any) {
      console.error('Error getting venue insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Loading state
  if (loading && !profile) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error && !profile) {
    return (
      <View className="flex-1 bg-background-0 items-center justify-center">
        <ErrorMessage
          title="Unable to load dashboard"
          message={error.message || 'Please check your connection and try again'}
          type="network"
          onRetry={onRefresh}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-500 pt-12 pb-6 px-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-2xl font-bold">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}
          </Text>
          <View className="flex-row gap-2 items-center">
            <OfflineIndicator />
            <RealtimeConnectionIndicator variant="compact" showLabel={false} />
            <TouchableOpacity className="bg-primary-600 p-2 rounded-full">
              <Bell color="white" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* GPS Venue Detection Display */}
        <TouchableOpacity
          className="flex-row items-center mb-4"
          onPress={() => router.push('/venue')}
        >
          <MapPin color="white" size={16} />
          {isDetecting ? (
            <View className="flex-row items-center ml-2">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-lg ml-2">Detecting venue...</Text>
            </View>
          ) : currentVenue ? (
            <View className="flex-row items-center flex-1">
              <Text className="text-white text-lg ml-2">{currentVenue.name}</Text>
              {confidence > 0 && (
                <Badge action="success" variant="solid" className="ml-2">
                  <BadgeText className="text-xs">
                    🌍 GPS Detected ({Math.round(confidence * 100)}%)
                  </BadgeText>
                </Badge>
              )}
              {loadingInsights && (
                <ActivityIndicator size="small" color="white" className="ml-2" />
              )}
            </View>
          ) : profile?.home_venue ? (
            <Text className="text-white text-lg ml-2">{profile.home_venue}</Text>
          ) : (
            <Text className="text-white text-lg ml-2">Tap to set venue</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-between bg-primary-600 p-3 rounded-xl">
          <View className="items-center">
            <Text className="text-white font-bold">{performanceHistory?.length || 0}</Text>
            <Text className="text-primary-100 text-xs">Races</Text>
          </View>
          <View className="items-center">
            <Text className="text-white font-bold">-</Text>
            <Text className="text-primary-100 text-xs">Venues</Text>
          </View>
          <View className="items-center">
            <Text className="text-white font-bold">-</Text>
            <Text className="text-primary-100 text-xs">Avg Pos</Text>
          </View>
          <View className="items-center">
            <Text className="text-white font-bold">-</Text>
            <Text className="text-primary-100 text-xs">Ranking</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
      >
        {/* AI Venue Insights Card */}
        {showInsights && venueInsights && (
          <Card className="mb-4 p-4 border-2 border-purple-500" variant="elevated">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Text className="text-lg font-bold ml-2">🤖 AI Venue Intelligence</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInsights(false)}>
                <Text className="text-gray-500">✕</Text>
              </TouchableOpacity>
            </View>

            <Text className="font-bold text-purple-700 mb-2">{venueInsights.venueName}</Text>

            {/* Safety, Racing, Cultural recommendations... */}

            <Button
              action="secondary"
              variant="outline"
              size="sm"
              className="mt-2"
              onPress={() => router.push('/venue')}
            >
              <ButtonText>View Full Intelligence</ButtonText>
            </Button>
          </Card>
        )}

        {/* Next Race Card */}
        {nextRace ? (
          <Card className="mb-4 overflow-hidden" variant="elevated">
            {/* Race details... */}
          </Card>
        ) : (
          <Card className="mb-4 p-6" variant="elevated">
            <View className="items-center">
              <Calendar color="rgb(107, 114, 128)" size={48} />
              <Text className="text-lg font-bold text-typography-900 mt-4">No upcoming races</Text>
              <Text className="text-typography-500 text-center mt-2">
                Add your next race to get AI-powered strategy and planning
              </Text>
              <Button action="primary" variant="solid" size="md" className="mt-4">
                <ButtonIcon as={Plus} />
                <ButtonText>Add Race</ButtonText>
              </Button>
            </View>
          </Card>
        )}

        {/* Boats, Fleets sections... */}
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;
```

### 2. Reusable Button Component

```tsx
// src/components/ui/button/index.tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';

const buttonStyle = tva({
  base: 'group/button rounded bg-primary-500 flex-row items-center justify-center gap-2',
  variants: {
    action: {
      primary: 'bg-primary-500 data-[hover=true]:bg-primary-600 data-[active=true]:bg-primary-700',
      secondary: 'bg-secondary-500 data-[hover=true]:bg-secondary-600 data-[active=true]:bg-secondary-700',
      positive: 'bg-success-500 data-[hover=true]:bg-success-600 data-[active=true]:bg-success-700',
      negative: 'bg-error-500 data-[hover=true]:bg-error-600 data-[active=true]:bg-error-700',
      default: 'bg-transparent data-[hover=true]:bg-background-50',
    },
    variant: {
      link: 'px-0',
      outline: 'bg-transparent border data-[hover=true]:bg-background-50',
      solid: '',
    },
    size: {
      xs: 'px-3.5 h-8',
      sm: 'px-4 h-9',
      md: 'px-5 h-10',
      lg: 'px-6 h-11',
      xl: 'px-7 h-12',
    },
  },
});

const buttonTextStyle = tva({
  base: 'text-typography-0 font-semibold',
  parentVariants: {
    action: {
      primary: 'text-primary-600 data-[hover=true]:text-primary-600',
      secondary: 'text-typography-500 data-[hover=true]:text-typography-600',
    },
    variant: {
      link: 'data-[hover=true]:underline',
      solid: 'text-typography-0',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
  },
});

type IButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
  VariantProps<typeof buttonStyle> & { className?: string };

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, IButtonProps>(
  ({ className, variant = 'solid', size = 'md', action = 'primary', ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        {...props}
        className={buttonStyle({ variant, size, action, class: className })}
      />
    );
  }
);

const ButtonText = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) => (
  <Text {...props} className={buttonTextStyle({ class: className })} />
);

Button.displayName = 'Button';
ButtonText.displayName = 'ButtonText';

export { Button, ButtonText };
```

### 3. AI-Powered Race Course Screen

```tsx
// src/app/(tabs)/races.tsx (abbreviated)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Upload, Sparkles, CheckCircle, AlertCircle } from 'lucide-react-native';
import CourseMapView from '@/src/components/courses/CourseMapView';
import { DocumentProcessingAgent } from '@/src/services/agents/DocumentProcessingAgent';
import { CoursePredictionAgent } from '@/src/services/agents/CoursePredictionAgent';
import { raceStrategyEngine } from '@/src/services/ai/RaceStrategyEngine';

type WorkflowStep = 'map' | 'upload' | 'extract' | 'visualize' | 'strategy';

export default function CoursesScreen() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('map');
  const [extractedCourse, setExtractedCourse] = useState<any>(null);
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);
  const [coursePrediction, setCoursePrediction] = useState<any>(null);

  const [processingStatus, setProcessingStatus] = useState<{
    step: 'upload' | 'extract' | 'visualize' | 'strategy' | 'save' | 'complete';
    message: string;
  }>({ step: 'upload', message: 'Ready to upload' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  /**
   * Handle document upload and processing with DocumentProcessingAgent
   */
  const handleDocumentUpload = async () => {
    try {
      // Step 1: Pick document
      setProcessingStatus({ step: 'upload', message: 'Selecting document...' });

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Step 2: Read file content
      setCurrentStep('extract');
      setIsProcessing(true);
      setProcessingError(null);
      setProcessingStatus({ step: 'extract', message: 'Reading document...' });

      let documentText = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Step 3: Process with DocumentProcessingAgent
      setProcessingStatus({ step: 'extract', message: 'AI extracting course data...' });

      const agent = new DocumentProcessingAgent();
      const agentResult = await agent.processSailingInstructions(
        documentText,
        file.name,
        undefined
      );

      if (!agentResult.success) {
        throw new Error(agentResult.error || 'Failed to process document');
      }

      // Step 4: Extract data from agent response
      setProcessingStatus({ step: 'visualize', message: 'Generating 3D visualization...' });

      const toolResults = agentResult.toolResults || [];
      const extractionTool = toolResults.find((t: any) => t.toolName === 'extract_race_course_from_si');
      const visualizationTool = toolResults.find((t: any) => t.toolName === 'generate_3d_course_visualization');

      if (!extractionTool?.result?.success) {
        throw new Error('Failed to extract course information from document');
      }

      const extraction = extractionTool.result.extraction;
      const visualization = visualizationTool?.result;

      // Step 5: Transform to CourseMark format
      const marks = extraction.marks
        .filter((m: any) => m.coordinates?.lat && m.coordinates?.lng)
        .map((m: any, index: number) => ({
          id: `mark-${index}`,
          name: m.name,
          type: m.type || 'mark',
          coordinates: {
            latitude: m.coordinates.lat,
            longitude: m.coordinates.lng,
          },
        }));

      setExtractedCourse({
        marks,
        visualization: visualization?.geoJSON,
      });

      // Step 6: Save to database
      setProcessingStatus({ step: 'save', message: 'Saving to database...' });
      // ... database save logic

      // Success!
      setProcessingStatus({ step: 'complete', message: 'Processing complete!' });
      setIsProcessing(false);

      setTimeout(() => {
        setCurrentStep('visualize');
      }, 1000);

    } catch (error: any) {
      console.error('Document processing error:', error);
      setProcessingError(error.message || 'Unknown error occurred');
      setIsProcessing(false);
      setCurrentStep('upload');

      Alert.alert(
        'Processing Failed',
        error.message || 'Failed to process sailing instructions. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Render AI Extraction Loading Modal
  const renderExtractionModal = () => {
    const steps = [
      { key: 'upload', label: 'Document uploaded', completed: processingStatus.step !== 'upload' },
      { key: 'extract', label: 'Extracting course data', completed: ['visualize', 'strategy', 'save', 'complete'].includes(processingStatus.step) },
      { key: 'visualize', label: 'Generating 3D visualization', completed: ['strategy', 'save', 'complete'].includes(processingStatus.step) },
      { key: 'strategy', label: 'Analyzing race strategy', completed: ['save', 'complete'].includes(processingStatus.step) },
      { key: 'save', label: 'Saving to database', completed: processingStatus.step === 'complete' },
    ];

    return (
      <Modal visible={currentStep === 'extract'} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md items-center">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              {processingError ? (
                <AlertCircle color="#EF4444" size={40} />
              ) : (
                <Sparkles color="#2563EB" size={40} />
              )}
            </View>

            <Text className="text-2xl font-bold mb-2">
              {processingError ? 'Processing Failed' : 'AI Processing'}
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              {processingError || processingStatus.message}
            </Text>

            <View className="w-full space-y-3">
              {steps.map((step) => {
                const isActive = processingStatus.step === step.key;
                const isCompleted = step.completed;

                return (
                  <View key={step.key} className="flex-row items-center">
                    {isCompleted ? (
                      <CheckCircle color="#10B981" size={20} />
                    ) : isActive ? (
                      <ActivityIndicator size="small" color="#F59E0B" />
                    ) : (
                      <AlertCircle color="#9CA3AF" size={20} />
                    )}
                    <Text className={`ml-3 ${isCompleted ? 'text-gray-700' : isActive ? 'text-gray-700 font-semibold' : 'text-gray-500'}`}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {processingError && (
              <TouchableOpacity
                className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
                onPress={() => {
                  setProcessingError(null);
                  setCurrentStep('upload');
                }}
              >
                <Text className="text-white font-bold">Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View className="flex-1">
      <CourseMapView
        courseMarks={extractedCourse?.marks || []}
        prediction={coursePrediction}
      />

      {/* Upload Modal */}
      <Modal visible={currentStep === 'upload'} animationType="slide">
        <View className="flex-1 bg-gray-50">
          <View className="bg-blue-600 pt-12 pb-4 px-4">
            <Text className="text-white text-xl font-bold">Upload Sailing Instructions</Text>
          </View>

          <ScrollView className="flex-1 p-4">
            <TouchableOpacity
              className="bg-white rounded-xl p-6 mb-4 shadow-sm"
              onPress={handleDocumentUpload}
              disabled={isProcessing}
            >
              <View className="items-center">
                <Upload color={isProcessing ? "#9CA3AF" : "#2563EB"} size={48} />
                <Text className="text-lg font-bold mt-3">Upload PDF</Text>
                <Text className="text-gray-600 text-center mt-1">
                  Select sailing instructions from your device
                </Text>
                {isProcessing && (
                  <ActivityIndicator size="small" color="#2563EB" className="mt-2" />
                )}
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {renderExtractionModal()}
    </View>
  );
}
```

---

## Summary & Next Steps

### What Works Well ✅
1. **Comprehensive Design System** - Token-based with GluestackUI variants
2. **Universal Platform Support** - Expo provides consistent experience across platforms
3. **AI Integration** - Transparent, confidence-scored AI features
4. **Offline Support** - Network-aware with caching and indicators
5. **Component Reusability** - Well-structured component library

### Priority Improvements 🎯
1. **Navigation Simplification** - Reduce tab overflow, standardize modal patterns
2. **Accessibility Audit** - WCAG compliance, focus management, screen readers
3. **Empty State Consistency** - Standardize EmptyState component usage
4. **Color Semantics Documentation** - Codify purple for AI, clarify brand usage
5. **Performance Optimization** - Audit large list rendering, image loading

### Recommended Actions
1. **Design Audit**:
   - Run accessibility audit: `mcp__browser-tools__runAccessibilityAudit`
   - Run performance audit: `mcp__browser-tools__runPerformanceAudit`
   - Document findings in style guide

2. **Navigation Refactor**:
   - Reduce sailor tabs to 5 visible + More menu
   - Convert modal workflows to stack navigation
   - Add deep linking support

3. **Component Library Enhancement**:
   - Standardize empty states
   - Add focus styles
   - Document color semantics
   - Create responsive layout helpers

4. **User Testing**:
   - Test tab navigation on various screen sizes
   - Validate modal workflows (especially multi-step)
   - Verify AI feature transparency and trust

---

*Document generated by analyzing RegattaFlow Expo app structure, screens, and components.*
