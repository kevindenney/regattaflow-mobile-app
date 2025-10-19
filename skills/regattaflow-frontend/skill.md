---
name: regattaflow-frontend
description: RegattaFlow React Native/Expo frontend development patterns, component conventions, and platform-specific implementations
trigger: Use when creating UI components, screens, navigation, or any frontend code in RegattaFlow
---

# RegattaFlow Frontend Development Skill

## Technology Stack

**Framework:** Expo SDK 54+ with React Native
**Universal App:** Single codebase for iOS, Android, and Web
**Routing:** Expo Router (file-based navigation)
**State Management:** Zustand for global state, useState for local
**Styling:** React Native StyleSheet API
**UI Library:** React Native Paper + custom components
**Icons:** Ionicons from @expo/vector-icons

## File Naming Conventions

### Component Files
- **Components:** PascalCase - `BoatCard.tsx`, `RaceList.tsx`
- **Screens:** kebab-case - `race-details.tsx`, `sailor-profile.tsx`
- **Platform-specific:** Add extension - `CourseMapView.web.tsx`, `CourseMapView.native.tsx`
- **Utilities:** camelCase - `formatDate.ts`, `calculateDistance.ts`
- **Types:** PascalCase - `Race.ts`, `Boat.ts`

### Directory Structure
```
src/
├── app/                    # Expo Router screens (kebab-case)
│   ├── (tabs)/            # Tab navigation group
│   ├── (auth)/            # Auth-protected group
│   └── _layout.tsx        # Root layout
├── components/            # React Native components (PascalCase)
│   ├── boats/
│   │   ├── BoatCard.tsx
│   │   ├── BoatForm.tsx
│   │   └── index.ts       # Barrel export
│   ├── races/
│   └── shared/
├── services/              # API and data services
├── hooks/                 # Custom hooks
├── providers/             # Context providers
└── types/                 # TypeScript definitions
```

## Import Order Convention

**CRITICAL:** Always follow this exact import order:

```typescript
// 1. React imports
import React from 'react';
import { useEffect, useState, useCallback } from 'react';

// 2. React Native imports
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// 3. Expo imports
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 4. Third-party libraries
import { useAuth } from '@clerk/clerk-expo';

// 5. Local imports - Services
import { raceService } from '@/src/services/RaceService';

// 6. Local imports - Components
import { BoatCard } from '@/src/components/boats/BoatCard';

// 7. Local imports - Hooks
import { useBoats } from '@/src/hooks/useBoats';

// 8. Local imports - Types
import type { Race, Boat } from '@/src/types';

// 9. Local imports - Utils
import { formatDate } from '@/src/lib/utils';
```

## Component Template Pattern

### Standard Component Structure

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * BoatCard - Displays boat information in a card format
 *
 * @param boat - Boat data object
 * @param onPress - Handler for card press
 * @param onSetDefault - Optional handler for setting default boat
 */
interface BoatCardProps {
  boat: {
    id: string;
    name: string;
    className: string;
    sailNumber?: string;
    isPrimary: boolean;
  };
  onPress: () => void;
  onSetDefault?: (boatId: string) => void;
}

export function BoatCard({ boat, onPress, onSetDefault }: BoatCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="boat" size={28} color="#3B82F6" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{boat.name}</Text>
          <Text style={styles.subtitle}>{boat.className}</Text>
        </View>
        {boat.isPrimary && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Default</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#EFF6FF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  badge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
});
```

### Key Conventions:
1. **Interface above component** with JSDoc documentation
2. **Export function** (not default export for components)
3. **StyleSheet.create** at bottom
4. **Semantic style names** matching JSX structure
5. **Destructured props** in function signature

## Screen Template Pattern

### Expo Router Screen Structure

```typescript
/**
 * Boats List Screen
 * Displays all boats for the current sailor
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { sailorBoatService, type SailorBoat } from '@/src/services/SailorBoatService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function BoatsScreen() {
  const { user } = useAuth();
  const [boats, setBoats] = useState<SailorBoat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBoats();
    }
  }, [user]);

  const loadBoats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const boatList = await sailorBoatService.listBoatsForSailor(user.id);
      setBoats(boatList);
    } catch (error) {
      console.error('Error loading boats:', error);
      setError('Failed to load boats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBoatPress = (boatId: string) => {
    router.push(`/(tabs)/boat/${boatId}`);
  };

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading boats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadBoats} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty State
  if (boats.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="boat-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No boats yet</Text>
          <Text style={styles.emptyText}>
            Add your first boat to start tracking equipment and maintenance.
          </Text>
          <TouchableOpacity onPress={() => {}} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Add Boat</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Success State
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Boats</Text>
        <TouchableOpacity onPress={() => {}} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {boats.map((boat) => (
          <TouchableOpacity
            key={boat.id}
            style={styles.boatCard}
            onPress={() => handleBoatPress(boat.id)}
          >
            <Text style={styles.boatName}>{boat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  boatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  boatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
});
```

### Screen Conventions:
1. **Default export** for screens (Expo Router requirement)
2. **SafeAreaView** container for proper spacing
3. **Four states:** Loading, Error, Empty, Success
4. **Consistent error handling** with try/catch
5. **Header + Content** structure

## Platform-Specific Patterns

### Universal Component (works everywhere)

```typescript
// BoatCard.tsx - Works on iOS, Android, and Web
import { View, Text } from 'react-native';

export function BoatCard() {
  return (
    <View>
      <Text>Universal Component</Text>
    </View>
  );
}
```

### Web-Specific Component

```typescript
// CourseMapView.web.tsx - Only loads on web
import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

const CourseMapView: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <MapPin color="#6B7280" size={48} />
      <Text style={{ color: '#64748B', marginTop: 16 }}>
        Course map view available on mobile app
      </Text>
    </View>
  );
};

export default CourseMapView;
```

### Native-Specific Component

```typescript
// CourseMapView.native.tsx - Only loads on iOS/Android
import React from 'react';
import MapView, { Marker } from 'react-native-maps';

const CourseMapView: React.FC = () => {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 22.279,
        longitude: 114.163,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
    >
      <Marker
        coordinate={{ latitude: 22.279, longitude: 114.163 }}
        title="Race Mark"
      />
    </MapView>
  );
};

export default CourseMapView;
```

### Platform Detection Pattern

```typescript
import { Platform } from 'react-native';

export function UniversalComponent() {
  if (Platform.OS === 'web') {
    return <WebSpecificFeature />;
  }

  return <NativeSpecificFeature />;
}
```

## Navigation Patterns (Expo Router)

### File-Based Routing

```
app/
├── (tabs)/                      # Tab navigation group
│   ├── _layout.tsx             # Tab bar configuration
│   ├── index.tsx               # /  (Home tab)
│   ├── races.tsx               # /races  (Races tab)
│   ├── boats.tsx               # /boats  (Boats tab)
│   └── race/
│       ├── [id].tsx            # /race/123  (Dynamic route)
│       └── edit/
│           └── [id].tsx        # /race/edit/123  (Nested dynamic)
├── (auth)/                      # Auth-required group
│   ├── _layout.tsx             # Auth wrapper
│   ├── profile.tsx             # /profile
│   └── settings.tsx            # /settings
└── _layout.tsx                 # Root layout
```

### Navigation Usage

```typescript
import { router, useLocalSearchParams } from 'expo-router';

// Programmatic navigation
router.push('/races');                    // Navigate to races
router.push('/race/123');                 // Navigate with ID
router.push({
  pathname: '/race/[id]',
  params: { id: '123' }
});
router.back();                            // Go back

// Get route parameters
export default function RaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <Text>Race ID: {id}</Text>;
}

// Passing complex data via params
router.push({
  pathname: '/race/edit/[id]',
  params: {
    id: race.id,
    name: race.name,
    date: race.date
  }
});
```

## State Management Patterns

### Local State (useState)

```typescript
export function BoatForm() {
  const [name, setName] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await saveBoat({ name, sailNumber });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput value={name} onChangeText={setName} />
      <TextInput value={sailNumber} onChangeText={setSailNumber} />
      <Button onPress={handleSubmit} disabled={loading} />
    </View>
  );
}
```

### Global State (Zustand)

```typescript
// stores/raceStore.ts
import { create } from 'zustand';

interface RaceStore {
  races: Race[];
  selectedRace: Race | null;
  setRaces: (races: Race[]) => void;
  selectRace: (race: Race) => void;
  clearSelection: () => void;
}

export const useRaceStore = create<RaceStore>((set) => ({
  races: [],
  selectedRace: null,
  setRaces: (races) => set({ races }),
  selectRace: (race) => set({ selectedRace: race }),
  clearSelection: () => set({ selectedRace: null }),
}));

// Usage in component
import { useRaceStore } from '@/src/stores/raceStore';

export function RaceList() {
  const { races, selectRace } = useRaceStore();

  return (
    <FlatList
      data={races}
      renderItem={({ item }) => (
        <RaceCard race={item} onPress={() => selectRace(item)} />
      )}
    />
  );
}
```

### Context Pattern

```typescript
// providers/AuthProvider.tsx
import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    // Implementation
  };

  const signOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Styling Guidelines

### Color Palette (Tailwind-inspired)

```typescript
const COLORS = {
  // Primary Blue
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },

  // Slate (Text & Backgrounds)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    500: '#64748B',
    600: '#475569',
    900: '#1E293B',
  },

  // Success Green
  green: {
    500: '#10B981',
    600: '#059669',
  },

  // Warning Yellow
  yellow: {
    500: '#F59E0B',
    600: '#D97706',
  },

  // Error Red
  red: {
    500: '#EF4444',
    600: '#DC2626',
  },
};
```

### Spacing System (8px grid)

```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

// Usage
const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,      // 16px
    marginBottom: SPACING.md,  // 12px
  },
});
```

### Typography System

```typescript
const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: '#475569',
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
};
```

### Shadow/Elevation

```typescript
const SHADOWS = {
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  md: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
};
```

## Data Fetching Patterns

### Service Integration

```typescript
import { raceService } from '@/src/services/RaceService';

export function RacesScreen() {
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRaces();
    }
  }, [user]);

  const loadRaces = async () => {
    try {
      setLoading(true);
      const data = await raceService.listRaces(user.id);
      setRaces(data);
    } catch (error) {
      console.error('Error loading races:', error);
    } finally {
      setLoading(false);
    }
  };

  // ...
}
```

### Optimistic Updates

```typescript
const handleSetDefault = async (boatId: string) => {
  // Optimistically update UI
  setBoats(prev =>
    prev.map(boat => ({
      ...boat,
      isPrimary: boat.id === boatId
    }))
  );

  try {
    await sailorBoatService.setPrimaryBoat(boatId);
  } catch (error) {
    // Revert on error
    await loadBoats();
    alert('Failed to set default boat');
  }
};
```

## Best Practices

### 1. TypeScript
- All components must have TypeScript interfaces
- Use `type` for simple types, `interface` for objects
- Export types alongside components

### 2. Error Handling
- Always use try/catch for async operations
- Log errors with console.error
- Show user-friendly error messages
- Provide retry functionality

### 3. Loading States
- Show ActivityIndicator during async operations
- Include descriptive text ("Loading boats...")
- Disable buttons during loading

### 4. Empty States
- Always provide empty state UI
- Include helpful icon (Ionicons)
- Add title + description + call-to-action

### 5. Accessibility
- Use `accessibilityLabel` for touchable elements
- Provide `accessibilityHint` for complex interactions
- Maintain minimum 44pt touch target size

### 6. Performance
- Use `React.memo()` for expensive components
- Implement `FlatList` for long lists (not ScrollView)
- Avoid inline functions in render methods

## Common Patterns Reference

### Protected Route

```typescript
import { Redirect } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';

export default function ProtectedScreen() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Redirect href="/login" />;

  return <ScreenContent />;
}
```

### List Rendering (FlatList)

```typescript
import { FlatList } from 'react-native';

export function RaceList({ races }: { races: Race[] }) {
  return (
    <FlatList
      data={races}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <RaceCard race={item} />}
      ListEmptyComponent={<EmptyState />}
      ListHeaderComponent={<Header />}
      refreshing={loading}
      onRefresh={loadRaces}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}
```

### Form Input

```typescript
import { TextInput } from 'react-native';

export function BoatForm() {
  const [name, setName] = useState('');

  return (
    <TextInput
      style={styles.input}
      placeholder="Boat Name"
      value={name}
      onChangeText={setName}
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
});
```

---

## When to Use This Skill

Use this skill when:
- Creating new UI components in RegattaFlow
- Implementing new screens or navigation flows
- Setting up state management (local or global)
- Building platform-specific features (web vs. native)
- Styling components to match design system
- Handling data fetching and loading states
- Implementing forms and user input

**Token Savings:** By following these established patterns, you avoid generating repetitive boilerplate code. Reference this skill instead of writing component structures, navigation logic, or styling systems from scratch.

**Estimated savings:** ~500-800 tokens per component/screen implementation
