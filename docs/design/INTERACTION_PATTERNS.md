# RegattaFlow Interaction Patterns

## Table of Contents
1. [Animation Principles](#animation-principles)
2. [Screen Transitions](#screen-transitions)
3. [Micro-Interactions](#micro-interactions)
4. [Gesture Interactions](#gesture-interactions)
5. [Loading States](#loading-states)
6. [Haptic Feedback](#haptic-feedback)
7. [Real-Time Updates](#real-time-updates)
8. [Map Interactions](#map-interactions)
9. [Form Interactions](#form-interactions)
10. [Implementation Guide](#implementation-guide)

---

## Animation Principles

### Core Principles

1. **Purpose-Driven**: Every animation serves a purpose (feedback, guidance, or delight)
2. **Performance-First**: Target 60fps, gracefully degrade on older devices
3. **Respectful**: Honor user's motion preferences (prefers-reduced-motion)
4. **Contextual**: Animations match the interaction (fast taps = quick animations)
5. **Natural**: Follow physics-based motion (spring animations, not linear)

### Animation Values

From Design System:

```typescript
export const AnimationDurations = {
  instant: 100,      // Micro-interactions (button press)
  fast: 200,         // UI feedback (toast, checkbox)
  normal: 300,       // Standard transitions (screen changes)
  slow: 500,         // Emphasis (success states)
  lazy: 800,         // Dramatic (onboarding)
};

export const AnimationEasing = {
  // Spring-based (React Native Reanimated)
  default: { damping: 15, stiffness: 150 },
  bouncy: { damping: 10, stiffness: 100 },
  stiff: { damping: 20, stiffness: 300 },

  // Timing-based (fallback)
  easeInOut: [0.42, 0, 0.58, 1],
  easeOut: [0, 0, 0.58, 1],
  easeIn: [0.42, 0, 1, 1],
};
```

### Performance Budget

- **Critical Path**: <16ms (60fps)
- **Layout Animations**: <100ms
- **Screen Transitions**: <300ms
- **Loading Indicators**: Appear after 200ms delay

---

## Screen Transitions

### Stack Navigation (Push/Pop)

**Pattern**: Slide from right (iOS) / Fade + slight slide (Android)

```typescript
// React Navigation configuration
const screenOptions = {
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 150,
        damping: 20,
        mass: 1,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 150,
        damping: 20,
        mass: 1,
      },
    },
  },
};
```

**Usage:**
- Race List → Race Details
- Dashboard → Training Log
- Client List → Client Detail

**Timing**: 300ms

---

### Tab Navigation

**Pattern**: Cross-fade + slight scale

```typescript
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue
} from 'react-native-reanimated';

function TabTransition({ isActive, children }) {
  const opacity = useSharedValue(isActive ? 1 : 0);
  const scale = useSharedValue(isActive ? 1 : 0.95);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 200 }),
    transform: [{ scale: withTiming(scale.value, { duration: 200 }) }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
```

**Usage:**
- Bottom tab bar navigation
- Sub-tabs within screens (Sessions, Progress, Notes, Goals)

**Timing**: 200ms

---

### Modal Presentation

**Pattern**: Fade overlay + slide up from bottom

```typescript
// Modal entrance animation
const modalSlideUp = {
  from: {
    opacity: 0,
    transform: [{ translateY: 300 }],
  },
  to: {
    opacity: 1,
    transform: [{ translateY: 0 }],
  },
  config: {
    damping: 30,
    stiffness: 300,
  },
};

// Overlay fade
const overlayFade = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: 200,
};
```

**Usage:**
- Filter bottom sheets
- Create race flow
- Confirmation dialogs
- Image viewers

**Timing**: 300ms entrance, 200ms exit

---

### Bottom Sheet

**Pattern**: Draggable sheet with snap points

```typescript
import { BottomSheetModal } from '@gorhom/bottom-sheet';

function FilterBottomSheet() {
  const snapPoints = ['25%', '50%', '90%'];

  return (
    <BottomSheetModal
      snapPoints={snapPoints}
      enablePanDownToClose
      animationConfigs={{
        damping: 80,
        stiffness: 500,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.1,
        restSpeedThreshold: 0.1,
      }}
    >
      {/* Content */}
    </BottomSheetModal>
  );
}
```

**Gestures:**
- Drag handle to resize
- Swipe down to dismiss
- Tap outside to dismiss
- Snap to defined heights

**Usage:**
- Filters
- Quick actions
- Form inputs
- Picker selections

---

### Page Transitions

**Pattern**: Shared element transitions

```typescript
// Using react-navigation-shared-element
<SharedElement id={`race.${raceId}.image`}>
  <Image source={{ uri: raceImageUrl }} />
</SharedElement>

// Config
const sharedElements = (route) => {
  const { raceId } = route.params;
  return [{
    id: `race.${raceId}.image`,
    animation: 'move',
    resize: 'clip',
  }];
};
```

**Usage:**
- Race card image → Race detail hero
- Profile avatar → Full profile
- Map preview → Full map view

**Timing**: 400ms

---

## Micro-Interactions

### Button Press

**Pattern**: Scale down + opacity + haptic

```typescript
function PressableButton({ onPress, children }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    opacity.value = withTiming(0.8, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

**States:**
- **Default**: Scale 1.0, opacity 1.0
- **Pressed**: Scale 0.95, opacity 0.8
- **Released**: Spring back to default

**Timing**: 100ms press, 200ms release

---

### Checkbox Toggle

**Pattern**: Scale + checkmark draw + haptic

```typescript
function CheckboxAnimation({ checked }) {
  const scale = useSharedValue(checked ? 1 : 0);
  const checkProgress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    if (checked) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withSpring(1, { damping: 10 })
      );
      checkProgress.value = withTiming(1, { duration: 200 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      scale.value = withTiming(0, { duration: 100 });
      checkProgress.value = withTiming(0, { duration: 100 });
    }
  }, [checked]);

  return (
    <Animated.View style={[styles.checkbox, { transform: [{ scale: scale.value }] }]}>
      <Svg>
        <AnimatedPath
          d="M5 10 L8 13 L15 6"
          stroke="white"
          strokeWidth={2}
          strokeDasharray={20}
          strokeDashoffset={20 * (1 - checkProgress.value)}
        />
      </Svg>
    </Animated.View>
  );
}
```

**Timing**: 200ms

---

### Switch Toggle

**Pattern**: Slide thumb + background color transition

```typescript
function SwitchAnimation({ value, onValueChange }) {
  const thumbPosition = useSharedValue(value ? 20 : 0);
  const backgroundColor = useSharedValue(value ? PRIMARY_COLOR : GRAY_COLOR);

  const handleToggle = () => {
    const newValue = !value;

    thumbPosition.value = withSpring(newValue ? 20 : 0, {
      damping: 15,
      stiffness: 150,
    });

    backgroundColor.value = withTiming(
      newValue ? PRIMARY_COLOR : GRAY_COLOR,
      { duration: 200 }
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  return (
    <Pressable onPress={handleToggle}>
      <Animated.View style={{ backgroundColor: backgroundColor.value }}>
        <Animated.View style={{ transform: [{ translateX: thumbPosition.value }] }}>
          {/* Thumb */}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
```

**Timing**: 200ms

---

### Card Expansion

**Pattern**: Height expansion + content fade-in

```typescript
function ExpandableCard({ title, children, expanded }) {
  const height = useSharedValue(expanded ? 'auto' : 60);
  const contentOpacity = useSharedValue(expanded ? 1 : 0);
  const rotation = useSharedValue(expanded ? 180 : 0);

  const animatedHeight = useAnimatedStyle(() => ({
    height: withTiming(height.value, { duration: 300 }),
  }));

  const animatedContent = useAnimatedStyle(() => ({
    opacity: withTiming(contentOpacity.value, { duration: 200, delay: expanded ? 100 : 0 }),
  }));

  const animatedChevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${withTiming(rotation.value, { duration: 300 })}deg` }],
  }));

  return (
    <Animated.View style={animatedHeight}>
      <View style={styles.header}>
        <Text>{title}</Text>
        <Animated.View style={animatedChevron}>
          <ChevronDown />
        </Animated.View>
      </View>
      <Animated.View style={animatedContent}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}
```

**Usage:**
- Optional Details in Create Race
- Description in Race Details
- Past sessions in Client Detail

**Timing**: 300ms

---

### Toast Notification

**Pattern**: Slide down from top + auto-dismiss

```typescript
function ToastAnimation({ visible, message, onDismiss }) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Entrance
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });

      // Auto-dismiss after 3s
      setTimeout(() => {
        translateY.value = withSpring(-100, { damping: 15 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onDismiss)();
        });
      }, 3000);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toast, animatedStyle]}>
      <Text>{message}</Text>
    </Animated.View>
  );
}
```

**Timing**:
- Entrance: 200ms
- Display: 3000ms
- Exit: 200ms

---

### Progress Bar

**Pattern**: Width animation + color transition

```typescript
function ProgressBar({ progress, variant = 'default' }) {
  const width = useSharedValue(0);
  const color = getColorForVariant(variant);

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: color,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}
```

**Usage:**
- Client progress
- Goal completion
- Upload/download status
- Membership breakdown

**Timing**: 500ms

---

## Gesture Interactions

### Swipe to Delete/Action

**Pattern**: Horizontal drag reveals actions

```typescript
import { Swipeable } from 'react-native-gesture-handler';

function SwipeableListItem({ item, onDelete, onEdit }) {
  const renderRightActions = (progress, dragX) => {
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.actionsContainer, { transform: [{ translateX }] }]}>
        <TouchableOpacity style={[styles.action, styles.editAction]} onPress={onEdit}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, styles.deleteAction]} onPress={onDelete}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <View style={styles.itemContent}>
        {/* Item content */}
      </View>
    </Swipeable>
  );
}
```

**Usage:**
- Session cards (Reschedule, Cancel)
- Training log entries (Edit, Delete)
- Notification items (Archive, Delete)

**Gesture:**
- Swipe left to reveal actions
- Tap action to execute
- Swipe right to close
- Release with low velocity to snap back

---

### Pull to Refresh

**Pattern**: Pull down to trigger refresh

```typescript
import { RefreshControl } from 'react-native';

function PullToRefreshList({ data, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={data}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={SailorColors.primary}
          colors={[SailorColors.primary]}
          progressViewOffset={20}
        />
      }
      // ... other props
    />
  );
}
```

**Usage:**
- Race list
- Dashboard
- Training log
- Client list

**Gesture:**
- Pull down > 60px
- Release to trigger
- Spinner appears
- Content updates
- Spinner disappears

**Timing**: Spinner minimum 500ms (avoid flash)

---

### Long Press

**Pattern**: Hold to reveal context menu

```typescript
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';

function LongPressableCard({ item, onLongPress }) {
  const scale = useSharedValue(1);

  const handleLongPress = ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {
      scale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress(item);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <LongPressGestureHandler
      onHandlerStateChange={handleLongPress}
      minDurationMs={500}
    >
      <Animated.View style={animatedStyle}>
        {/* Card content */}
      </Animated.View>
    </LongPressGestureHandler>
  );
}
```

**Usage:**
- Race cards (Quick actions)
- Training log entries (Edit, Delete, Share)
- Client cards (Send message, View profile)

**Timing**: 500ms hold to trigger

---

### Drag to Reorder

**Pattern**: Long press + drag to reorder list

```typescript
import DraggableFlatList from 'react-native-draggable-flatlist';

function ReorderableList({ data, onReorder }) {
  const renderItem = ({ item, drag, isActive }) => {
    return (
      <Pressable
        onLongPress={drag}
        style={[
          styles.item,
          isActive && styles.itemDragging,
        ]}
      >
        <DragHandle />
        <Text>{item.name}</Text>
      </Pressable>
    );
  };

  return (
    <DraggableFlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onDragEnd={({ data }) => onReorder(data)}
      activationDistance={10}
    />
  );
}
```

**Usage:**
- Reorder boat classes
- Prioritize training goals
- Arrange custom fields

**Gesture:**
- Long press to activate
- Drag to move
- Release to drop
- List reorders with animation

---

### Pinch to Zoom (Maps)

**Pattern**: Two-finger pinch scales map

```typescript
import MapView from 'react-native-maps';

function InteractiveMap() {
  const [region, setRegion] = useState(initialRegion);

  return (
    <MapView
      region={region}
      onRegionChangeComplete={setRegion}
      zoomEnabled={true}
      zoomTapEnabled={true}
      zoomControlEnabled={false}
      pitchEnabled={true}
      rotateEnabled={true}
      scrollEnabled={true}
      minZoomLevel={8}
      maxZoomLevel={18}
    >
      {/* Markers, overlays */}
    </MapView>
  );
}
```

**Gestures:**
- Pinch out: Zoom in
- Pinch in: Zoom out
- Double tap: Zoom in
- Two-finger tap: Zoom out
- Drag: Pan
- Two-finger rotate: Rotate map

---

### Slider / Range Selector

**Pattern**: Drag thumb along track

```typescript
import Slider from '@react-native-community/slider';

function RangeSlider({ value, onValueChange, min, max }) {
  const handleValueChange = (newValue) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  return (
    <Slider
      value={value}
      onValueChange={handleValueChange}
      minimumValue={min}
      maximumValue={max}
      minimumTrackTintColor={SailorColors.primary}
      maximumTrackTintColor={Neutrals.gray300}
      thumbTintColor={SailorColors.primary}
      step={1}
    />
  );
}
```

**Usage:**
- Distance filter (race search)
- Date range selector
- Intensity rating

**Haptic**: Light impact on value change

---

## Loading States

### Skeleton Screens

**Pattern**: Pulsing placeholder content

```typescript
import { Skeleton } from 'react-native-skeletons';

function RaceCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton
        width="70%"
        height={24}
        borderRadius={4}
        animation="pulse"
      />
      <Skeleton
        width="50%"
        height={16}
        borderRadius={4}
        marginTop={8}
        animation="pulse"
      />
      <Skeleton
        width="40%"
        height={16}
        borderRadius={4}
        marginTop={8}
        animation="pulse"
      />
    </View>
  );
}
```

**Usage:**
- Race list loading
- Dashboard loading
- Profile loading

**Timing**:
- Pulse duration: 1500ms
- Delay before showing: 200ms

---

### Shimmer Effect

**Pattern**: Gradient sweep across placeholder

```typescript
import { LinearGradient } from 'expo-linear-gradient';

function ShimmerPlaceholder() {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          animatedValue.value,
          [0, 1],
          [-350, 350]
        ),
      },
    ],
  }));

  return (
    <View style={styles.placeholder}>
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}
```

**Usage:**
- Premium loading effect
- Image placeholders
- Content loading

---

### Spinner

**Pattern**: Rotating activity indicator

```typescript
function LoadingSpinner({ size = 'medium', color }) {
  return (
    <ActivityIndicator
      size={size === 'small' ? 'small' : 'large'}
      color={color || SailorColors.primary}
      style={styles.spinner}
    />
  );
}
```

**Usage:**
- Button loading state
- Inline loading
- Modal loading

**Timing**: Appears after 200ms delay

---

### Progress Indicator

**Pattern**: Determinate progress bar

```typescript
function UploadProgress({ progress }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress * 100, { duration: 300 });
  }, [progress]);

  return (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          { width: `${width.value}%` },
        ]}
      />
      <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}
```

**Usage:**
- File uploads
- Data sync
- Multi-step forms

---

## Haptic Feedback

### Feedback Types

```typescript
import * as Haptics from 'expo-haptics';

// Light tap (buttons, checkboxes)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact (switches, selections)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy impact (errors, warnings)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Warning notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Error notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Selection changed (picker, slider)
Haptics.selectionAsync();
```

### Usage Patterns

| Action | Haptic Type | When to Use |
|--------|-------------|-------------|
| Button tap | Light Impact | All button presses |
| Switch toggle | Medium Impact | On/off toggles |
| Checkbox check | Success | When checking |
| Error state | Error | Form validation errors |
| Success action | Success | Race created, saved |
| Slider drag | Selection | Each value change |
| Long press | Medium Impact | Context menu trigger |
| Pull to refresh | Light Impact | Refresh triggered |
| Delete action | Heavy Impact | Destructive actions |

---

## Real-Time Updates

### Live Race Updates

**Pattern**: Periodic polling + optimistic updates

```typescript
function LiveRaceCard({ raceId }) {
  const [liveData, setLiveData] = useState(null);
  const pulseAnim = useSharedValue(1);

  // Polling interval: 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetchLiveRaceData(raceId);
      setLiveData(data);

      // Pulse animation on update
      pulseAnim.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [raceId]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim.value }] }}>
      <Text>🔴 LIVE</Text>
      {/* Race data */}
    </Animated.View>
  );
}
```

**Visual Indicators:**
- 🔴 LIVE badge (pulsing red)
- Last updated timestamp
- Subtle pulse on data update
- Loading spinner during fetch

---

### Optimistic UI Updates

**Pattern**: Update UI immediately, rollback on error

```typescript
function OptimisticButton({ onPress }) {
  const [state, setState] = useState('default');

  const handlePress = async () => {
    // Immediate UI feedback
    setState('loading');

    try {
      await onPress();
      setState('success');

      // Show success state briefly
      setTimeout(() => setState('default'), 1500);
    } catch (error) {
      setState('error');

      // Rollback after showing error
      setTimeout(() => setState('default'), 1500);
    }
  };

  return (
    <Button
      title={state === 'loading' ? 'Saving...' : 'Save'}
      onPress={handlePress}
      loading={state === 'loading'}
    />
  );
}
```

---

### Websocket Updates

**Pattern**: Real-time data stream + visual feedback

```typescript
function RealtimeRaceTracker({ raceId }) {
  const [positions, setPositions] = useState([]);
  const flashAnim = useSharedValue(0);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.regattaflow.com/races/${raceId}/live`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setPositions(update.positions);

      // Flash animation on update
      flashAnim.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
    };

    return () => ws.close();
  }, [raceId]);

  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      flashAnim.value,
      [0, 1],
      [Neutrals.surface, SailorColors.primarySubtle]
    ),
  }));

  return (
    <Animated.View style={flashStyle}>
      {/* Position list */}
    </Animated.View>
  );
}
```

---

## Map Interactions

### Map Marker Animations

**Pattern**: Drop-in animation for markers

```typescript
function AnimatedMarker({ coordinate, title }) {
  const translateY = useSharedValue(-100);
  const scale = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15 });
    scale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withSpring(1, { damping: 10 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Marker coordinate={coordinate}>
      <Animated.View style={animatedStyle}>
        <CustomMarker title={title} />
      </Animated.View>
    </Marker>
  );
}
```

---

### Map Clustering

**Pattern**: Animated cluster expansion

```typescript
import { Marker } from 'react-native-maps';
import SuperCluster from 'supercluster';

function ClusteredMap({ points }) {
  const [clusters, setClusters] = useState([]);

  const handleClusterPress = (cluster) => {
    // Zoom to cluster bounds with animation
    mapRef.current.animateToRegion({
      ...cluster.bounds,
      latitudeDelta: cluster.bounds.latitudeDelta * 0.5,
      longitudeDelta: cluster.bounds.longitudeDelta * 0.5,
    }, 300);
  };

  return (
    <MapView ref={mapRef}>
      {clusters.map((cluster) =>
        cluster.properties.cluster ? (
          <Marker
            key={cluster.id}
            coordinate={cluster.geometry.coordinates}
            onPress={() => handleClusterPress(cluster)}
          >
            <ClusterMarker count={cluster.properties.point_count} />
          </Marker>
        ) : (
          <AnimatedMarker key={cluster.id} {...cluster} />
        )
      )}
    </MapView>
  );
}
```

---

### Route Animations

**Pattern**: Animated polyline drawing

```typescript
function AnimatedRoute({ coordinates }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 2000 });
  }, [coordinates]);

  // Draw route progressively
  const visibleCoordinates = useMemo(() => {
    const count = Math.floor(coordinates.length * progress.value);
    return coordinates.slice(0, count);
  }, [coordinates, progress.value]);

  return (
    <Polyline
      coordinates={visibleCoordinates}
      strokeColor={SailorColors.primary}
      strokeWidth={3}
    />
  );
}
```

---

## Form Interactions

### Auto-Complete

**Pattern**: Dropdown appears as user types

```typescript
function AutoCompleteInput({ suggestions, onSelect }) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(showSuggestions ? suggestions.length * 50 : 0, {
      duration: 200,
    });
  }, [showSuggestions, suggestions]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: withTiming(showSuggestions ? 1 : 0, { duration: 200 }),
  }));

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      <Animated.View style={[styles.suggestions, animatedStyle]}>
        {suggestions.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              onSelect(item);
              setQuery(item.name);
              setShowSuggestions(false);
            }}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}
```

---

### Inline Validation

**Pattern**: Real-time feedback on input change

```typescript
function ValidatedInput({ value, onChange, validate }) {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const borderColor = useSharedValue(Neutrals.border);

  useEffect(() => {
    if (touched) {
      const validationError = validate(value);
      setError(validationError);

      borderColor.value = withTiming(
        validationError ? Semantic.error : Semantic.success,
        { duration: 200 }
      );
    }
  }, [value, touched]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  return (
    <View>
      <Animated.View style={[styles.input, animatedStyle]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          onBlur={() => setTouched(true)}
        />
      </Animated.View>
      {error && (
        <Animated.Text
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.errorText}
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
}
```

---

### Character Counter

**Pattern**: Animated counter with color change

```typescript
function CharacterCounter({ value, maxLength }) {
  const remaining = maxLength - value.length;
  const percentage = (value.length / maxLength) * 100;

  const color = useSharedValue(Neutrals.textSecondary);

  useEffect(() => {
    if (percentage > 90) {
      color.value = withTiming(Semantic.error, { duration: 200 });
    } else if (percentage > 75) {
      color.value = withTiming(Semantic.warning, { duration: 200 });
    } else {
      color.value = withTiming(Neutrals.textSecondary, { duration: 200 });
    }
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    color: color.value,
  }));

  return (
    <Animated.Text style={[styles.counter, animatedStyle]}>
      {remaining} characters remaining
    </Animated.Text>
  );
}
```

---

## Implementation Guide

### React Native Reanimated Setup

```typescript
// Install dependencies
// npm install react-native-reanimated

// Configure babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // Must be last
  ],
};
```

### Performance Optimization

```typescript
// Use worklets for better performance
const animatedStyle = useAnimatedStyle(() => {
  'worklet'; // Runs on UI thread
  return {
    transform: [{ translateX: translateX.value }],
  };
});

// Avoid inline style objects
const styles = StyleSheet.create({
  container: {
    // Pre-computed styles
  },
});

// Use layoutAnimation for simple animations
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
setState(newState);
```

### Accessibility Considerations

```typescript
// Respect reduced motion preference
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

// Disable or simplify animations
const duration = reduceMotion ? 0 : 300;
```

### Testing Animations

```typescript
import { render } from '@testing-library/react-native';

it('animates button press', () => {
  const { getByRole } = render(<Button title="Test" onPress={jest.fn()} />);
  const button = getByRole('button');

  fireEvent.press(button);

  // Check animated styles
  expect(button).toHaveStyle({ transform: [{ scale: 0.95 }] });
});
```

---

## Animation Checklist

Before launching, verify:

- [ ] All animations respect `prefers-reduced-motion`
- [ ] Animations run at 60fps on target devices
- [ ] Loading states appear after 200ms delay
- [ ] Success/error states show for minimum 1500ms
- [ ] Haptic feedback on all interactive elements
- [ ] Skeleton screens for slow-loading content
- [ ] Optimistic updates for user actions
- [ ] Smooth transitions between screens
- [ ] No janky scrolling or stuttering
- [ ] Proper cleanup in useEffect hooks

---

## Next Steps

With interaction patterns defined, the remaining documents will detail:

1. **NAVIGATION_ARCHITECTURE.md**: Complete navigation structure and flows
2. **ACCESSIBILITY.md**: Comprehensive accessibility guidelines

All animations follow React Native best practices and are optimized for performance on both iOS and Android.
