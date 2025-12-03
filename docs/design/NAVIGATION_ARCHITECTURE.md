# RegattaFlow Navigation Architecture

## Table of Contents
1. [Navigation Principles](#navigation-principles)
2. [Information Architecture](#information-architecture)
3. [Sailor Navigation](#sailor-navigation)
4. [Coach Navigation](#coach-navigation)
5. [Club Navigation](#club-navigation)
6. [Cross-Persona Connections](#cross-persona-connections)
7. [Deep Linking](#deep-linking)
8. [Navigation States](#navigation-states)
9. [Implementation Guide](#implementation-guide)

---

## Navigation Principles

### Core Principles

1. **Consistent Structure**: Same patterns across all three personas
2. **Maximum 3 Taps**: Any feature accessible within 3 taps from home
3. **Clear Hierarchy**: Always know where you are and how to go back
4. **Context Preservation**: Return to previous state after drill-down
5. **Fast Access**: Common actions available from multiple entry points
6. **No Dead Ends**: Every screen has a clear exit path

### Navigation Patterns

**Primary**: Bottom Tab Bar (5 max tabs)
**Secondary**: Stack Navigation (push/pop)
**Tertiary**: Modal Presentations (temporary context)
**Quick Actions**: Floating Action Button (FAB) or header actions

---

## Information Architecture

### Site Map Overview

```
RegattaFlow App
├── Authentication
│   ├── Login
│   ├── Sign Up (Role Selection)
│   └── Password Reset
├── Sailor Persona
│   ├── Dashboard (Tab 1)
│   ├── Races (Tab 2)
│   ├── Training (Tab 3)
│   ├── Analysis (Tab 4)
│   └── Profile (Tab 5)
├── Coach Persona
│   ├── Dashboard (Tab 1)
│   ├── Clients (Tab 2)
│   ├── Schedule (Tab 3)
│   ├── Earnings (Tab 4)
│   └── Profile (Tab 5)
└── Club Persona
    ├── Operations HQ (Tab 1)
    ├── Events (Tab 2)
    ├── Members (Tab 3)
    ├── Race Command (Tab 4)
    └── Settings (Tab 5)
```

---

## Sailor Navigation

### Tab Bar Structure

```typescript
const SailorTabs = {
  tabs: [
    {
      name: 'Dashboard',
      icon: Home,
      screen: 'SailorDashboard',
      badge: null,
    },
    {
      name: 'Races',
      icon: Flag,
      screen: 'RaceList',
      badge: 'upcomingCount', // Dynamic badge
    },
    {
      name: 'Training',
      icon: Activity,
      screen: 'TrainingLog',
      badge: null,
    },
    {
      name: 'Analysis',
      icon: BarChart,
      screen: 'RaceAnalysis',
      badge: 'unanalyzedCount',
    },
    {
      name: 'Profile',
      icon: User,
      screen: 'SailorProfile',
      badge: null,
    },
  ],
};
```

### Complete Navigation Tree

```
Sailor App
│
├── 📱 Tab 1: Dashboard
│   ├── Next Race Card → Race Details
│   ├── Quick Actions
│   │   ├── Log Training → Training Log Entry
│   │   ├── Weather Check → Weather Detail
│   │   └── Find Coach → Coach List → Coach Profile → Book Session
│   ├── Recommendations
│   │   ├── Review Race → Race Analysis
│   │   └── View Coaching → AI Coach
│   └── Upcoming Races → Race List
│
├── 🏁 Tab 2: Races
│   ├── Search & Filter → Filter Modal
│   ├── Race Cards → Race Details
│   │   ├── Register → Registration Form
│   │   ├── View Map → Map View (Full Screen)
│   │   ├── Participants → Participant List
│   │   └── Documents → Document Viewer
│   └── [+] Create Race → Create Race Form
│       └── Success → Race Details
│
├── ⛵ Tab 3: Training
│   ├── Monthly Stats (expandable)
│   ├── Session Cards → Session Detail
│   │   ├── Edit → Training Log Entry
│   │   └── Share → Share Sheet
│   └── [+] Log Session → Training Log Entry
│       └── Timer Running → Background Timer
│
├── 📊 Tab 4: Analysis
│   ├── Select Race → Analysis Flow
│   │   ├── Step 1: Select Race
│   │   ├── Step 2: Quick Input
│   │   └── Step 3: Results
│   │       ├── View Map → Map View
│   │       ├── Watch Tutorial → Video Player
│   │       └── Share with Coach → Share Sheet
│   └── AI Coach → Chat Interface
│       ├── Voice Mode
│       ├── Text Mode
│       └── Settings → Voice Settings
│
└── 👤 Tab 5: Profile
    ├── Edit Profile → Profile Form
    ├── Performance Stats
    │   ├── Races & Results → Race History
    │   ├── Training Log → Tab 3
    │   ├── Personal Records → Records List
    │   └── Performance Trends → Trends Graph
    ├── Boats & Equipment
    │   ├── My Boats → Boat List → Boat Detail → Edit Boat
    │   ├── Sail Inventory → Sail List → Sail Detail
    │   └── Maintenance Log → Maintenance List → Log Entry
    ├── Preferences
    │   ├── Notifications → Notification Settings
    │   ├── Units → Unit Settings
    │   ├── Language → Language Picker
    │   └── Privacy → Privacy Settings
    ├── Subscriptions → Subscription Management
    └── Support
        ├── Help Center → Help Articles
        ├── Contact Support → Contact Form
        ├── Report Bug → Bug Report Form
        └── About → About Screen
```

### User Flows

**Flow 1: Register for a Race**
```
Dashboard → Races → Race Details → Register → Confirmation
         ↓
    Quick path: "Next Race" card → View Details → Register
```

**Flow 2: Log Training Session**
```
Training → [+] Log Session → Select Type → Enter Duration → Save
        ↓
    Quick path: Dashboard → Log Training (Quick Action)
```

**Flow 3: Analyze Race**
```
Analysis → Select Race → Quick Input → AI Analysis → View Results
        ↓
    Alternative: Dashboard → Recommendation Card → Start Analysis
```

**Flow 4: Find and Book Coach**
```
Dashboard → Find Coach → Browse Coaches → Coach Profile → Book Session → Calendar → Confirm
```

---

## Coach Navigation

### Tab Bar Structure

```typescript
const CoachTabs = {
  tabs: [
    {
      name: 'Dashboard',
      icon: Home,
      screen: 'CoachDashboard',
      badge: null,
    },
    {
      name: 'Clients',
      icon: Users,
      screen: 'ClientList',
      badge: 'pendingRequests',
    },
    {
      name: 'Schedule',
      icon: Calendar,
      screen: 'CoachSchedule',
      badge: 'todaySessionCount',
    },
    {
      name: 'Earnings',
      icon: DollarSign,
      screen: 'Earnings',
      badge: 'pendingPayments',
    },
    {
      name: 'Profile',
      icon: User,
      screen: 'CoachProfile',
      badge: null,
    },
  ],
};
```

### Complete Navigation Tree

```
Coach App
│
├── 📱 Tab 1: Dashboard
│   ├── Quick Stats (expandable)
│   ├── Today's Sessions → Session Detail
│   │   ├── Start Session → Timer + Notes
│   │   ├── Reschedule → Calendar Picker
│   │   └── Cancel → Confirmation
│   ├── Active Clients → Tab 2: Client List
│   └── Quick Actions
│       ├── Block Time → Schedule → Block Time Form
│       ├── Session Notes → Notes Entry
│       └── Send Invoice → Invoice Form
│
├── 👥 Tab 2: Clients
│   ├── Search Clients
│   ├── Client Cards → Client Detail
│   │   ├── Tabs: Sessions | Progress | Notes | Goals
│   │   ├── [Sessions Tab]
│   │   │   ├── Upcoming Session → Session Detail
│   │   │   └── Past Sessions → Session Detail → Feedback
│   │   ├── [Progress Tab]
│   │   │   ├── Progress Chart
│   │   │   ├── Achievements
│   │   │   └── Race Results → Race Detail
│   │   ├── [Notes Tab]
│   │   │   ├── Note Cards → Edit Note
│   │   │   └── [+] Add Note → Note Entry
│   │   └── [Goals Tab]
│   │       ├── Active Goals → Edit Goal
│   │       ├── Completed Goals
│   │       └── [+] Add Goal → Goal Entry
│   ├── Pending Requests → Request List → Accept/Decline
│   └── [+] Add Client → Client Form
│
├── 📅 Tab 3: Schedule
│   ├── Week View ↔️ Day View (toggle)
│   ├── Session Blocks → Session Detail
│   │   ├── Start Session → Timer + Notes → Post-Session Feedback
│   │   ├── Reschedule → Calendar Picker
│   │   └── Cancel → Confirmation
│   ├── Booking Link (Copy/Share)
│   ├── Open Availability
│   ├── Booking Requests → Request Detail → Accept/Suggest/Decline
│   └── [+] Block Time → Time Block Form
│
├── 💰 Tab 4: Earnings
│   ├── Monthly Stats (expandable)
│   ├── Earnings Trend (chart)
│   ├── Stats Cards
│   ├── Transactions → Transaction Detail
│   │   ├── View Invoice
│   │   ├── Email Invoice
│   │   └── Mark as Refunded
│   ├── [Filter] → Filter Modal
│   └── Quick Actions
│       ├── Send Invoice → Invoice Form
│       └── Export Report → Export Options
│
└── 👤 Tab 5: Profile
    ├── Edit Profile → Profile Form
    ├── Coach Profile (Public)
    │   ├── About
    │   ├── Specialties
    │   ├── Pricing
    │   ├── Availability
    │   └── Reviews → Review List
    ├── Business Settings
    │   ├── Payment Methods
    │   ├── Tax Information
    │   └── Cancellation Policy
    ├── Preferences
    │   ├── Notifications
    │   ├── Calendar Sync
    │   └── Availability Hours
    └── Support
        ├── Help Center
        ├── Contact Support
        └── About
```

### User Flows

**Flow 1: Accept Booking Request**
```
Dashboard → Booking Requests Badge → Review Request → Accept → Confirmation
         ↓
    Alternative: Schedule → Booking Requests → Accept
```

**Flow 2: Complete Session & Leave Feedback**
```
Schedule → Today's Session → Start Session → Timer + Notes → End Session → Feedback Form → Send to Client
```

**Flow 3: Track Client Progress**
```
Clients → Select Client → Progress Tab → View Charts → Add Note → Save
```

**Flow 4: Check Earnings**
```
Earnings → View Monthly Stats → Filter by Client → View Transaction → Send Invoice
```

---

## Club Navigation

### Tab Bar Structure

```typescript
const ClubTabs = {
  tabs: [
    {
      name: 'Operations',
      icon: Home,
      screen: 'ClubOperations',
      badge: 'actionItems',
    },
    {
      name: 'Events',
      icon: Calendar,
      screen: 'EventCalendar',
      badge: 'upcomingEvents',
    },
    {
      name: 'Members',
      icon: Users,
      screen: 'MembershipHQ',
      badge: 'pendingApplications',
    },
    {
      name: 'Race Control',
      icon: Radio,
      screen: 'RaceCommand',
      badge: 'liveRaces',
    },
    {
      name: 'Settings',
      icon: Settings,
      screen: 'ClubSettings',
      badge: null,
    },
  ],
};
```

### Complete Navigation Tree

```
Club App
│
├── 🏛️ Tab 1: Operations HQ
│   ├── Needs Attention (priority inbox)
│   │   ├── Action Cards → Specific Action
│   │   │   ├── Assign RO → RO Assignment
│   │   │   ├── Review Applications → Applications List
│   │   │   └── Schedule Maintenance → Maintenance Form
│   ├── Stats (expandable)
│   ├── Quick Actions
│   │   ├── Create Event → Event Creation Flow
│   │   ├── Member Roster → Tab 3: Members
│   │   └── Race Command → Tab 4: Race Control
│   └── Upcoming Events → Tab 2: Events
│
├── 📅 Tab 2: Events
│   ├── Calendar View ↔️ List View (toggle)
│   ├── Filter: [All | Regattas | Races | Social]
│   ├── Event Cards → Event Detail
│   │   ├── Edit Event → Event Form
│   │   ├── View Participants → Participant List
│   │   ├── Manage Staff → Staff Assignment
│   │   ├── Race Documents → Document Manager
│   │   └── Cancel Event → Confirmation
│   ├── [+] Create Event → Event Creation Flow
│   │   ├── Event Type Selection
│   │   ├── Basic Info
│   │   ├── Schedule
│   │   └── Confirmation
│   └── Export Calendar → Export Options
│
├── 👥 Tab 3: Members
│   ├── Membership Stats (expandable)
│   ├── Membership Breakdown
│   ├── Search & Filter
│   ├── Member Cards → Member Profile
│   │   ├── Tabs: Profile | Boats | Activity | Payment
│   │   ├── [Profile Tab]
│   │   │   ├── Personal Info
│   │   │   ├── Sailing Info
│   │   │   └── Admin Notes → Add Note
│   │   ├── [Boats Tab]
│   │   │   └── Boat List → Boat Detail
│   │   ├── [Activity Tab]
│   │   │   ├── Races → Race Detail
│   │   │   ├── Training Sessions
│   │   │   └── Events Attended
│   │   └── [Payment Tab]
│   │       ├── Membership Status
│   │       ├── Payment History → Payment Detail
│   │       └── Send Invoice → Invoice Form
│   ├── Pending Applications → Application Review
│   │   ├── Approve → Welcome Email
│   │   ├── Request Info → Message Form
│   │   └── Deny → Confirmation
│   ├── [+] Add Member → Member Form
│   └── Actions
│       ├── Export Roster → Export Options
│       └── Email Blast → Email Form
│
├── 📡 Tab 4: Race Command
│   ├── Active Races → Race Control Panel
│   │   ├── Race Clock (live)
│   │   ├── Current Conditions (auto-refresh)
│   │   ├── Quick Actions
│   │   │   ├── General Recall → Broadcast
│   │   │   ├── Abandon Race → Confirmation
│   │   │   ├── Broadcast Message → Message Form
│   │   │   └── Log Incident → Incident Form
│   │   ├── Live Tracking → Race Map
│   │   ├── Finish Order Entry → Finish Entry
│   │   │   ├── Scan Sail Number
│   │   │   ├── Manual Entry
│   │   │   └── Edit Order
│   │   └── Protests → Protest List → Protest Detail
│   ├── Upcoming Races → Race Prep Checklist
│   ├── Completed Races → Results Entry
│   └── Equipment Status → Equipment List
│
└── ⚙️ Tab 5: Settings
    ├── Club Profile → Edit Club Profile
    │   ├── Basic Info
    │   ├── Logo & Images
    │   ├── Contact Info
    │   └── Social Media
    ├── Boat Classes → Class List → Add/Edit Class
    ├── Venues → Venue List → Venue Detail
    ├── Staff & Permissions
    │   ├── Admin List → Admin Detail
    │   ├── Race Officers → RO List
    │   └── [+] Add Staff → Invite Form
    ├── Event Templates → Template List → Edit Template
    ├── Notifications → Notification Settings
    ├── Billing & Subscription → Billing Portal
    └── Support
        ├── Help Center
        ├── Contact Support
        └── About
```

### User Flows

**Flow 1: Create and Run a Race**
```
Operations → Create Event → Event Type (Race) → Basic Info → Schedule → Confirm
           ↓
Day of Race: Race Command → Select Race → Start Race Clock → Monitor → Finish Entry → Post Results
```

**Flow 2: Approve Member Application**
```
Members → Pending Applications Badge → Review Application → Approve → Welcome Email Sent
       ↓
    Alert path: Operations → Needs Attention → Review Applications
```

**Flow 3: Manage Live Race**
```
Race Command → Active Race → Control Panel → Quick Actions (Recall/Broadcast/Incident)
            ↓
Parallel: Live Tracking (Map) | Finish Order Entry | Weather Monitoring
```

**Flow 4: Export Member Roster**
```
Members → Actions → Export Roster → Select Format → Select Fields → Download
```

---

## Cross-Persona Connections

### Sailor ↔ Coach Connection

**From Sailor Perspective:**

1. **Find Coach Flow:**
```
Sailor Dashboard → Find Coach → Browse Coaches → Coach Profile
                                                    ↓
                                            View Reviews
                                            View Availability
                                            View Specialties
                                            [Book Session]
                                                    ↓
                                            Calendar Selection → Confirm Booking
```

2. **View Coach Feedback:**
```
Sailor Dashboard → Notification "New Feedback from Sarah"
                                    ↓
                            View Feedback (read-only)
                            [Reply to Sarah] → Message sent to Coach
```

3. **Share Race with Coach:**
```
Race Analysis → Results → [Share with Coach] → Select Coach → Send
```

**From Coach Perspective:**

1. **Client Requests You:**
```
Coach Dashboard → Booking Requests Badge → Review Request
                                                ↓
                                        View Sailor Profile
                                        View Request Message
                                        [Accept] [Suggest Time] [Decline]
```

2. **Send Feedback to Sailor:**
```
Coach Schedule → Complete Session → Feedback Form → Send
                                                ↓
                            Sailor receives notification
                            Appears in Sailor's dashboard
```

3. **Track Sailor's Races:**
```
Coach Clients → Select Client → Progress Tab → Race Results
                                                    ↓
                                            Click Race → Race Detail
                                            View Analysis (if shared)
```

**Visual Connection:**
- Coach cards show "🔗 Connected" badge
- Sailor profile shows "Coach: Sarah Chen"
- Shared races show "Shared with Sarah" tag

---

### Sailor ↔ Club Connection

**From Sailor Perspective:**

1. **Register for Club Event:**
```
Sailor Races → Browse Races → Club Event (🏛️ badge)
                                    ↓
                            Race Detail shows club info
                            "Organized by Royal Hong Kong YC"
                            [View Club Profile] (modal)
                            [Register for Race]
```

2. **View Club Details:**
```
Race Detail → Tap Club Name → Club Profile Modal
                                    ↓
                            Club Info
                            Upcoming Events
                            [Follow Club] [Contact Club]
```

**From Club Perspective:**

1. **See Registered Members:**
```
Club Events → Event Detail → View Participants
                                    ↓
                            Filter: [All] [Members] [Guests]
                            Member cards show member status
```

2. **Track Member Activity:**
```
Club Members → Select Member → Activity Tab
                                    ↓
                            Races participated
                            Training sessions logged
                            Events attended
```

**Visual Connection:**
- Club events show "🏛️ Club Event" badge
- Member sailors show "👤 Member" badge in participant lists
- Club profile accessible from race details

---

### Coach ↔ Club Connection

**From Coach Perspective:**

1. **Attend Club Event:**
```
Coach Profile → Available at Venues → Add Venue (Club)
                                            ↓
                                    Browse Club Events
                                    "Available for coaching at RHKYC"
```

**From Club Perspective:**

1. **Invite Coach:**
```
Club Events → Event Detail → [Invite Coaches]
                                    ↓
                            Browse coaches
                            Filter by specialties
                            Send invitation
```

2. **Recommended Coaches:**
```
Club Members → Member Detail → [Recommend Coach]
                                    ↓
                            Browse coaches
                            Send recommendation to member
```

**Visual Connection:**
- Coaches show venue affiliations
- Clubs can feature coaches
- "Find coaches at this event" link in race details

---

### Cross-Persona Value Proposition (SOLVES PROBLEM 20)

**Unified Ecosystem Features:**

1. **Shared Data:**
   - Sailor's race results visible to connected coach
   - Coach feedback visible in sailor's dashboard
   - Club events visible to all sailors in area

2. **Notifications:**
   - Sailor: "Emma registered for Winter Championship" (coach notified)
   - Coach: "Mike completed a race" (coach sees analysis prompt)
   - Club: "3 new registrations for Sunday race"

3. **Discovery:**
   - Sailors find coaches at races they attend
   - Coaches find clients at club events
   - Clubs reach sailors searching for races

4. **Badges & Tags:**
   ```
   🏛️ Official Club Event
   👨‍🏫 Coach Available
   🔗 Connected Coach
   👤 Club Member
   ⭐ Featured Event
   ```

---

## Deep Linking

### URL Scheme

```
regattaflow://[persona]/[section]/[id]?[params]

Examples:
regattaflow://sailor/races/12345
regattaflow://sailor/races/12345/register
regattaflow://coach/clients/67890
regattaflow://club/events/24680/control
```

### Universal Links

```
https://app.regattaflow.com/[persona]/[section]/[id]

Examples:
https://app.regattaflow.com/races/12345
https://app.regattaflow.com/coaches/sarah-chen
https://app.regattaflow.com/clubs/rhkyc
```

### Deep Link Handling

```typescript
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

function useDeepLinking() {
  const navigation = useNavigation();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const route = parseDeepLink(event.url);

      if (route) {
        navigation.navigate(route.screen, route.params);
      }
    };

    // Handle initial URL (app opened from link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Handle subsequent URLs (app already open)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => subscription.remove();
  }, [navigation]);
}

function parseDeepLink(url: string) {
  // regattaflow://sailor/races/12345
  const match = url.match(/regattaflow:\/\/(\w+)\/(\w+)\/(\w+)/);

  if (!match) return null;

  const [, persona, section, id] = match;

  const routeMap = {
    sailor: {
      races: { screen: 'RaceDetail', params: { raceId: id } },
      training: { screen: 'TrainingDetail', params: { sessionId: id } },
      analysis: { screen: 'AnalysisDetail', params: { analysisId: id } },
    },
    coach: {
      clients: { screen: 'ClientDetail', params: { clientId: id } },
      sessions: { screen: 'SessionDetail', params: { sessionId: id } },
    },
    club: {
      events: { screen: 'EventDetail', params: { eventId: id } },
      members: { screen: 'MemberDetail', params: { memberId: id } },
    },
  };

  return routeMap[persona]?[section];
}
```

### Shareable Links

```typescript
// Generate shareable link
function generateShareLink(type: string, id: string) {
  return `https://app.regattaflow.com/${type}/${id}`;
}

// Usage
const raceLink = generateShareLink('races', raceId);
const coachLink = generateShareLink('coaches', coachId);

// Share via native share sheet
Share.share({
  message: `Check out this race: ${raceLink}`,
  url: raceLink,
  title: 'Winter Championship',
});
```

---

## Navigation States

### Loading States

```typescript
function NavigationLoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={SailorColors.primary} />
      <Text>Loading...</Text>
    </View>
  );
}
```

### Error States

```typescript
function NavigationErrorState({ error, onRetry }) {
  return (
    <View style={styles.container}>
      <AlertCircle size={48} color={Semantic.error} />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Button title="Try Again" onPress={onRetry} />
    </View>
  );
}
```

### Empty States

Covered in SCREEN_DESIGNS.md - each screen has specific empty state.

### Offline State

```typescript
function OfflineBanner() {
  const isOffline = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <Animated.View
      style={styles.banner}
      entering={SlideInDown}
      exiting={SlideOutUp}
    >
      <WifiOff size={16} color={Neutrals.textInverse} />
      <Text style={styles.bannerText}>You're offline</Text>
    </Animated.View>
  );
}
```

---

## Implementation Guide

### React Navigation Setup

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Sailor App Structure
function SailorApp() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: Home,
            Races: Flag,
            Training: Activity,
            Analysis: BarChart,
            Profile: User,
          };
          const Icon = icons[route.name];
          return <Icon size={size} color={color} />;
        },
        tabBarActiveTintColor: SailorColors.primary,
        tabBarInactiveTintColor: Neutrals.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Races" component={RacesStack} />
      <Tab.Screen name="Training" component={TrainingStack} />
      <Tab.Screen name="Analysis" component={AnalysisStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// Stack for Dashboard tab
function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="RaceDetail" component={RaceDetailScreen} />
      <Stack.Screen name="CoachList" component={CoachListScreen} />
      <Stack.Screen name="CoachProfile" component={CoachProfileScreen} />
    </Stack.Navigator>
  );
}
```

### Navigation Hooks

```typescript
// Navigate to screen
const navigation = useNavigation();
navigation.navigate('RaceDetail', { raceId: '12345' });

// Go back
navigation.goBack();

// Get route params
const route = useRoute();
const { raceId } = route.params;

// Check if can go back
const canGoBack = navigation.canGoBack();

// Navigate and reset stack
navigation.reset({
  index: 0,
  routes: [{ name: 'Dashboard' }],
});

// Navigate to specific tab
navigation.navigate('Races', {
  screen: 'RaceDetail',
  params: { raceId: '12345' },
});
```

### Navigation Guards

```typescript
// Auth guard
function AuthGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

// Role guard
function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

// Usage
<AuthGuard>
  <RoleGuard allowedRoles={['coach', 'sailor']}>
    <CoachProfileScreen />
  </RoleGuard>
</AuthGuard>
```

### Navigation Analytics

```typescript
import analytics from '@react-native-firebase/analytics';

function useNavigationAnalytics() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', async () => {
      const currentScreen = navigationRef.getCurrentRoute()?.name;

      if (currentScreen) {
        await analytics().logScreenView({
          screen_name: currentScreen,
          screen_class: currentScreen,
        });
      }
    });

    return unsubscribe;
  }, [navigationRef]);
}
```

---

## Navigation Testing

### Unit Tests

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

it('navigates to race detail on card press', () => {
  const { getByText } = render(
    <NavigationContainer>
      <RaceListScreen />
    </NavigationContainer>
  );

  fireEvent.press(getByText('Winter Championship'));

  expect(mockNavigation.navigate).toHaveBeenCalledWith('RaceDetail', {
    raceId: '12345',
  });
});
```

### Integration Tests

```typescript
it('completes booking flow', async () => {
  const { getByText, getByRole } = render(<SailorApp />);

  // Navigate to coach list
  fireEvent.press(getByText('Find Coach'));

  // Select coach
  await waitFor(() => expect(getByText('Sarah Chen')).toBeTruthy());
  fireEvent.press(getByText('Sarah Chen'));

  // Book session
  fireEvent.press(getByText('Book Session'));

  // Select date
  fireEvent.press(getByText('Dec 22'));

  // Confirm
  fireEvent.press(getByRole('button', { name: 'Confirm Booking' }));

  // Verify confirmation
  await waitFor(() => expect(getByText('Booking Confirmed')).toBeTruthy());
});
```

---

## Navigation Checklist

Before launching, verify:

- [ ] All tabs accessible from bottom bar
- [ ] Back button works on all screens
- [ ] Deep links open correct screens
- [ ] Badges update in real-time
- [ ] Stack doesn't grow infinitely
- [ ] Modal dismissal works
- [ ] Hardware back button handled (Android)
- [ ] Gestures work (swipe back on iOS)
- [ ] Loading states shown during navigation
- [ ] Error states have retry/back options
- [ ] Offline banner appears when offline
- [ ] Navigation analytics tracking works
- [ ] Authentication guards in place
- [ ] Role-based access enforced
- [ ] Search/filter state preserved on back
- [ ] Form drafts saved on exit

---

## Conclusion

This navigation architecture ensures:

1. **Consistency**: Same patterns across all personas
2. **Efficiency**: Maximum 3 taps to any feature
3. **Clarity**: Always know where you are
4. **Connection**: Cross-persona flows are seamless
5. **Accessibility**: All features discoverable

The structure supports future growth while maintaining simplicity for current users.
