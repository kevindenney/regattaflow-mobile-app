# Web Compatibility Guide

## Overview

React Native's `Alert.alert()` function does not work on the web platform. When called on web, it silently fails - no dialog appears and no callback is triggered. This creates a broken user experience where buttons appear to do nothing.

To solve this, we created the `crossPlatformAlert` utility that provides a unified API for showing alerts that works on both web and native platforms.

### Platform Behavior

| Platform | Implementation |
|----------|---------------|
| **Web** | Uses `window.alert()`, `window.confirm()`, `window.prompt()` |
| **iOS** | Uses React Native `Alert.alert()` and `Alert.prompt()` |
| **Android** | Uses React Native `Alert.alert()` (no prompt support) |

---

## Quick Reference

### Import

```typescript
import { showAlert, showConfirm, showConfirmAsync, showAlertWithButtons, showPrompt } from '@/lib/utils/crossPlatformAlert';
```

### Basic Usage

```typescript
// Simple informational alert
showAlert('Success', 'Your changes have been saved.');

// Confirmation with callback
showConfirm(
  'Delete Item',
  'Are you sure you want to delete this?',
  () => deleteItem(),
  { destructive: true }
);

// Async confirmation
const confirmed = await showConfirmAsync('Confirm', 'Proceed with this action?');
if (confirmed) {
  // User clicked OK
}
```

---

## API Reference

### `showAlert(title, message?)`

Shows a simple informational alert with an OK button.

```typescript
function showAlert(title: string, message?: string): void
```

**Parameters:**
- `title` - Alert title (required)
- `message` - Optional description text

**Example:**
```typescript
showAlert('Error', 'Failed to save changes. Please try again.');
showAlert('Welcome!'); // Title only
```

---

### `showConfirm(title, message, onConfirm, options?)`

Shows a confirmation dialog with Cancel/OK buttons. Executes callback only if user confirms.

```typescript
function showConfirm(
  title: string,
  message: string | undefined,
  onConfirm: () => void | Promise<void>,
  options?: ConfirmOptions
): void
```

**Parameters:**
- `title` - Dialog title
- `message` - Description (can be `undefined`)
- `onConfirm` - Callback executed when user confirms (supports async)
- `options` - Optional configuration:
  - `destructive?: boolean` - Styles confirm button as destructive (red on iOS)
  - `cancelText?: string` - Custom cancel button text (default: "Cancel")
  - `confirmText?: string` - Custom confirm button text (default: "OK")

**Example:**
```typescript
showConfirm(
  'Sign Out',
  'Are you sure you want to sign out?',
  async () => {
    await signOut();
  },
  { destructive: true, confirmText: 'Sign Out' }
);
```

---

### `showConfirmAsync(title, message?, options?)`

Promise-based confirmation dialog. Returns `true` if confirmed, `false` if cancelled.

```typescript
function showConfirmAsync(
  title: string,
  message?: string,
  options?: ConfirmOptions
): Promise<boolean>
```

**Example:**
```typescript
const shouldDelete = await showConfirmAsync(
  'Delete Race',
  'This action cannot be undone.',
  { destructive: true }
);

if (shouldDelete) {
  await deleteRace(raceId);
}
```

---

### `showAlertWithButtons(title, message, buttons)`

Shows an alert with custom button configuration.

```typescript
function showAlertWithButtons(
  title: string,
  message: string | undefined,
  buttons: AlertButton[]
): void

interface AlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}
```

**Web Limitation:** Only supports 2 buttons (cancel + confirm pattern). For complex dialogs on web, use a modal component instead.

**Example:**
```typescript
showAlertWithButtons('Save Changes?', 'You have unsaved changes.', [
  { text: 'Discard', style: 'destructive', onPress: () => discardChanges() },
  { text: 'Cancel', style: 'cancel' },
  { text: 'Save', onPress: () => saveChanges() },
]);
```

---

### `showPrompt(title, message?, defaultValue?)`

Shows a text input prompt. Returns the entered text or `null` if cancelled.

```typescript
function showPrompt(
  title: string,
  message?: string,
  defaultValue?: string
): Promise<string | null>
```

**Platform Support:**
- ✅ Web - Uses `window.prompt()`
- ✅ iOS - Uses `Alert.prompt()`
- ⚠️ Android - Returns `null` (use a custom modal instead)

**Example:**
```typescript
const newName = await showPrompt('Rename Boat', 'Enter new boat name:', currentName);
if (newName) {
  await updateBoatName(boatId, newName);
}
```

---

## Migration Examples

### Simple Alert

**Before (broken on web):**
```typescript
Alert.alert('Error', 'Something went wrong');
```

**After (works everywhere):**
```typescript
import { showAlert } from '@/lib/utils/crossPlatformAlert';

showAlert('Error', 'Something went wrong');
```

---

### Confirmation Dialog

**Before (broken on web):**
```typescript
Alert.alert(
  'Delete Race',
  'Are you sure?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete },
  ]
);
```

**After (works everywhere):**
```typescript
import { showConfirm } from '@/lib/utils/crossPlatformAlert';

showConfirm(
  'Delete Race',
  'Are you sure?',
  handleDelete,
  { destructive: true, confirmText: 'Delete' }
);
```

---

### Async/Await Pattern

**Before (callback hell):**
```typescript
Alert.alert('Confirm', 'Proceed?', [
  { text: 'Cancel', style: 'cancel' },
  {
    text: 'OK',
    onPress: async () => {
      try {
        await doSomething();
        Alert.alert('Success', 'Done!');
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    },
  },
]);
```

**After (clean async):**
```typescript
import { showConfirmAsync, showAlert } from '@/lib/utils/crossPlatformAlert';

const confirmed = await showConfirmAsync('Confirm', 'Proceed?');
if (confirmed) {
  try {
    await doSomething();
    showAlert('Success', 'Done!');
  } catch (e) {
    showAlert('Error', e.message);
  }
}
```

---

### Real Example: Sign Out (AccountModalContent.tsx)

**Before (broken on web):**
```typescript
const handleSignOut = useCallback(() => {
  Alert.alert(
    'Sign Out',
    'Are you sure you want to sign out?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out.');
          }
        },
      },
    ]
  );
}, [signOut]);
```

**After (works everywhere):**
```typescript
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';

const handleSignOut = useCallback(() => {
  showConfirm(
    'Sign Out',
    'Are you sure you want to sign out?',
    async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('[Account] Sign out error:', error);
        showAlert('Error', 'Failed to sign out. Please try again.');
      }
    },
    { destructive: true, confirmText: 'Sign Out' }
  );
}, [signOut]);
```

---

## Testing Checklist

When converting a file to use `crossPlatformAlert`:

- [ ] Replace `import { Alert } from 'react-native'` with utility import
- [ ] Convert all `Alert.alert()` calls to appropriate utility function
- [ ] Remove `Alert` from react-native imports if no longer used
- [ ] Test on **web browser** - verify dialogs appear
- [ ] Test on **iOS simulator** - verify native alerts work
- [ ] Test **Cancel** action - verify it doesn't trigger the callback
- [ ] Test **Confirm** action - verify callback executes
- [ ] Check for **async callbacks** - ensure they complete properly
- [ ] Verify **error handling** - test error alert paths

---

## Known Limitations

### Web Platform

| Feature | Limitation |
|---------|------------|
| **Styling** | Web uses browser's native dialog styling (cannot customize) |
| **Multiple buttons** | Only 2 buttons supported (OK/Cancel pattern) |
| **Button styles** | `destructive` style has no visual effect on web |
| **Blocking** | `window.confirm()` blocks the main thread |
| **Accessibility** | Browser dialogs have limited accessibility customization |

### Android Platform

| Feature | Limitation |
|---------|------------|
| **Prompt** | `Alert.prompt` not supported - use custom modal |
| **Button limit** | Maximum 3 buttons |

### Recommendations

1. **Complex dialogs**: For dialogs with more than 2 buttons or custom UI, use a modal component instead
2. **Text input**: On Android, use a custom modal for text input prompts
3. **Styling needs**: If you need custom styling, use a modal with your design system
4. **Non-blocking**: If you need non-blocking behavior on web, use a toast or custom modal

---

## File Location

The utility is located at:
```
lib/utils/crossPlatformAlert.ts
```

---

## See Also

- [WEB_COMPATIBILITY_MIGRATION.md](./WEB_COMPATIBILITY_MIGRATION.md) - Migration checklist for remaining files
- [React Native Alert documentation](https://reactnative.dev/docs/alert)
