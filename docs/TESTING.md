# Testing Guide

This document covers testing practices and utilities for the RegattaFlow app.

## Maestro UI Tests

[Maestro](https://maestro.mobile.dev/) is used for UI testing. Test files are in `.maestro/` directory.

### Running Tests

```bash
# Run all tests
maestro test .maestro/

# Run a specific test
maestro test .maestro/auth/sign-in.yaml

# Run with debug output
maestro test --debug-output .maestro/auth/sign-in.yaml
```

### Test Configuration

Tests are configured in `.maestro/config.yaml`:

- **appId**: `com.regattaflow.app`
- **Default timeouts**:
  - General: 10s
  - App launch: 30s
  - Element wait: 5s

### Test Credentials

| User | Email | Password |
|------|-------|----------|
| Demo Sailor | demo-sailor@regattaflow.app | Demo123! |

## Test Data Cleanup

After running Maestro tests, test posts may be left in the database. Use the cleanup script to remove them.

### Cleanup Script

The `scripts/cleanup-test-posts.mjs` script removes test posts from Supabase.

```bash
# Run cleanup
node scripts/cleanup-test-posts.mjs
```

This script removes all posts where the title contains:
- `[MAESTRO-TEST]`
- `[MAESTRO-OUTCOMES]`

### When to Run Cleanup

- After completing a Maestro test session
- Before deploying to production
- If you notice test data appearing in the app

### Naming Convention for Test Data

When writing Maestro tests that create data, prefix the title with a test marker:
- Use `[MAESTRO-TEST]` for general test data
- Use `[MAESTRO-OUTCOMES]` for outcome verification tests

This ensures the cleanup script can identify and remove test data.

## Writing New Tests

### File Structure

```
.maestro/
├── auth/           # Authentication flows
├── races/          # Race-related flows
├── settings/       # Settings-related flows
└── config.yaml     # Global configuration
```

### Best Practices

1. **Use meaningful test names**: Name files to describe what they test
2. **Mark test data**: Always prefix test-created content with `[MAESTRO-TEST]`
3. **Clean up after tests**: Run the cleanup script after test sessions
4. **Handle flakiness**: Add appropriate waits for async operations

### Handling Flaky Tests

If tests fail intermittently:

1. Add longer waits after navigation: `- waitForAnimationToEnd`
2. Use retries for element detection:
   ```yaml
   - assertVisible:
       id: "element-id"
       retryTapIfNoChange: true
   ```
3. Increase element timeout in config.yaml if needed

## Troubleshooting

### Test can't find element

1. Check if the app is in the expected state
2. Verify element IDs match (use `maestro hierarchy` to inspect)
3. Add a wait before the assertion

### Tests timeout on app launch

1. Reset the simulator: `xcrun simctl shutdown all && xcrun simctl erase all`
2. Increase launch timeout in config.yaml
3. Make sure the app is built and installed

### Test data persisting after tests

Run the cleanup script:
```bash
node scripts/cleanup-test-posts.mjs
```
