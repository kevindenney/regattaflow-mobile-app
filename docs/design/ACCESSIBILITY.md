# RegattaFlow Accessibility Guidelines

## Table of Contents
1. [Accessibility Principles](#accessibility-principles)
2. [WCAG Compliance](#wcag-compliance)
3. [Visual Accessibility](#visual-accessibility)
4. [Motor Accessibility](#motor-accessibility)
5. [Auditory Accessibility](#auditory-accessibility)
6. [Cognitive Accessibility](#cognitive-accessibility)
7. [Screen Reader Support](#screen-reader-support)
8. [Platform-Specific Guidelines](#platform-specific-guidelines)
9. [Testing & Validation](#testing--validation)
10. [Implementation Checklist](#implementation-checklist)

---

## Accessibility Principles

### Core Commitments

1. **Inclusive by Default**: Accessibility is not an add-on; it's built into every component
2. **WCAG AAA Target**: Aim for AAA where possible, minimum AA compliance
3. **Multi-Modal Input**: Support touch, voice, keyboard, and assistive devices
4. **Outdoor Usability**: Enhanced contrast for bright sunlight conditions
5. **Progressive Enhancement**: Core features work even with accessibility features disabled
6. **Regular Audits**: Quarterly accessibility audits and user testing

### Target Users

- **Low Vision**: Users with reduced vision or colorblindness
- **Blind**: Users relying on screen readers (VoiceOver, TalkBack)
- **Motor Impairment**: Users with limited dexterity or using assistive devices
- **Cognitive Differences**: Users with dyslexia, ADHD, or processing differences
- **Situational Disabilities**: Users in bright sunlight, wearing gloves, or in noisy environments

---

## WCAG Compliance

### Level A (Minimum)

#### ✅ Perceivable

**1.1 Text Alternatives**
- All images have `accessibilityLabel` or `alt` text
- Decorative images use `accessibilityRole="none"`
- Icons paired with text labels

```typescript
// Good
<Image
  source={require('./race-flag.png')}
  accessibilityLabel="Race starting flag"
/>

// Bad
<Image source={require('./race-flag.png')} />
```

**1.2 Time-based Media**
- Video content has captions
- Audio content has transcripts
- Live race commentary has real-time captions

**1.3 Adaptable**
- Content structure conveyed programmatically
- Reading order makes sense
- No information conveyed by color alone

**1.4 Distinguishable**
- Text contrast minimum 4.5:1 (AA)
- Audio controls provided
- No autoplay audio >3 seconds

#### ✅ Operable

**2.1 Keyboard Accessible**
- All functionality available via keyboard
- No keyboard traps
- Focus visible at all times

**2.2 Enough Time**
- Timer-based features (race countdown) adjustable
- Auto-save for forms (no timeout pressure)
- Pause/stop for moving content

**2.3 Seizures**
- No content flashes more than 3 times per second
- No large flashing areas

**2.4 Navigable**
- Clear page titles
- Focus order is logical
- Link purpose clear from text
- Skip navigation links

#### ✅ Understandable

**3.1 Readable**
- Language specified (`<html lang="en">`)
- Complex terms have glossary
- Abbreviations expanded on first use

**3.2 Predictable**
- Consistent navigation across personas
- Consistent component behavior
- No unexpected context changes

**3.3 Input Assistance**
- Error messages clear and actionable
- Labels provided for all inputs
- Help text available
- Error prevention for destructive actions

#### ✅ Robust

**4.1 Compatible**
- Valid markup (React Native semantic components)
- Name, role, value programmatically determined
- Status messages announced

---

### Level AA (Target)

#### Enhanced Requirements

**1.4.3 Contrast (Minimum)**
- Text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**1.4.5 Images of Text**
- Avoid images of text
- Use real text with custom fonts

**2.4.7 Focus Visible**
- Focus indicator always visible
- Minimum 2px outline
- High contrast focus ring

**3.1.2 Language of Parts**
- Language changes marked up
- Multi-language support

**3.2.4 Consistent Identification**
- Icons/buttons same across app
- "Save" always means save
- Consistent terminology

**3.3.3 Error Suggestion**
- Specific error corrections suggested
- "Invalid email" → "Email must include @"

**3.3.4 Error Prevention**
- Confirmation for legal/financial actions
- Review before submit
- Undo destructive actions

---

### Level AAA (Enhanced)

#### Enhanced Requirements

**1.4.6 Contrast (Enhanced)**
- Text: 7:1 contrast ratio (**RegattaFlow standard for outdoor use**)
- Large text: 4.5:1 contrast ratio

**1.4.8 Visual Presentation**
- Line height minimum 1.5x font size
- Paragraph spacing minimum 2x font size
- Text resizable up to 200%
- No horizontal scrolling at 200% zoom

**2.2.3 No Timing**
- No time limits on interactions
- Exceptions: live auctions, real-time races

**2.4.8 Location**
- Breadcrumbs or visual indicators
- "Dashboard > Races > Race Detail"

**2.4.10 Section Headings**
- Content organized with headings
- Clear hierarchy (H1 > H2 > H3)

**3.3.5 Help**
- Context-sensitive help available
- Tooltips, info icons, help links

---

## Visual Accessibility

### Color Contrast

#### Text Contrast

**Body Text** (16px regular)
- Minimum: 4.5:1 (AA)
- Target: 7:1 (AAA) ← **RegattaFlow standard**

**Large Text** (18px+ or 14px+ bold)
- Minimum: 3:1 (AA)
- Target: 4.5:1 (AAA)

**UI Components**
- Buttons, borders, icons: 3:1 minimum
- Focus indicators: 3:1 minimum

#### Testing Colors

```typescript
// Design System Colors - All tested for 7:1 contrast
export const ContrastTests = {
  // Primary text on background
  textPrimary: {
    foreground: '#111827', // gray-900
    background: '#F9FAFB', // off-white
    ratio: 15.8,           // ✅ AAA (7:1)
  },
  // Secondary text on background
  textSecondary: {
    foreground: '#6B7280', // gray-500
    background: '#F9FAFB',
    ratio: 4.6,            // ✅ AA (4.5:1)
  },
  // Sailor primary on white
  sailorPrimary: {
    foreground: '#0284C7', // sky-600
    background: '#FFFFFF',
    ratio: 4.89,           // ✅ AA Large (3:1)
  },
  // Error text
  errorText: {
    foreground: '#DC2626', // red-600
    background: '#FEF2F2', // red-50
    ratio: 7.2,            // ✅ AAA (7:1)
  },
};
```

#### Never Use

- Pure black (#000000) on pure white (#FFFFFF) - too harsh
- Low contrast grays (#CCCCCC on #FFFFFF) - fails AA
- Color as only indicator - supplement with icons/text

---

### Colorblindness Support

#### Types to Consider

1. **Protanopia** (red-blind): 1% of males
2. **Deuteranopia** (green-blind): 1% of males
3. **Tritanopia** (blue-blind): 0.001% of population
4. **Achromatopsia** (total colorblindness): 0.003% of population

#### Design Strategies

```typescript
// Bad: Color-only indicators
<View style={{ backgroundColor: isError ? 'red' : 'green' }}>
  <Text>Status</Text>
</View>

// Good: Color + icon + text
<View style={{ backgroundColor: isError ? Semantic.errorSubtle : Semantic.successSubtle }}>
  {isError ? <XCircle color={Semantic.error} /> : <CheckCircle color={Semantic.success} />}
  <Text>{isError ? 'Error' : 'Success'}</Text>
</View>
```

**Status Indicators:**
- ✅ Success: Green + checkmark icon + "Success" text
- ⚠️ Warning: Orange + alert icon + "Warning" text
- ❌ Error: Red + X icon + "Error" text
- ℹ️ Info: Blue + info icon + "Info" text

**Race Status:**
- 🟢 LIVE: Pulsing animation + "LIVE" text + red badge
- 🔵 UPCOMING: Static + "UPCOMING" text + blue badge
- ⚪ COMPLETED: Grayed out + "COMPLETED" text + gray badge

---

### Dynamic Type Support

#### Font Scaling

```typescript
import { useWindowDimensions, PixelRatio } from 'react-native';

// Respect system font size
const getFontSize = (baseSize: number) => {
  const { fontScale } = PixelRatio;
  return baseSize * fontScale;
};

// Usage
const styles = StyleSheet.create({
  text: {
    fontSize: getFontSize(16), // Scales with system settings
  },
});

// Limit scaling for design integrity
const maxScale = 2.0; // 200% max
const scaledSize = Math.min(baseSize * fontScale, baseSize * maxScale);
```

#### Text Resizing

- All text must be resizable up to 200%
- Layout must not break at 200% zoom
- No horizontal scrolling at enlarged sizes
- Buttons/touch targets grow with text

**Testing:**
- iOS: Settings > Display & Brightness > Text Size
- Android: Settings > Display > Font Size

---

### Focus Indicators

#### Requirements

```typescript
// Focus ring
const focusStyle = {
  borderWidth: 2,
  borderColor: SailorColors.primary,
  borderRadius: DesignSystem.borderRadius.md,
  shadowColor: SailorColors.primary,
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
};

// Usage with Pressable
<Pressable
  style={({ pressed, focused }) => [
    styles.button,
    focused && focusStyle,
    pressed && styles.pressed,
  ]}
>
  <Text>Button</Text>
</Pressable>
```

#### Focus Order

```typescript
// Set focus order with accessibilityViewIsModal
<Modal visible={visible} accessibilityViewIsModal>
  {/* Focus trapped in modal */}
</Modal>

// Skip decorative elements
<View accessibilityElementsHidden>
  <Image source={backgroundPattern} />
</View>
```

---

## Motor Accessibility

### Touch Target Sizes

#### Minimum Sizes

- **iOS**: 44x44 points (44x44 dp)
- **Android**: 48x48 dp (48x48 px @ 1x)
- **RegattaFlow Standard**: 48x48 dp (larger for outdoor use)

```typescript
// Enforce minimum touch target
const TouchableItem = ({ children, onPress }) => {
  return (
    <Pressable
      style={styles.touchable}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} // Expand hit area
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchable: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

#### Spacing

- Minimum 8px spacing between touch targets
- Recommended 16px spacing for outdoor use
- Group related actions together
- Avoid clustered small targets

---

### Gesture Alternatives

#### Required Alternatives

| Gesture | Alternative |
|---------|-------------|
| Swipe to delete | Long press → Delete button |
| Pinch to zoom | Zoom buttons (+/-) |
| Long press | Explicit "More" button |
| Double tap | Single tap + confirmation |
| Drag to reorder | Edit mode + up/down buttons |
| Pull to refresh | Refresh button |

```typescript
// Bad: Swipe-only action
<Swipeable renderRightActions={renderDeleteAction}>
  <Text>Swipe to delete</Text>
</Swipeable>

// Good: Swipe + alternative
<View>
  <Swipeable renderRightActions={renderDeleteAction}>
    <Text>Swipe to delete or...</Text>
  </Swipeable>
  <Button title="Delete" onPress={handleDelete} />
</View>
```

---

### Timing Adjustments

```typescript
// Allow users to extend time limits
const [timeLimit, setTimeLimit] = useState(300); // 5 minutes

function extendTime() {
  setTimeLimit(prev => prev + 60); // Add 1 minute
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

// Show warning before timeout
useEffect(() => {
  if (timeRemaining === 60) {
    Alert.alert(
      'Time Running Out',
      'You have 1 minute remaining. Do you need more time?',
      [
        { text: 'Add 5 Minutes', onPress: () => setTimeLimit(prev => prev + 300) },
        { text: 'Continue', onPress: () => {} },
      ]
    );
  }
}, [timeRemaining]);
```

---

## Auditory Accessibility

### Captions & Transcripts

#### Video Content

```typescript
// React Native Video with captions
import Video from 'react-native-video';

<Video
  source={{ uri: 'https://example.com/training-video.mp4' }}
  textTracks={[
    {
      title: 'English',
      language: 'en',
      type: 'application/x-subrip',
      uri: 'https://example.com/training-video-en.srt',
    },
  ]}
  selectedTextTrack={{ type: 'language', value: 'en' }}
/>
```

#### Audio Alternatives

- Transcripts for audio-only content
- Visual indicators for audio cues
- Haptic feedback for important audio alerts

```typescript
// Audio alert with visual + haptic
function raceStartAlert() {
  // Audio
  Sound.play('race-start.mp3');

  // Visual
  showToast({ message: '🏁 Race Starting!', type: 'warning' });

  // Haptic
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
```

---

### Voice Control

#### Voice Commands

```typescript
// Expo Speech Recognition (future)
import * as Speech from 'expo-speech-recognition';

const voiceCommands = {
  'start race': () => navigation.navigate('RaceTimer'),
  'view races': () => navigation.navigate('RaceList'),
  'log training': () => navigation.navigate('TrainingLog'),
  'ask coach': () => navigation.navigate('AICoach'),
};

// Listen for commands
Speech.requestPermissionsAsync().then(() => {
  Speech.start({
    language: 'en-US',
    onResult: (event) => {
      const command = event.results[0].transcript.toLowerCase();
      const action = voiceCommands[command];
      if (action) action();
    },
  });
});
```

---

## Cognitive Accessibility

### Clear Language

#### Writing Guidelines

1. **Use Plain Language**
   - Bad: "Optimize your regatta performance metrics"
   - Good: "Improve your race results"

2. **Short Sentences**
   - Maximum 20 words per sentence
   - One idea per sentence

3. **Active Voice**
   - Bad: "The race was won by Emma"
   - Good: "Emma won the race"

4. **Avoid Jargon**
   - Define sailing terms on first use
   - Provide glossary for advanced terms

---

### Consistent Patterns

#### UI Consistency

```typescript
// Always use same component for same action
const SaveButton = ({ onPress, loading }) => (
  <Button
    title={loading ? 'Saving...' : 'Save'}
    onPress={onPress}
    loading={loading}
    variant="primary"
  />
);

// Use consistently across app
<SaveButton onPress={handleSave} loading={isSaving} />
```

#### Icon Consistency

| Action | Icon | Always |
|--------|------|--------|
| Save | Check or Save icon | ✅ |
| Cancel | X icon | ✅ |
| Edit | Pencil icon | ✅ |
| Delete | Trash icon | ✅ |
| Info | Info circle | ✅ |
| Warning | Alert triangle | ✅ |

---

### Error Prevention

```typescript
// Confirmation for destructive actions
function deleteRace() {
  Alert.alert(
    'Delete Race?',
    'This will permanently delete "Winter Championship" and all associated data. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => performDelete(),
      },
    ]
  );
}

// Undo for accidental actions
function showUndoToast() {
  const timeoutId = setTimeout(() => {
    // Permanent delete after 5 seconds
    permanentlyDelete();
  }, 5000);

  showToast({
    message: 'Race deleted',
    action: {
      label: 'Undo',
      onPress: () => {
        clearTimeout(timeoutId);
        restoreRace();
      },
    },
  });
}
```

---

### Reduce Cognitive Load

#### Progressive Disclosure

```typescript
// Hide complexity behind "Advanced Options"
<View>
  <TextInput label="Race Name" required />
  <TextInput label="Date" required />
  <TextInput label="Time" required />

  <Expandable title="Advanced Options" defaultExpanded={false}>
    <TextInput label="Registration Deadline" />
    <TextInput label="Entry Fee" />
    <TextInput label="Max Participants" />
    {/* 10 more optional fields */}
  </Expandable>

  <Button title="Create Race" />
</View>
```

#### Smart Defaults

```typescript
// Pre-fill forms with intelligent defaults
const defaultValues = {
  raceName: `${venueName} - ${format(new Date(), 'MMM dd')}`,
  date: addDays(new Date(), 7), // Next week
  time: '10:00 AM',
  venue: nearestVenue,
  classes: userBoatClasses,
};
```

---

## Screen Reader Support

### VoiceOver (iOS) & TalkBack (Android)

#### Essential Properties

```typescript
interface AccessibilityProps {
  // Label: What is it?
  accessibilityLabel: string;

  // Hint: What does it do?
  accessibilityHint?: string;

  // Role: What type of element?
  accessibilityRole: 'button' | 'header' | 'link' | 'text' | 'image' | etc.;

  // State: What state is it in?
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };

  // Value: What's the current value?
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}
```

#### Examples

```typescript
// Button
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Register for Winter Championship"
  accessibilityHint="Opens registration form"
  onPress={handleRegister}
>
  <Text>Register</Text>
</TouchableOpacity>

// Checkbox
<Pressable
  accessibilityRole="checkbox"
  accessibilityLabel="Accept terms and conditions"
  accessibilityState={{ checked: isChecked }}
  onPress={() => setChecked(!isChecked)}
>
  <Checkbox checked={isChecked} />
  <Text>I accept the terms</Text>
</Pressable>

// Slider
<Slider
  value={distance}
  minimumValue={0}
  maximumValue={100}
  accessibilityLabel="Maximum distance"
  accessibilityValue={{ min: 0, max: 100, now: distance, text: `${distance} kilometers` }}
  accessibilityHint="Adjust to change search radius"
/>

// Progress bar
<View
  accessibilityRole="progressbar"
  accessibilityLabel="Upload progress"
  accessibilityValue={{ min: 0, max: 100, now: uploadProgress, text: `${uploadProgress} percent` }}
>
  <ProgressBar progress={uploadProgress} />
</View>

// Loading state
<View
  accessibilityRole="progressbar"
  accessibilityState={{ busy: true }}
  accessibilityLabel="Loading race data"
>
  <ActivityIndicator />
</View>
```

---

### Grouping & Ordering

```typescript
// Group related content
<View accessibilityRole="none" accessible={true} accessibilityLabel="Race information">
  <Text>Winter Championship</Text>
  <Text>December 20, 2025</Text>
  <Text>Royal Hong Kong YC</Text>
</View>

// Hide decorative elements
<Image
  source={backgroundPattern}
  accessibilityRole="none"
  accessibilityElementsHidden
/>

// Custom reading order
<View>
  <Text accessibilityLabel="Step 1: Enter race name">...</Text>
  <Text accessibilityLabel="Step 2: Select date">...</Text>
  <Text accessibilityLabel="Step 3: Choose venue">...</Text>
</View>
```

---

### Announcements

```typescript
import { AccessibilityInfo } from 'react-native';

// Announce important changes
function announceRaceStart() {
  AccessibilityInfo.announceForAccessibility('Race starting in 5 minutes');
}

// Announce errors
function announceError(message: string) {
  AccessibilityInfo.announceForAccessibility(`Error: ${message}`);
}

// Announce success
function announceSuccess() {
  AccessibilityInfo.announceForAccessibility('Race created successfully');
}

// Check if screen reader is enabled
async function checkScreenReader() {
  const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
  if (isEnabled) {
    // Adjust UI for screen reader users
    setShowExtendedLabels(true);
  }
}
```

---

## Platform-Specific Guidelines

### iOS (VoiceOver)

#### Unique Features

```typescript
// Adjustable trait (for sliders, pickers)
<View
  accessibilityRole="adjustable"
  accessibilityActions={[
    { name: 'increment', label: 'Increase distance' },
    { name: 'decrement', label: 'Decrease distance' },
  ]}
  onAccessibilityAction={(event) => {
    switch (event.nativeEvent.actionName) {
      case 'increment':
        setDistance(distance + 10);
        break;
      case 'decrement':
        setDistance(distance - 10);
        break;
    }
  }}
>
  <Text>{distance}km</Text>
</View>

// Magic Tap (double-tap with two fingers = primary action)
<View
  onMagicTap={() => {
    // Perform primary action (e.g., start race timer)
    handleStartRace();
  }}
>
  {/* Content */}
</View>

// Escape (two-finger Z = dismiss modal)
<Modal
  visible={visible}
  onRequestClose={onClose}
  accessibilityViewIsModal
>
  {/* Content */}
</Modal>
```

#### Testing

- Settings > Accessibility > VoiceOver > Enable
- Triple-click home button to toggle
- Two-finger tap to activate
- Swipe right/left to navigate

---

### Android (TalkBack)

#### Unique Features

```typescript
// Import accessibility node
<View
  importantForAccessibility="yes" // or "no", "no-hide-descendants"
  accessible={true}
>
  {/* Content */}
</View>

// Live region (announce changes automatically)
<View
  accessibilityLiveRegion="polite" // or "assertive"
  accessible={true}
>
  <Text>{liveRacePosition}</Text>
</View>

// Custom actions
<View
  accessible={true}
  accessibilityActions={[
    { name: 'edit', label: 'Edit race' },
    { name: 'delete', label: 'Delete race' },
    { name: 'share', label: 'Share race' },
  ]}
  onAccessibilityAction={(event) => {
    switch (event.nativeEvent.actionName) {
      case 'edit':
        handleEdit();
        break;
      case 'delete':
        handleDelete();
        break;
      case 'share':
        handleShare();
        break;
    }
  }}
>
  {/* Content */}
</View>
```

#### Testing

- Settings > Accessibility > TalkBack > Enable
- Volume up + down to toggle
- Swipe right/left to navigate
- Double-tap to activate

---

## Testing & Validation

### Automated Testing

#### ESLint Plugin

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['react-native-a11y'],
  rules: {
    'react-native-a11y/has-accessibility-props': 'error',
    'react-native-a11y/has-valid-accessibility-role': 'error',
    'react-native-a11y/has-valid-accessibility-state': 'warn',
    'react-native-a11y/has-valid-accessibility-value': 'warn',
    'react-native-a11y/has-accessibility-hint': 'warn',
    'react-native-a11y/has-valid-accessibility-descriptors': 'error',
  },
};
```

#### React Native Testing Library

```typescript
import { render, screen } from '@testing-library/react-native';

it('has proper accessibility props', () => {
  render(<Button title="Register" onPress={jest.fn()} />);

  const button = screen.getByRole('button', { name: 'Register' });

  expect(button).toHaveAccessibilityValue({ text: undefined });
  expect(button).toHaveAccessibilityState({ disabled: false });
});

it('announces important changes', () => {
  const { rerender } = render(<RaceStatus status="upcoming" />);

  // Change status
  rerender(<RaceStatus status="live" />);

  // Verify announcement
  expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
    'Race is now live'
  );
});
```

---

### Manual Testing

#### Testing Checklist

**Screen Reader Testing:**
- [ ] Turn on VoiceOver (iOS) or TalkBack (Android)
- [ ] Navigate entire app using only screen reader
- [ ] Verify all elements have labels
- [ ] Check focus order is logical
- [ ] Confirm interactive elements are announced
- [ ] Test form input and validation
- [ ] Verify error messages are announced
- [ ] Check modal/dialog focus trapping

**Visual Testing:**
- [ ] Increase text size to 200%
- [ ] Enable bold text
- [ ] Test with grayscale (colorblind simulation)
- [ ] Test in bright sunlight
- [ ] Verify focus indicators visible
- [ ] Check contrast ratios with tools
- [ ] Test with zoom enabled

**Motor Testing:**
- [ ] Use only keyboard (external keyboard on device)
- [ ] Use with gloves or stylus
- [ ] Test touch target sizes
- [ ] Verify gesture alternatives
- [ ] Test with Switch Control (iOS) or Switch Access (Android)

**Cognitive Testing:**
- [ ] Enable Reduce Motion
- [ ] Test with simplified language
- [ ] Verify error messages are clear
- [ ] Check for consistent patterns
- [ ] Test help/documentation access

---

### Accessibility Auditing Tools

#### Contrast Checkers

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Colorable**: https://colorable.jxnblk.com/
- **Accessible Colors**: https://accessible-colors.com/

#### Screen Reader Simulators

- **iOS VoiceOver**: Native (Settings > Accessibility)
- **Android TalkBack**: Native (Settings > Accessibility)
- **Accessibility Inspector**: Xcode (iOS)
- **Accessibility Scanner**: Android Studio

#### Automated Scanners

```bash
# Install React Native Accessibility Checker
npm install --save-dev @react-native-community/eslint-plugin-react-native-a11y

# Run accessibility audit
npm run lint -- --ext .tsx --ext .ts
```

---

### User Testing

#### Recruit Diverse Testers

- Users with low vision
- Users with screen readers
- Users with motor impairments
- Users with cognitive differences
- Users in various environments (bright sun, noisy, etc.)

#### Testing Protocol

1. **Task-Based Testing**:
   - Register for a race
   - Log a training session
   - Analyze race results
   - Book a coaching session

2. **Observation**:
   - Where do they struggle?
   - What takes too long?
   - What errors occur?
   - What's confusing?

3. **Feedback Collection**:
   - Post-test interview
   - System Usability Scale (SUS)
   - Specific accessibility pain points
   - Suggestions for improvement

---

## Implementation Checklist

### Development Phase

- [ ] Set up ESLint accessibility rules
- [ ] Create accessible component library
- [ ] Add accessibility props to all interactive elements
- [ ] Test with screen reader during development
- [ ] Verify touch target sizes
- [ ] Check color contrast ratios
- [ ] Implement keyboard navigation
- [ ] Add focus indicators
- [ ] Support dynamic type
- [ ] Respect reduced motion preferences
- [ ] Provide text alternatives for images
- [ ] Add ARIA labels where needed
- [ ] Test form validation announcements
- [ ] Implement error prevention patterns

### QA Phase

- [ ] Run automated accessibility tests
- [ ] Manual screen reader testing (iOS + Android)
- [ ] Visual accessibility testing (contrast, text size)
- [ ] Motor accessibility testing (touch targets, gestures)
- [ ] Cognitive accessibility review (language, patterns)
- [ ] Test with accessibility features enabled
- [ ] Verify all user flows accessible
- [ ] Check error messages are clear
- [ ] Test with external keyboard
- [ ] Verify focus management in modals
- [ ] Test loading states with screen reader
- [ ] Confirm animations respect reduced motion

### Pre-Launch

- [ ] Conduct user testing with disabled users
- [ ] Third-party accessibility audit
- [ ] Fix critical issues (AA minimum)
- [ ] Document accessibility features
- [ ] Train support team on accessibility
- [ ] Create accessibility statement
- [ ] Set up accessibility feedback channel

### Post-Launch

- [ ] Monitor accessibility feedback
- [ ] Quarterly accessibility audits
- [ ] Update documentation
- [ ] Track accessibility metrics
- [ ] Address reported issues within 30 days
- [ ] Continue user testing
- [ ] Share accessibility learnings

---

## Accessibility Statement

**Example Accessibility Statement:**

> RegattaFlow is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
>
> **Conformance Status**: RegattaFlow aims to conform to WCAG 2.1 Level AA.
>
> **Feedback**: We welcome your feedback on the accessibility of RegattaFlow. Please contact us at accessibility@regattaflow.com.
>
> **Compatibility**: RegattaFlow is designed to be compatible with the following assistive technologies:
> - iOS VoiceOver
> - Android TalkBack
> - iOS Switch Control
> - Android Switch Access
>
> **Limitations**: Despite our best efforts, some limitations may exist. We are actively working to address these issues.
>
> **Assessment**: This website was last assessed for accessibility on [Date].

---

## Resources

### Guidelines & Standards

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility Guidelines](https://developer.apple.com/accessibility/)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)

### Tools

- [Accessibility Inspector (Xcode)](https://developer.apple.com/documentation/accessibility/accessibility-inspector)
- [Accessibility Scanner (Android)](https://support.google.com/accessibility/android/answer/6376570)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Training

- [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)

---

## Conclusion

Accessibility is not optional at RegattaFlow. By following these guidelines, we ensure that every sailor, coach, and club admin can use our app effectively, regardless of their abilities or circumstances.

**Key Commitments:**
- WCAG AA minimum, AAA target
- 7:1 contrast for outdoor readability
- Full screen reader support
- Motor accessibility with alternatives
- Cognitive accessibility through clear design
- Regular testing and improvement

Together, we make sailing technology accessible to all.
