# Comprehensive Race UX Redesign Plan

## Executive Summary
This document outlines a complete redesign of the race-related UI/UX in RegattaFlow, transforming it from a cramped, text-heavy interface into a beautiful, scannable, Apple Weather-like experience with:
- **Interactive map as hero element** on race detail pages
- **Consolidated race creation actions** (single FAB instead of two)
- **AI-first race entry** with progressive disclosure
- Card-based modules with visual data representation
- Generous white space and clear typography hierarchy

---

# Table of Contents

1. [Race Detail Page Redesign](#race-detail-page-redesign)
2. [Race Creation FAB Consolidation](#race-creation-fab-consolidation)
3. [Add Race Page Redesign](#add-race-page-redesign)
4. [Implementation Timeline](#implementation-timeline)
5. [Files to Create/Modify](#files-to-createmodify)

---

# Race Detail Page Redesign

## Current Issues
1. **Race cards at top**: Too cramped, hard to read, poor visual hierarchy
2. **Detail sections**: Plain text lists with no visual appeal
3. **Information density**: Too much text, not scannable
4. **No visual data**: Weather/conditions need graphics, not just text
5. **Repetitive elements**: Multiple "Select Course from Library" buttons
6. **Poor spacing**: Everything feels cramped
7. **No visual hierarchy**: Hard to understand what's important
8. **Map not prominent**: Map is arguably the most important element for race planning

## Design Transformation Goals
- **Interactive map as hero element**
- Clean, card-based modules
- Visual data representation
- Generous white space
- Clear typography hierarchy
- Scannable information
- Beautiful weather/condition displays

---

## Phase 1: Foundation (Design System & Base Components)
**Priority: CRITICAL - Do First**

### 1.1 Design System
Create `/constants/DesignSystem.ts`

```typescript
export const Typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },

  // Small
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Colors = {
  primary: '#2196F3',
  success: '#50C878',
  warning: '#FF9500',
  danger: '#FF6B6B',
  purple: '#9B59B6',

  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
  },

  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#E0E0E0',
  },

  border: {
    light: '#E0E0E0',
    medium: '#CCCCCC',
  },
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  round: 999,
};
```

### 1.2 Base UI Components
Create in `/components/ui/`:

#### Card.tsx
```typescript
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Shadows, BorderRadius } from '@/constants/DesignSystem';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card = ({ children, style }: CardProps) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    padding: 20,
    marginBottom: 16,
    ...Shadows.small,
  },
});
```

#### CardHeader.tsx
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing } from '@/constants/DesignSystem';

interface CardHeaderProps {
  icon: string;
  title: string;
  badge?: string;
  badgeColor?: string;
  iconColor?: string;
}

export const CardHeader = ({
  icon,
  title,
  badge,
  badgeColor,
  iconColor = '#2196F3'
}: CardHeaderProps) => (
  <View style={styles.header}>
    <View style={styles.titleRow}>
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
    </View>
    {badge && <Badge text={badge} color={badgeColor} />}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h3,
  },
});
```

#### Badge.tsx
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Typography, BorderRadius } from '@/constants/DesignSystem';

interface BadgeProps {
  text: string;
  color?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = ({ text, color, variant }: BadgeProps) => {
  const backgroundColor = color || getVariantColor(variant);

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
};

const getVariantColor = (variant?: string) => {
  switch (variant) {
    case 'success': return '#50C878';
    case 'warning': return '#FF9500';
    case 'danger': return '#FF6B6B';
    case 'info': return '#2196F3';
    default: return '#999999';
  }
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  badgeText: {
    ...Typography.captionBold,
    color: '#FFFFFF',
  },
});
```

#### Chip.tsx
```typescript
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, BorderRadius, Spacing } from '@/constants/DesignSystem';

interface ChipProps {
  text: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
}

export const Chip = ({ text, icon, color = '#2196F3', onPress }: ChipProps) => (
  <Pressable
    style={[styles.chip, { borderColor: color }]}
    onPress={onPress}
  >
    {icon && <Ionicons name={icon} size={16} color={color} />}
    <Text style={[styles.chipText, { color }]}>{text}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  chipText: {
    ...Typography.body,
  },
});
```

#### InfoGrid.tsx & InfoItem.tsx
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Colors } from '@/constants/DesignSystem';

interface InfoItemProps {
  label: string;
  value: string;
}

export const InfoItem = ({ label, value }: InfoItemProps) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

interface InfoGridProps {
  children: React.ReactNode;
}

export const InfoGrid = ({ children }: InfoGridProps) => (
  <View style={styles.infoGrid}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  infoItem: {
    width: '48%', // 2 columns
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.captionBold,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    ...Typography.bodyBold,
    color: Colors.text.primary,
  },
});
```

#### EmptyState.tsx
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Colors } from '@/constants/DesignSystem';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <View style={styles.container}>
    <Ionicons name={icon} size={48} color={Colors.text.tertiary} />
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    {action && <View style={styles.action}>{action}</View>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  action: {
    marginTop: Spacing.lg,
  },
});
```

---

## Phase 2: Race Area Map (Hero Element)
**Priority: CRITICAL - Most Important Visual**

### 2.1 RaceMapCard Component
Location: `/components/race-detail/RaceMapCard.tsx`

**Features:**
- Prominent placement (first card in detail section)
- Interactive map with satellite/hybrid view
- Expandable (300px default → 600px expanded)
- Map controls overlay (top-right corner)
- Layer toggles for wind, current, waves, depth
- Course overlay with marks and start line

**Layout Structure:**
```
┌─────────────────────────────────┐
│ 🗺️  Race Area Map         [⤢]  │
├─────────────────────────────────┤
│                                 │
│        INTERACTIVE MAP          │
│     (Course, Wind, Current)     │
│                                 │
│          [Controls]             │
│           Top-Right             │
│                                 │
├─────────────────────────────────┤
│ MAP LAYERS                      │
│ [Wind] [Current] [Waves] [Depth]│
│                                 │
│ TACTICAL                        │
│ [Laylines] [Strategy]           │
└─────────────────────────────────┘
```

**Implementation:**
```typescript
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { CardHeader } from '@/components/ui/CardHeader';

interface RaceMapCardProps {
  race: Race;
}

export const RaceMapCard = ({ race }: RaceMapCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapLayers, setMapLayers] = useState({
    wind: true,
    current: true,
    waves: false,
    depth: false,
    laylines: false,
    strategy: false,
  });

  const toggleLayer = (layer: string) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="map" size={24} color="#2196F3" />
          <Text style={styles.title}>Race Area Map</Text>
        </View>

        <Pressable onPress={() => setIsExpanded(!isExpanded)}>
          <Ionicons
            name={isExpanded ? "contract" : "expand"}
            size={20}
            color="#666"
          />
        </Pressable>
      </View>

      {/* Map View */}
      <View style={[
        styles.mapContainer,
        isExpanded && styles.mapContainerExpanded
      ]}>
        <MapView
          style={styles.map}
          initialRegion={race.mapRegion}
          mapType="hybrid"
        >
          {/* Course overlay */}
          {race.course && (
            <CourseOverlay course={race.course} />
          )}

          {/* Wind arrows */}
          {mapLayers.wind && (
            <WindOverlay conditions={race.windConditions} />
          )}

          {/* Current arrows */}
          {mapLayers.current && (
            <CurrentOverlay conditions={race.currentConditions} />
          )}
        </MapView>

        {/* Map controls */}
        <View style={styles.mapControls}>
          <MapControlButton
            icon="locate"
            onPress={centerOnVenue}
          />
          <MapControlButton
            icon="cube-outline"
            onPress={toggle3D}
          />
          <MapControlButton
            icon="layers"
            onPress={openLayersMenu}
          />
        </View>
      </View>

      {/* Layer Toggles */}
      <View style={styles.layerToggles}>
        <Text style={styles.layerLabel}>MAP LAYERS</Text>

        <View style={styles.toggleRow}>
          <LayerToggle
            icon="wind-outline"
            label="Wind"
            isActive={mapLayers.wind}
            onToggle={() => toggleLayer('wind')}
            color="#4A90E2"
          />
          <LayerToggle
            icon="water-outline"
            label="Current"
            isActive={mapLayers.current}
            onToggle={() => toggleLayer('current')}
            color="#50C878"
          />
          <LayerToggle
            icon="boat-outline"
            label="Waves"
            isActive={mapLayers.waves}
            onToggle={() => toggleLayer('waves')}
            color="#5DADE2"
          />
          <LayerToggle
            icon="swap-vertical-outline"
            label="Depth"
            isActive={mapLayers.depth}
            onToggle={() => toggleLayer('depth')}
            color="#8B4513"
          />
        </View>
      </View>

      {/* Tactical Layers */}
      <View style={styles.layerToggles}>
        <Text style={styles.layerLabel}>TACTICAL</Text>

        <View style={styles.toggleRow}>
          <LayerToggle
            icon="navigate-outline"
            label="Laylines"
            isActive={mapLayers.laylines}
            onToggle={() => toggleLayer('laylines')}
            color="#FF6B6B"
          />
          <LayerToggle
            icon="trending-up-outline"
            label="Strategy"
            isActive={mapLayers.strategy}
            onToggle={() => toggleLayer('strategy')}
            color="#9B59B6"
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 16,
    position: 'relative',
  },
  mapContainerExpanded: {
    height: 600,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  layerToggles: {
    marginTop: 16,
  },
  layerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
```

### 2.2 Map Overlay Components

#### CourseOverlay.tsx
```typescript
import { Polyline, Marker } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';

interface CourseOverlayProps {
  course: Course;
}

export const CourseOverlay = ({ course }: CourseOverlayProps) => (
  <>
    {/* Start line - GREEN */}
    <Polyline
      coordinates={course.startLine}
      strokeColor="#50C878"
      strokeWidth={3}
    />

    {/* Course marks - NUMBERED */}
    {course.marks.map((mark, index) => (
      <Marker
        key={`mark-${index}`}
        coordinate={mark.coordinate}
      >
        <View style={styles.courseMark}>
          <Text style={styles.courseMarkNumber}>{index + 1}</Text>
        </View>
      </Marker>
    ))}

    {/* Course path - RED DASHED */}
    <Polyline
      coordinates={course.path}
      strokeColor="#FF6B6B"
      strokeWidth={2}
      lineDashPattern={[10, 5]}
    />

    {/* Finish line */}
    {course.finishLine && (
      <Polyline
        coordinates={course.finishLine}
        strokeColor="#FFD700"
        strokeWidth={3}
      />
    )}
  </>
);

const styles = StyleSheet.create({
  courseMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseMarkNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
```

#### WindOverlay.tsx
```typescript
import { Marker } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';

interface WindOverlayProps {
  conditions: WindConditions;
}

export const WindOverlay = ({ conditions }: WindOverlayProps) => {
  const windArrows = generateWindArrowGrid(conditions);

  return (
    <>
      {windArrows.map((arrow, index) => (
        <Marker
          key={`wind-${index}`}
          coordinate={arrow.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <WindArrow
            direction={arrow.direction}
            speed={arrow.speed}
          />
        </Marker>
      ))}
    </>
  );
};

const WindArrow = ({ direction, speed }) => (
  <Svg width={30} height={30}>
    <Path
      d="M15,5 L15,20 M15,5 L10,10 M15,5 L20,10"
      stroke="#4A90E2"
      strokeWidth={2}
      strokeLinecap="round"
      transform={`rotate(${direction} 15 15)`}
      opacity={Math.min(speed / 20, 1)}
    />
  </Svg>
);
```

#### LayerToggle.tsx
```typescript
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LayerToggleProps {
  icon: string;
  label: string;
  isActive: boolean;
  onToggle: () => void;
  color: string;
}

export const LayerToggle = ({
  icon,
  label,
  isActive,
  onToggle,
  color
}: LayerToggleProps) => (
  <Pressable
    style={[
      styles.layerToggle,
      isActive && {
        backgroundColor: color + '20',
        borderColor: color
      }
    ]}
    onPress={onToggle}
  >
    <Ionicons
      name={icon}
      size={20}
      color={isActive ? color : '#999'}
    />
    <Text style={[
      styles.layerToggleText,
      isActive && { color }
    ]}>
      {label}
    </Text>
    {isActive && (
      <View style={[styles.activeIndicator, { backgroundColor: color }]} />
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  layerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    gap: 6,
    minWidth: 100,
  },
  layerToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 'auto',
  },
});
```

### 2.3 Map Priority Features

**Phase 1 (Must Have) - Week 1:**
- ✅ Display map with race area
- ✅ Show course marks and start line
- ✅ Toggle wind layer
- ✅ Toggle current layer
- ✅ Expand/collapse functionality
- ✅ Center on venue button

**Phase 2 (Nice to Have) - Week 3:**
- 3D view toggle
- Depth contours
- Wave overlay
- Map type selector (satellite/standard/hybrid)
- Fullscreen map modal

**Phase 3 (Advanced) - Future:**
- Laylines calculation overlay
- Tactical strategy zones
- Real-time GPS tracking during race
- Historical race tracks
- Animated wind/current over time

---

## Phase 3: Enhanced Race Cards (Top Section)
**Priority: HIGH - Visual Impact**

### 3.1 Enhanced RaceCard Component
Location: `/components/races/RaceCard.tsx`

**Features:**
- Fixed width (280px) for horizontal scroll
- Selected state with border highlight
- Prominent countdown timer
- Visual condition badges
- Clean layout with proper spacing

**Structure:**
```
┌─────────────────────────────┐
│ Race Name          [Badge]  │
│ 📍 Venue                    │
│                             │
│      STARTS IN              │
│   0 : 00 : 00              │
│  DAYS  HRS  MIN             │
│                             │
│ 🌬️ Variable 8-15kts        │
│ 🌊 slack 1m                 │
│                             │
│ 08:00 AM • 8/30/2025       │
└─────────────────────────────┘
```

**Implementation:**
```typescript
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from './CountdownTimer';
import { ConditionBadge } from './ConditionBadge';

interface RaceCardProps {
  race: Race;
  isSelected: boolean;
  onPress: () => void;
}

export const RaceCard = ({ race, isSelected, onPress }: RaceCardProps) => {
  return (
    <Pressable
      style={[
        styles.raceCard,
        isSelected && styles.raceCardSelected
      ]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.raceName} numberOfLines={2}>
          {race.name}
        </Text>
        <Badge
          text={race.status}
          variant={race.status === 'COMPLETED' ? 'success' : 'info'}
        />
      </View>

      {/* Venue */}
      <View style={styles.venueRow}>
        <Ionicons name="location-outline" size={14} color="#666" />
        <Text style={styles.venueText}>{race.venue}</Text>
      </View>

      {/* Countdown Timer */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>STARTS IN</Text>
        <CountdownTimer targetDate={race.startTime} />
      </View>

      {/* Conditions */}
      <View style={styles.conditionsRow}>
        {race.windConditions && (
          <ConditionBadge
            icon="wind-outline"
            label={race.windConditions.summary}
            color="#4A90E2"
          />
        )}
        {race.currentConditions && (
          <ConditionBadge
            icon="water-outline"
            label={race.currentConditions.summary}
            color="#50C878"
          />
        )}
      </View>

      {/* Date/Time */}
      <Text style={styles.dateTime}>
        {formatTime(race.startTime)} • {formatDate(race.startTime)}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  raceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  raceCardSelected: {
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#F0F8FF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  raceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  venueText: {
    fontSize: 14,
    color: '#666',
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dateTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
```

### 3.2 CountdownTimer Component
```typescript
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownTimerProps {
  targetDate: Date;
}

export const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <View style={styles.timerRow}>
      <TimeBlock value={timeLeft.days} label="DAYS" />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.hours} label="HRS" />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.minutes} label="MIN" />
    </View>
  );
};

const TimeBlock = ({ value, label }) => (
  <View style={styles.timeBlock}>
    <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.timeLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  timeLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#999',
    marginTop: -12,
  },
});
```

---

## Phase 4: Visual Data Cards (Weather & Tide)
**Priority: CRITICAL - Important Visual Impact**

### 4.1 WeatherCard Component
```typescript
import { Card } from '@/components/ui/Card';
import { CardHeader } from '@/components/ui/CardHeader';
import { WindCompass } from './weather/WindCompass';
import { WindDisplay } from './weather/WindDisplay';
import { HourlyForecast } from './weather/HourlyForecast';

export const WeatherCard = ({ race }) => (
  <Card>
    <CardHeader
      icon="partly-sunny-outline"
      title="Wind & Weather"
      badge="LIVE DATA"
      badgeColor="#50C878"
    />

    {/* Current conditions */}
    <View style={styles.currentConditions}>
      <WindDisplay
        speed={race.windConditions.speed}
        direction={race.windConditions.direction}
        gusts={race.windConditions.gusts}
        beaufortScale={race.windConditions.beaufortScale}
      />
    </View>

    {/* Hourly forecast */}
    <View style={styles.forecastSection}>
      <Text style={styles.sectionLabel}>RACE TIME FORECAST</Text>
      <HourlyForecast data={race.forecast} />
    </View>
  </Card>
);
```

### 4.2 TideCard Component
```typescript
import { Card } from '@/components/ui/Card';
import { CardHeader } from '@/components/ui/CardHeader';
import { CurrentDisplay } from './tide/CurrentDisplay';
import { TideInfoCard } from './tide/TideInfoCard';

export const TideCard = ({ race }) => (
  <Card>
    <CardHeader
      icon="water-outline"
      title="Current & Tide"
      badge="LIVE DATA"
      badgeColor="#50C878"
    />

    {/* Current display */}
    <CurrentDisplay
      speed={race.currentConditions.speed}
      direction={race.currentConditions.direction}
      strength={race.currentConditions.strength}
    />

    {/* Tide times */}
    <View style={styles.tideTimesRow}>
      <TideInfoCard
        type="high"
        time={race.tideData.highTide}
        height="3.3m"
      />
      <TideInfoCard
        type="low"
        time={race.tideData.lowTide}
        height="0.4m"
      />
      <TideInfoCard
        type="range"
        value="4.9m"
      />
    </View>
  </Card>
);
```

---

## Phase 5: Additional Content Cards

### 5.1 RaceOverviewCard
```typescript
export const RaceOverviewCard = ({ race }) => (
  <Card>
    <CardHeader icon="information-circle" title="Race Information" />

    <InfoGrid>
      <InfoItem label="Race Name" value={race.name} />
      <InfoItem label="Start Date" value={formatDate(race.startDate)} />
      <InfoItem label="Start Time" value={formatTime(race.startTime)} />
      <InfoItem label="Duration" value={race.duration} />
      <InfoItem label="Class" value={race.boatClass} />
      <InfoItem label="Description" value={race.description} />
    </InfoGrid>
  </Card>
);
```

### 5.2 TimingCard
```typescript
export const TimingCard = ({ race }) => (
  <Card>
    <CardHeader
      icon="timer-outline"
      title="Timing & Start Sequence"
      iconColor="#FF9500"
    />

    {/* Visual timeline */}
    <Timeline>
      <TimelineItem
        time="08:00"
        label="Warning Signal"
        type="warning"
      />
      <TimelineItem
        time="08:04"
        label="Prep Signal"
        type="prep"
      />
      <TimelineItem
        time="08:05"
        label="Start"
        type="start"
        isHighlighted
      />
    </Timeline>

    {/* Signal chips */}
    <View style={styles.signalChips}>
      <Chip text="Flag U" color="#4A90E2" />
      <Chip text="Black Flag" color="#333" />
      <Chip text="3 min start" color="#50C878" />
    </View>
  </Card>
);
```

### 5.3 CourseCard
```typescript
export const CourseCard = ({ race, onSelectCourse }) => (
  <Card>
    <CardHeader icon="map-outline" title="Course & Start Area" />

    {race.course ? (
      <View style={styles.selectedCourse}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{race.course.name}</Text>
          <Text style={styles.courseDescription}>{race.course.description}</Text>
        </View>
        <Button variant="outline" size="small" onPress={onSelectCourse}>
          Change Course
        </Button>
      </View>
    ) : (
      <EmptyState
        icon="map-outline"
        title="No course selected"
        description="Select a course from your library"
        action={
          <Button onPress={onSelectCourse}>
            Select Course from Library
          </Button>
        }
      />
    )}

    {race.course && (
      <InfoGrid>
        <InfoItem label="Start Boat Name" value={race.startBoatName} />
        <InfoItem label="Start Boat Position" value={race.startPosition} />
        <InfoItem label="Pin End Length" value={race.pinLength} />
        <InfoItem label="Boat-to-Boat Spacing" value={race.spacing} />
      </InfoGrid>
    )}
  </Card>
);
```

### 5.4 CommunicationsCard
```typescript
export const CommunicationsCard = ({ race }) => (
  <Card>
    <CardHeader icon="radio-outline" title="Communications & Contact" />

    {/* Contact chips */}
    <View style={styles.contactsRow}>
      {race.contacts.map(contact => (
        <ContactChip
          key={contact.id}
          name={contact.name}
          role={contact.role}
          onPress={() => callContact(contact)}
        />
      ))}
    </View>

    {/* VHF channels */}
    <View style={styles.channelsSection}>
      <Text style={styles.sectionLabel}>VHF CHANNELS</Text>
      <View style={styles.channelChips}>
        <Chip text={`Ch ${race.vhfChannel}`} icon="radio" color="#2196F3" />
        {race.workingChannel && (
          <Chip text={`Ch ${race.workingChannel}`} color="#666" />
        )}
      </View>
    </View>
  </Card>
);
```

---

## Phase 6: Main Layout Integration

### 6.1 Updated Race Detail Page Layout
```typescript
// app/(tabs)/races.tsx

export default function RaceDetailScreen() {
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const selectedRace = races.find(r => r.id === selectedRaceId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{selectedRace?.name}</Text>
        <MenuButton />
      </View>

      {/* Horizontal race cards - fixed height */}
      <View style={styles.racesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {races.map(race => (
            <RaceCard
              key={race.id}
              race={race}
              isSelected={race.id === selectedRaceId}
              onPress={() => setSelectedRaceId(race.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Detail content - scrollable */}
      <ScrollView style={styles.detailContent}>
        {/* 🗺️ MAP CARD - FIRST & PROMINENT */}
        <RaceMapCard race={selectedRace} />

        {/* Other cards */}
        <RaceOverviewCard race={selectedRace} />
        <TimingCard race={selectedRace} />
        <WeatherCard race={selectedRace} />
        <TideCard race={selectedRace} />
        <CourseCard race={selectedRace} />
        <CommunicationsCard race={selectedRace} />
        <BoatsCard race={selectedRace} />
        <TacticalStrategyCard race={selectedRace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  racesBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
});
```

---

# Race Creation FAB Consolidation

## Current Issues
1. **Two FABs**: Purple calendar button + Blue plus button
2. **Cluttered**: Visually overwhelming
3. **Unclear**: Not immediately obvious which to use
4. **Same goal**: Both add races, just different methods

## Solution: Single FAB with Action Sheet

### Replace Both FABs
Remove:
- Purple calendar FAB (Import Race Calendar)
- Blue plus FAB (Add Race)

Add:
- Single blue FAB with "+" icon
- Opens action sheet with 3 clear options

### Implementation

#### 1. Single FAB Button
```typescript
// app/(authenticated)/races/index.tsx

<FAB
  icon="add"
  onPress={() => setShowAddMenu(true)}
  style={styles.primaryFAB}
/>
```

#### 2. AddRaceBottomSheet Component
Create `/components/races/AddRaceBottomSheet.tsx`:

```typescript
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddRaceBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (optionId: string) => void;
}

export const AddRaceBottomSheet = ({ visible, onClose, onSelect }: AddRaceBottomSheetProps) => {
  const options = [
    {
      id: 'ai-quick',
      icon: 'sparkles',
      title: 'Quick Add with AI',
      description: 'Paste race details or upload a PDF - AI will extract info',
      color: '#9B59B6',
    },
    {
      id: 'manual',
      icon: 'create-outline',
      title: 'Add Manually',
      description: 'Fill out race details yourself',
      color: '#2196F3',
    },
    {
      id: 'import-csv',
      icon: 'calendar-outline',
      title: 'Import Calendar (CSV)',
      description: 'Bulk upload multiple races from a CSV file',
      color: '#50C878',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Add Races</Text>
          <Text style={styles.subtitle}>Choose how you'd like to add races</Text>

          {options.map((option) => (
            <Pressable
              key={option.id}
              style={styles.option}
              onPress={() => {
                onSelect(option.id);
                onClose();
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>

              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          ))}

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
```

#### 3. Update Races Screen
```typescript
// app/(authenticated)/races/index.tsx

import { AddRaceBottomSheet } from '@/components/races/AddRaceBottomSheet';

export default function RacesScreen() {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const router = useRouter();

  const handleAddRaceSelect = (optionId: string) => {
    switch (optionId) {
      case 'ai-quick':
        router.push('/race/comprehensive-add');
        break;
      case 'manual':
        router.push('/race/add-manual');
        break;
      case 'import-csv':
        router.push('/import-calendar');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Race content */}

      {/* SINGLE FAB */}
      <FAB
        icon="add"
        onPress={() => setShowAddMenu(true)}
      />

      {/* Add Race Menu */}
      <AddRaceBottomSheet
        visible={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onSelect={handleAddRaceSelect}
      />
    </View>
  );
}
```

---

# Add Race Page Redesign

## Current Problems
1. **Purple info box**: Too wordy, users won't read
2. **Upload area**: Too plain, not interactive
3. **Text input**: Huge but empty, intimidating
4. **Manual form**: Overwhelming (9+ collapsible sections)
5. **No visual hierarchy**: Everything feels equally important
6. **Unclear flow**: What happens after upload?

## Solution: Progressive Disclosure

### Design Strategy
1. **Simple entry point**: Inviting upload area
2. **AI processes**: Show beautiful progress
3. **Review results**: User confirms or edits
4. **Manual fallback**: Clean form if needed

---

## Phase 1: Hero Section (AI Quick Entry)

### Implementation
```typescript
// app/race/comprehensive-add.tsx

export default function AddRaceScreen() {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'text'>('upload');
  const [hasContent, setHasContent] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Add Race</Text>
        <MenuButton />
      </View>

      <ScrollView style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={40} color="#9B59B6" />
          </View>

          <Text style={styles.heroTitle}>Quick Add with AI</Text>
          <Text style={styles.heroDescription}>
            Paste race details, upload a PDF, or enter text. We'll extract all the info automatically.
          </Text>

          {/* Tab selector */}
          <View style={styles.inputTabs}>
            <TabButton
              icon="document-text-outline"
              label="Upload PDF"
              isActive={activeTab === 'upload'}
              onPress={() => setActiveTab('upload')}
            />
            <TabButton
              icon="link-outline"
              label="Paste URL"
              isActive={activeTab === 'url'}
              onPress={() => setActiveTab('url')}
            />
            <TabButton
              icon="create-outline"
              label="Enter Text"
              isActive={activeTab === 'text'}
              onPress={() => setActiveTab('text')}
            />
          </View>

          {/* Input area */}
          {activeTab === 'upload' && <UploadArea onFileSelect={setHasContent} />}
          {activeTab === 'url' && <URLInput onURLEnter={setHasContent} />}
          {activeTab === 'text' && <TextInput onTextEnter={setHasContent} />}

          {/* Extract button */}
          {hasContent && (
            <Button
              onPress={extractWithAI}
              size="large"
              icon="sparkles"
              loading={isExtracting}
            >
              Extract & Auto-Fill
            </Button>
          )}
        </View>

        {/* Divider */}
        <Divider text="OR FILL MANUALLY" />

        {/* Manual form */}
        <ManualRaceForm />
      </ScrollView>
    </View>
  );
}
```

---

## Phase 2: Upload Area Component

### UploadArea.tsx
```typescript
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export const UploadArea = ({ onFileSelect }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const selectFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: true,
    });

    if (result.type === 'success') {
      setUploadedFiles(prev => [...prev, result]);
      onFileSelect(true);
    }
  };

  return (
    <View style={styles.uploadArea}>
      {uploadedFiles.length === 0 ? (
        <Pressable
          style={[
            styles.uploadZone,
            isDragging && styles.uploadZoneDragging
          ]}
          onPress={selectFiles}
        >
          <Ionicons name="cloud-upload-outline" size={48} color="#9B59B6" />
          <Text style={styles.uploadTitle}>
            Drop PDFs here or click to browse
          </Text>
          <Text style={styles.uploadHint}>
            Supports: PDF, JPG, PNG • Max 10MB
          </Text>
          <Button variant="outline" onPress={selectFiles}>
            Select Files
          </Button>
        </Pressable>
      ) : (
        <View style={styles.filesPreview}>
          {uploadedFiles.map((file, index) => (
            <FilePreviewCard
              key={index}
              file={file}
              onRemove={() => {
                setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                if (uploadedFiles.length === 1) onFileSelect(false);
              }}
            />
          ))}
          <Button variant="outline" size="small" onPress={selectFiles}>
            Add More Files
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    minHeight: 200,
  },
  uploadZoneDragging: {
    borderColor: '#9B59B6',
    backgroundColor: '#F3E5F5',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  filesPreview: {
    gap: 12,
  },
});
```

---

## Phase 3: Text Input Component

### TextInput.tsx
```typescript
import { useState } from 'react';
import { View, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { SmartHint } from './SmartHint';

export const TextInput = ({ onTextEnter }) => {
  const [text, setText] = useState('');
  const [detectedInfo, setDetectedInfo] = useState({
    hasName: false,
    hasDate: false,
    hasVenue: false,
  });

  const handleTextChange = (value: string) => {
    setText(value);
    onTextEnter(value.length > 0);

    // Detect information in real-time
    setDetectedInfo({
      hasName: /race|regatta|championship/i.test(value),
      hasDate: /\d{1,2}\/\d{1,2}\/\d{2,4}/i.test(value),
      hasVenue: /harbour|bay|port/i.test(value),
    });
  };

  return (
    <View style={styles.textInputArea}>
      <RNTextInput
        style={styles.textField}
        multiline
        numberOfLines={8}
        placeholder={`Paste race details here...

Example:
Croucher Series Race 3 at Victoria Harbour
Nov 17 2025, 2 starts
Dragon 10:00, J/70 10:05
VHF 72, PRO: John Smith
720° penalty system...`}
        value={text}
        onChangeText={handleTextChange}
        placeholderTextColor="#999"
      />

      {/* Smart hints */}
      {text.length > 0 && (
        <View style={styles.hints}>
          {detectedInfo.hasName && detectedInfo.hasDate && detectedInfo.hasVenue && (
            <SmartHint
              icon="checkmark-circle"
              text="Detected: Race name, date, location"
              color="#50C878"
            />
          )}
          {!detectedInfo.hasVenue && (
            <SmartHint
              icon="alert-circle"
              text="Tip: Include venue/location for better results"
              color="#FF9500"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textInputArea: {
    width: '100%',
  },
  textField: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  hints: {
    marginTop: 12,
    gap: 8,
  },
});
```

---

## Phase 4: AI Extraction Progress

### ExtractionProgress.tsx
```typescript
import { Modal, View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export const ExtractionProgress = ({ visible }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.progressOverlay}>
      <View style={styles.progressCard}>
        <LottieView
          source={require('@/assets/animations/ai-processing.json')}
          autoPlay
          loop
          style={styles.animation}
        />

        <Text style={styles.progressTitle}>Analyzing race details...</Text>

        <View style={styles.progressSteps}>
          <ProgressStep label="Extracting text" status="complete" />
          <ProgressStep label="Identifying race details" status="active" />
          <ProgressStep label="Finding venue" status="pending" />
          <ProgressStep label="Detecting course marks" status="pending" />
        </View>
      </View>
    </View>
  </Modal>
);

const ProgressStep = ({ label, status }) => (
  <View style={styles.progressStep}>
    <View style={[
      styles.stepIndicator,
      status === 'complete' && styles.stepComplete,
      status === 'active' && styles.stepActive,
    ]}>
      {status === 'complete' && <Ionicons name="checkmark" size={12} color="#FFF" />}
      {status === 'active' && <ActivityIndicator size="small" color="#FFF" />}
    </View>
    <Text style={styles.stepLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  animation: {
    width: 120,
    height: 120,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 24,
  },
  progressSteps: {
    width: '100%',
    gap: 12,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepComplete: {
    backgroundColor: '#50C878',
  },
  stepActive: {
    backgroundColor: '#2196F3',
  },
  stepLabel: {
    fontSize: 14,
    color: '#666',
  },
});
```

---

## Phase 5: Extraction Results

### ExtractionResults.tsx
```typescript
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const ExtractionResults = ({ results, onConfirm, onEdit }) => (
  <Card style={styles.resultsCard}>
    <View style={styles.resultsHeader}>
      <Ionicons name="checkmark-circle" size={32} color="#50C878" />
      <View style={styles.resultsHeaderText}>
        <Text style={styles.resultsTitle}>Extracted Successfully</Text>
        <Text style={styles.resultsSubtitle}>
          Found {results.fieldsExtracted} fields
        </Text>
      </View>
    </View>

    {/* Extracted fields */}
    <View style={styles.extractedFields}>
      <ExtractedField
        label="Race Name"
        value={results.name}
        confidence="high"
      />
      <ExtractedField
        label="Date"
        value={results.date}
        confidence="high"
      />
      <ExtractedField
        label="Location"
        value={results.location}
        confidence="medium"
      />
      <ExtractedField
        label="Start Time"
        value={results.startTime}
        confidence="high"
      />
    </View>

    {/* Missing fields */}
    {results.missingFields.length > 0 && (
      <InfoBanner
        type="info"
        icon="information-circle"
        message={`We couldn't find: ${results.missingFields.join(', ')}. You can add these manually.`}
      />
    )}

    {/* Actions */}
    <View style={styles.resultsActions}>
      <Button variant="outline" onPress={onEdit}>
        Review & Edit
      </Button>
      <Button onPress={onConfirm}>
        Looks Good - Create Race
      </Button>
    </View>
  </Card>
);

const ExtractedField = ({ label, value, confidence }) => (
  <View style={styles.extractedField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldValueRow}>
      <Text style={styles.fieldValue}>{value}</Text>
      <Badge
        text={confidence}
        variant={confidence === 'high' ? 'success' : 'warning'}
      />
    </View>
  </View>
);
```

---

## Phase 6: Improved Manual Form

### ManualRaceForm.tsx
```typescript
export const ManualRaceForm = ({ prefillData = {} }) => {
  const [formData, setFormData] = useState(prefillData);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  return (
    <View style={styles.formContainer}>
      {/* Core info - always visible */}
      <Card>
        <CardHeader icon="information-circle" title="Basic Information" />

        <FormField
          label="Race Name"
          placeholder="Hong Kong Dragon Championship 2025"
          value={formData.name}
          onChange={(value) => updateField('name', value)}
          required
        />

        <FormField
          label="Date"
          type="date"
          value={formData.date}
          onChange={(value) => updateField('date', value)}
          required
        />

        <FormField
          label="Location"
          placeholder="Victoria Harbour, Hong Kong"
          icon="location-outline"
          value={formData.location}
          onChange={(value) => updateField('location', value)}
        />

        <Button
          variant="link"
          icon="map-outline"
          onPress={openMapPicker}
        >
          Show Map & Define Racing Area
        </Button>
      </Card>

      {/* Boat selection */}
      <Card>
        <CardHeader icon="boat" title="Your Boat" />

        {formData.selectedBoat ? (
          <SelectedBoatCard
            boat={formData.selectedBoat}
            onRemove={() => setSelectedBoat(null)}
          />
        ) : (
          <EmptyState
            icon="boat-outline"
            title="No boat selected"
            action={
              <Button onPress={openBoatSelector}>
                Select Boat
              </Button>
            }
          />
        )}
      </Card>

      {/* Optional sections */}
      <AddOptionalSection
        availableSections={[
          { id: 'timing', icon: 'time', label: 'Timing & Start Sequence' },
          { id: 'comms', icon: 'radio', label: 'Communications & VHF' },
          { id: 'course', icon: 'map', label: 'Course Details' },
          { id: 'rules', icon: 'document', label: 'Rules & Penalties' },
          { id: 'weather', icon: 'partly-sunny', label: 'Weather Conditions' },
          { id: 'strategy', icon: 'analytics', label: 'Tactical Strategy' },
        ]}
        onAdd={(sectionId) => addSection(sectionId)}
      />

      {/* Actions */}
      <View style={styles.formActions}>
        <Button variant="outline" onPress={cancel}>
          Cancel
        </Button>
        <Button onPress={createRace} disabled={!isValid}>
          Create Race
        </Button>
      </View>
    </View>
  );
};
```

---

# Implementation Timeline

## Week 1: Foundation & Map
- ✅ Day 1-2: Design System (`DesignSystem.ts`)
- ✅ Day 2-3: Base Components (Card, CardHeader, Badge, Chip, InfoGrid, EmptyState)
- ✅ Day 4-5: **RaceMapCard** (hero element)
- ✅ Day 5: Map overlay components (Course, Wind, Current)
- ✅ Day 5: Layer toggles

## Week 2: Race Cards & FAB
- ✅ Day 1-2: Enhanced RaceCard component
- ✅ Day 2: Countdown timer components
- ✅ Day 3: Condition badges
- ✅ Day 3: Horizontal scroll layout
- ✅ Day 4-5: FAB consolidation (AddRaceBottomSheet)

## Week 3: Visual Data Cards
- ✅ Day 1-2: WindCompass & WindDisplay
- ✅ Day 2-3: Weather Card complete
- ✅ Day 3-4: Current & Tide visual components
- ✅ Day 4-5: Tide Card complete

## Week 4: Add Race Page & Remaining Cards
- ✅ Day 1-2: Add Race page redesign (hero section, tabs, upload)
- ✅ Day 2-3: AI extraction progress & results
- ✅ Day 3-4: Overview, Timing, Course, Communications Cards
- ✅ Day 4-5: Boats & Tactical Cards

## Week 5: Integration & Polish
- ✅ Day 1-2: Integrate all cards into main layout
- ✅ Day 2-3: Test and refine spacing
- ✅ Day 3-4: Add animations
- ✅ Day 4-5: Performance optimization

---

# Files to Create/Modify

## New Components

### Design System
```
/constants/
  - DesignSystem.ts ⭐
```

### Base UI Components
```
/components/ui/
  - Card.tsx
  - CardHeader.tsx
  - Badge.tsx
  - Chip.tsx
  - InfoGrid.tsx
  - InfoItem.tsx
  - EmptyState.tsx
  - Button.tsx (enhance existing)
  - Divider.tsx
```

### Race Detail Components
```
/components/race-detail/
  - RaceCard.tsx (enhanced)
  - RaceMapCard.tsx ⭐ (HERO)
  - RaceOverviewCard.tsx
  - TimingCard.tsx
  - WeatherCard.tsx
  - TideCard.tsx
  - CourseCard.tsx
  - CommunicationsCard.tsx
  - BoatsCard.tsx
  - TacticalStrategyCard.tsx
```

### Map Components
```
/components/race-detail/map/
  - MapControls.tsx
  - MapControlButton.tsx
  - LayerToggle.tsx
  - CourseOverlay.tsx
  - WindOverlay.tsx
  - CurrentOverlay.tsx
  - WindArrow.tsx
  - CurrentArrow.tsx
  - CourseMark.tsx
```

### Weather Components
```
/components/race-detail/weather/
  - WindCompass.tsx
  - WindDisplay.tsx
  - ForecastItem.tsx
  - HourlyForecast.tsx
```

### Tide Components
```
/components/race-detail/tide/
  - CurrentDisplay.tsx
  - CurrentArrow.tsx
  - TideInfoCard.tsx
```

### Timing Components
```
/components/race-detail/timing/
  - TimeBlock.tsx
  - CountdownTimer.tsx
  - Timeline.tsx
  - TimelineItem.tsx
  - ConditionBadge.tsx
```

### Add Race Components
```
/components/race-add/
  - AddRaceBottomSheet.tsx
  - UploadArea.tsx
  - URLInput.tsx
  - TextInput.tsx
  - SmartHint.tsx
  - ExtractionProgress.tsx
  - ExtractionResults.tsx
  - ManualRaceForm.tsx
  - FormField.tsx
  - AddOptionalSection.tsx
  - FilePreviewCard.tsx
  - TabButton.tsx
```

## Files to Update
```
/app/(tabs)/races.tsx
  - Update layout structure
  - Integrate new cards
  - Remove old UI code

/app/(authenticated)/races/index.tsx
  - Replace two FABs with single FAB
  - Add AddRaceBottomSheet

/app/race/comprehensive-add.tsx
  - Complete redesign with hero section
  - Add tab-based input
  - Add AI extraction flow
```

---

# Success Metrics

## Before vs After

### Race Detail Page
- **Information density**: Less text, more visual
- **Scannability**: Can find info in < 5 seconds
- **Visual appeal**: Modern, professional appearance
- **Map usage**: Primary navigation tool for race planning
- **User satisfaction**: Positive feedback on clarity
- **Time to key info**: Reduced by 50%

### FAB Consolidation
- **Visual clutter**: Reduced from 2 buttons to 1
- **User clarity**: Clear options with descriptions
- **Discoverability**: All add methods visible in one place

### Add Race Page
- **Completion rate**: Increased due to AI extraction
- **Time to add race**: Reduced from 5 min to 30 sec (with AI)
- **Form abandonment**: Reduced by progressive disclosure
- **User satisfaction**: "Much easier" feedback

## Key Improvements
1. ✅ **Map is hero element** - immediately visible and interactive
2. ✅ Wind/weather immediately visible with graphics
3. ✅ Countdown timer prominent and clear
4. ✅ Single FAB with clear options
5. ✅ AI-first race entry with beautiful UX
6. ✅ No duplicate buttons
7. ✅ Generous white space
8. ✅ Clear visual hierarchy
9. ✅ Professional, polished appearance

---

# Notes & Considerations

## Design Philosophy
- **Map-first approach**: The map is the hero - make it beautiful and functional
- **Apple Weather approach**: Large, visual displays for key data
- **Scannable**: User can glance and understand immediately
- **Progressive disclosure**: Most important info first, details on demand
- **Consistent patterns**: Reuse components, maintain consistency
- **AI-first**: Make AI extraction the primary path, manual as fallback

## Technical Considerations
- Use React.memo for performance (especially map)
- Keep components small and focused
- Leverage existing hooks (useRaceDetail, useWeather, etc.)
- Ensure TypeScript types are correct
- Test on iOS and Android
- Optimize map rendering (limit overlay complexity)
- Test AI extraction with various inputs

## Future Enhancements
- Pull-to-refresh for live data
- Swipe gestures on race cards
- Animated transitions between cards
- Interactive weather graphs
- Real-time wind/current updates on map
- GPS tracking overlay
- Dark mode support
- Haptic feedback on interactions
- Offline map caching
- Voice input for race details
- Google Calendar / iCal import

---

# Ready to Implement!

This comprehensive plan transforms the RegattaFlow race experience into a beautiful, functional, professional interface that sailors will love.

**Start with:**
1. Phase 1: Design System & Base Components
2. Phase 2: Race Map Card (hero element)
3. FAB Consolidation (quick win)
4. Add Race Page redesign
5. Weather & Tide visual cards
6. Then work through remaining phases

**The result:**
A modern, Apple Weather-like experience with:
- Interactive maps
- Visual data displays
- AI-powered race entry
- Clean, scannable layouts
- Professional appearance
- Delightful interactions
