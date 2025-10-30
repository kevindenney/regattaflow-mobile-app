# Expo AV to Expo Audio Migration Plan

## Overview
`expo-av` is deprecated and will be removed in SDK 54. This is **not urgent** - the app will continue working normally, but the migration should be completed before upgrading to SDK 54.

**Current status:** Warnings appearing in console but no functional impact on app performance or stability.

## Current Usage

### Files Using expo-av:
1. **services/ai/VoiceNoteService.ts** - Audio recording for voice notes
2. **services/voiceCommandService.ts** - Microphone permissions
3. **app/club/race/control/[id].tsx** - Audio functionality

### Current expo-av APIs Used:
- `Audio.requestPermissionsAsync()` - Request microphone permissions
- `Audio.setAudioModeAsync()` - Configure audio mode for recording
- `Audio.Recording` - Recording class
- `Audio.RecordingOptions` - Recording configuration
- Recording constants (formats, encoders, quality settings)

## Migration Steps

### 1. Install expo-audio
```bash
npx expo install expo-audio
```

### 2. Update VoiceNoteService.ts
Replace:
- `import { Audio } from 'expo-av'` → `import { AudioRecorder, AudioPermissions } from 'expo-audio'`
- `Audio.requestPermissionsAsync()` → `AudioPermissions.requestPermissionsAsync()`
- `Audio.setAudioModeAsync()` → Update to new expo-audio API
- `Audio.Recording` → `AudioRecorder`
- Recording options → Update to new format

### 3. Update voiceCommandService.ts
- Replace `Audio.requestPermissionsAsync()` with expo-audio equivalent

### 4. Update app/club/race/control/[id].tsx
- Review and update Audio usage

### 5. Remove expo-av
```bash
npm uninstall expo-av
```

### 6. Testing Checklist
- [ ] Voice note recording works on iOS
- [ ] Voice note recording works on Android
- [ ] Voice note recording works on web
- [ ] Voice commands work
- [ ] Microphone permissions prompt correctly
- [ ] Audio quality is maintained
- [ ] No console warnings about expo-av

## Reference
- [Expo Audio Docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo AV Migration Guide](https://docs.expo.dev/versions/latest/sdk/av/)

## Timeline
**Target Completion:** Before SDK 54 upgrade

## Temporary Solution
The expo-av deprecation warning has been suppressed in `app/_layout.tsx` to avoid console noise during development.
