# E2E Test Results

## Test Run: February 5, 2026

### Summary

| Test | Result | Notes |
|------|--------|-------|
| sign-out.yaml | ✅ PASS | Works when user is already signed in |
| sign-in.yaml | ⚠️ PARTIAL | Coordinate-based input challenging on iOS |

### Sign-Out Test Results

**Status: PASSED** ✅

The sign-out test successfully:
1. Opens the Account modal via deeplink (`exp+regattaflow-app://account`)
2. Scrolls to find Sign Out button
3. Taps Sign Out using testID (`account-sign-out-button`)
4. Waits for crossPlatformAlert confirmation dialog
5. Confirms sign out by tapping the dialog's Sign Out button
6. Verifies the login screen appears ("Welcome back")

**Key Findings:**
- The `crossPlatformAlert` confirmation dialog works correctly on iOS
- testID-based element selection (`id: account-sign-out-button`) works
- Text-based tapping with index (`text: "Sign Out", index: 1`) works for dialogs
- Deep linking (`openLink: exp+regattaflow-app://account`) works well

### Sign-In Test Results

**Status: PARTIAL - TextInput testID Issues on iOS**

#### Updated Findings (Feb 5, 2026)

The sign-in test faces iOS-specific challenges with React Native TextInput accessibility:

**Root Cause Identified:**
- `testID` on `<TextInput>` components does NOT map to iOS `accessibilityIdentifier` reliably
- `testID` on `<Text>` components DOES work correctly
- Setting both `testID` and `accessibilityLabel` on the same element causes conflicts

**What Works:**
- `testID` on `<Text>` elements (e.g., `login-title`) - findable via Maestro `id:` selector
- `testID` on `<TouchableOpacity>` - works for buttons
- Text matching for visible labels

**What Doesn't Work:**
- `tapOn: id: "login-identifier-input"` fails even with testID set on TextInput
- `tapOn: text: "Username or email"` fails (placeholder text not in accessibility tree)

**Current Workaround:**
Using coordinate-based input with keyboard management:
```yaml
# Tap email field
- tapOn:
    point: "50%,47%"
- inputText: ${TEST_EMAIL}
- hideKeyboard  # Critical: reset coordinates

# Tap password field
- tapOn:
    point: "50%,54%"
- inputText: ${TEST_PASSWORD}
```

**Code Changes Made:**
```tsx
// Removed accessibilityLabel conflicts on login.tsx
<Text testID="login-title" accessibilityRole="header" style={styles.title}>
  Welcome back
</Text>

// TextInput keeps testID but with descriptive accessibilityLabel
<TextInput
  testID="login-identifier-input"
  accessibilityLabel="Username or email"
  ...
/>
```

### crossPlatformAlert Verification

**The sign-out test confirms the crossPlatformAlert migration is working:**

✅ Alert dialog appears with correct title ("Sign Out")
✅ Alert dialog shows confirmation message ("Are you sure you want to sign out?")
✅ Cancel button is present and detectable
✅ Destructive action button (Sign Out) is present and tappable
✅ Confirmation dismisses dialog and completes the action

### Files Modified for testID Support

| File | testIDs Added |
|------|---------------|
| `app/(auth)/login.tsx` | login-identifier-input, login-password-input, login-submit-button |
| `components/account/AccountModalContent.tsx` | account-sign-in-button, account-create-account-button, account-sign-out-button |
| `components/ui/ios/IOSListItem.tsx` | Added testID prop support |

### Maestro Configuration

- **App ID**: com.regattaflow.app
- **Platform**: iOS Simulator (iPhone 16e, iOS 26.0)
- **Maestro Version**: 2.1.0

### Working Test Commands

```bash
# Run sign-out test (requires user to be signed in first)
~/.maestro/bin/maestro test .maestro/auth/sign-out.yaml

# Navigate to account via deeplink (useful for manual testing)
exp+regattaflow-app://account
```

### Test Flow for crossPlatformAlert Verification

1. **Prerequisite**: User must be signed in
2. **Open Account**: Use deeplink `exp+regattaflow-app://account`
3. **Scroll**: Find the Sign Out button (below the fold)
4. **Tap Sign Out**: Triggers `crossPlatformAlert`
5. **Verify Dialog**: "Sign Out" title, "Are you sure..." message, Cancel/Sign Out buttons
6. **Confirm**: Tap Sign Out in dialog
7. **Result**: User is signed out, sees login screen

### NPM Scripts Available

```bash
npm run test:e2e              # Run all Maestro tests
npm run test:e2e:auth         # Run auth tests only
npm run test:e2e:auth-complete # Run complete auth flow test
npm run test:e2e:critical     # Run critical path tests
npm run test:e2e:alerts       # Run alert confirmation tests
```

### Recommendations

1. **Add More testIDs**: Add testID props to login form fields for reliable E2E testing
2. **Use Deep Links**: Deep links work reliably for navigation in tests
3. **Index-based Text Taps**: Use `text: "Something", index: N` for duplicate text on screen
4. **Scroll Before Assert**: Always scroll to ensure elements are visible before asserting
5. **Wait for Dialogs**: Use `extendedWaitUntil` with dialog button text (e.g., "Cancel") to verify dialog is shown

### Next Steps

1. **Consider Detox Framework**: For better React Native TextInput support on iOS
2. **Add explicit accessibilityIdentifier**: React Native's testID may need iOS-specific handling
3. **Create test fixtures**: Scripts to ensure consistent test user state (signed in/out)
4. **Add more alert tests**: Cover other crossPlatformAlert migrations
5. **Visual regression testing**: Consider adding screenshot comparisons for login form

### Environment Setup

Create `.env.test` from template:
```bash
cp .env.test.template .env.test
# Edit .env.test with actual test credentials
```

**Note:** `.env.test` is gitignored for security. See `.env.test.template` for required variables.
