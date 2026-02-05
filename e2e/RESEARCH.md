# E2E Testing Research: Expo SDK 54 Compatibility

## Research Date: February 4, 2026

---

## Executive Summary

**Recommendation: Use Maestro for E2E testing instead of Detox**

Expo has officially embraced Maestro as their preferred E2E testing platform. Detox is not officially supported with Expo managed workflow and requires significant configuration to work.

---

## Framework Comparison

### Maestro (Recommended)

| Aspect | Details |
|--------|---------|
| **Expo Support** | First-class support, officially recommended |
| **Setup Complexity** | Low - no special build required |
| **Test Format** | YAML (accessible to non-developers) |
| **Build Requirements** | Works with standard Expo builds |
| **CI/CD Integration** | Native EAS Workflows support |
| **Maintenance** | Low - minimal configuration |
| **Learning Curve** | Low - intuitive YAML syntax |

**Advantages:**
- Works with the same iOS/Android binary created by Expo CLI
- No need for `expo prebuild` or native code generation
- Handles WebViews and native screens seamlessly
- Cloud testing available through Maestro Cloud / EAS
- Adopted by Microsoft, Meta, DoorDash for mobile testing

**Disadvantages:**
- YAML format limits complex test logic
- Less mature than Detox for React Native-specific testing
- Some advanced mocking scenarios may be harder

### Detox

| Aspect | Details |
|--------|---------|
| **Expo Support** | Not officially supported |
| **Setup Complexity** | High - requires native project generation |
| **Test Format** | JavaScript/TypeScript |
| **Build Requirements** | Requires `expo prebuild` |
| **CI/CD Integration** | Manual configuration needed |
| **Maintenance** | High - native dependencies |
| **Learning Curve** | Medium - JavaScript knowledge required |

**Why NOT Detox for Expo:**
- Requires `expo prebuild` to generate native projects
- Doesn't support Expo managed workflow
- Complex Android setup with specialized build requirements
- Wix (Detox maintainer) doesn't plan to support Expo managed workflow
- Higher maintenance burden

---

## Expo Official Guidance

From [Expo E2E Testing Documentation](https://docs.expo.dev/build-reference/e2e-tests/):

> "Run E2E tests on EAS Workflows with Maestro"

Expo's documentation focuses exclusively on Maestro for E2E testing with EAS Workflows.

---

## Setup Requirements

### For Maestro (Recommended)

1. **Local Development:**
   ```bash
   # Install Maestro CLI
   curl -Ls "https://get.maestro.mobile.dev" | bash

   # Verify installation
   maestro --version
   ```

2. **Project Structure:**
   ```
   .maestro/
   ├── config.yaml           # Global configuration
   ├── auth/
   │   ├── sign-in.yaml
   │   ├── sign-out.yaml
   │   └── guest-mode.yaml
   └── alerts/
       ├── race-alerts.yaml
       └── settings-alerts.yaml
   ```

3. **EAS Integration (Optional):**
   - Add `e2e-test` profile to `eas.json`
   - Create workflow files in `.eas/workflows/`

### For Detox (Not Recommended)

Would require:
1. `expo prebuild` to generate native code
2. Native build tooling (Xcode, Android Studio)
3. Platform-specific configuration
4. Specialized test build profiles

---

## Platform Coverage Strategy

| Platform | Framework | Status |
|----------|-----------|--------|
| **iOS** | Maestro | Recommended |
| **Android** | Maestro | Recommended |
| **Web** | Playwright | Already installed |

---

## References

- [Expo E2E Testing Docs](https://docs.expo.dev/build-reference/e2e-tests/)
- [Maestro & Expo Talk](https://gitnation.com/contents/maestro-and-expo-crafting-the-future-of-efficient-e2e-testing)
- [Detox vs Maestro Comparison](https://www.getpanto.ai/blog/detox-vs-maestro)
- [Native E2E Testing with Expo and Maestro](https://medium.com/lingvano/native-e2e-testing-with-maestro-and-expo-14e9e9b0f0fe)
- [Choosing Mobile UI Testing Framework](https://medium.com/@joemcguinness/choosing-a-new-framework-for-mobile-ui-testing-for-react-native-08f1cd3a4042)

---

## Decision

**Use Maestro** for the following reasons:

1. Official Expo recommendation
2. No native build complexity
3. Works with existing Expo workflow
4. Lower maintenance burden
5. Better cross-platform element handling
6. Simpler CI/CD integration with EAS
7. YAML tests are reviewable by non-developers

**Keep Playwright** (already installed) for comprehensive web testing.
