# E2E Testing with Maestro

This directory contains end-to-end tests for RegattaFlow using [Maestro](https://maestro.mobile.dev/).

## Why Maestro?

After researching E2E testing options for Expo SDK 54, we chose Maestro over Detox for the following reasons:

1. **Official Expo Recommendation** - Expo's documentation focuses on Maestro for E2E testing
2. **No Native Build Complexity** - Works with standard Expo builds without `expo prebuild`
3. **Lower Maintenance Burden** - YAML-based tests are simpler to maintain
4. **Better Cross-Platform Handling** - Seamless handling of native and web elements
5. **EAS Workflows Integration** - Native support for CI/CD with Expo Application Services

See [RESEARCH.md](./RESEARCH.md) for the full framework comparison.

## Prerequisites

### Install Maestro CLI

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

After installation, add Maestro to your PATH:
```bash
export PATH="$PATH":"$HOME/.maestro/bin"
```

Verify installation:
```bash
maestro --version
```

### For iOS Testing

1. Xcode with iOS Simulator
2. Build the app for simulator:
   ```bash
   npx expo run:ios --configuration Release
   ```

### For Android Testing

1. Android Studio with emulator
2. Build the app:
   ```bash
   npx expo run:android --variant release
   ```

## Directory Structure

```
.maestro/
├── config.yaml           # Global Maestro configuration
├── auth/                 # Authentication flow tests
│   ├── sign-in.yaml     # Email/password login
│   ├── sign-out.yaml    # Sign out with confirmation
│   └── guest-mode.yaml  # Guest mode entry
├── races/               # Race management tests
│   ├── delete-race-alert.yaml
│   └── hide-race-alert.yaml
└── settings/            # Settings/preferences tests
    └── reset-onboarding-alert.yaml
```

## Running Tests

### Run All Tests
```bash
maestro test .maestro/
```

### Run Specific Test
```bash
maestro test .maestro/auth/sign-out.yaml
```

### Run Tests by Tag
```bash
maestro test .maestro/ --include-tags=auth
maestro test .maestro/ --include-tags=alert
maestro test .maestro/ --include-tags=critical
```

### Run with Verbose Output
```bash
maestro test .maestro/ --debug-output
```

### Run Against a Specific Device
```bash
# iOS Simulator
maestro test .maestro/ --device "iPhone 15 Pro"

# Android Emulator
maestro test .maestro/ --device "emulator-5554"
```

## Test Accounts

| User | Email | Password | Type |
|------|-------|----------|------|
| Demo Sailor | demo-sailor@regattaflow.app | Demo123! | Sailor |
| Demo Club | demo-club@regattaflow.io | Demo123! | Club |

## Writing Tests

Maestro uses YAML for test definitions. Here's a basic example:

```yaml
appId: io.regattaflow.app
tags:
  - smoke
---
- launchApp
- tapOn:
    id: "my-button-testid"
- assertVisible: "Expected Text"
```

### Key Commands

| Command | Description |
|---------|-------------|
| `launchApp` | Launch the app (optional: `clearState: true`) |
| `tapOn` | Tap an element by `id`, `text`, or index |
| `inputText` | Type text into focused input |
| `assertVisible` | Assert element is visible |
| `scroll` | Scroll in a direction |
| `extendedWaitUntil` | Wait for condition with timeout |

### Using testID Props

Add `testID` props to React Native components for reliable element selection:

```tsx
<TouchableOpacity testID="submit-button">
  <Text>Submit</Text>
</TouchableOpacity>
```

Then reference in Maestro:
```yaml
- tapOn:
    id: "submit-button"
```

## CI/CD Integration

### EAS Workflows

Add to `.eas/workflows/e2e.yaml`:

```yaml
name: E2E Tests
on:
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Run E2E Tests
        run: maestro test .maestro/
```

### GitHub Actions

```yaml
- name: Install Maestro
  run: |
    curl -Ls "https://get.maestro.mobile.dev" | bash
    export PATH="$PATH":"$HOME/.maestro/bin"

- name: Run E2E Tests
  run: maestro test .maestro/ --include-tags=critical
```

## Debugging

### View Test Results
```bash
maestro test .maestro/ --format junit --output results.xml
```

### Record Test Run
```bash
maestro record .maestro/auth/sign-in.yaml
```

### Interactive Mode (Maestro Studio)
```bash
maestro studio
```

## Web Testing

For web E2E tests, we use **Playwright** (already installed). Web tests are in the `e2e/` directory.

```bash
# Run Playwright tests
npm run test:e2e:web
```

## Troubleshooting

### "No connected devices"
Ensure the iOS Simulator or Android emulator is running:
```bash
# iOS
open -a Simulator

# Android
emulator -avd Pixel_6_API_33
```

### "App not installed"
Build and install the app first:
```bash
npx expo run:ios
# or
npx expo run:android
```

### Tests failing on CI
Ensure the workflow has simulator/emulator available and uses correct device names.

## Related Documentation

- [Maestro Docs](https://maestro.mobile.dev/getting-started/installing-maestro)
- [Expo E2E Testing](https://docs.expo.dev/build-reference/e2e-tests/)
- [EAS Workflows](https://docs.expo.dev/build/eas-workflows/)
