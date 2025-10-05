# Voice Commands Testing Guide

## Overview

RegattaFlow's voice command system enables hands-free operation during races. This guide covers testing procedures including wind noise simulation.

## Voice Command Features

### Supported Commands

1. **Tactical Maneuvers**
   - "Mark tack" → Log tack with timestamp
   - "Mark gybe" / "Mark jibe" → Log gybe with timestamp
   - "Rounding mark [1-5/windward/leeward]" → Log mark rounding

2. **Voice Notes**
   - "Note [message]" → Save voice note with GPS coordinates
   - Examples:
     - "Note wind shift to the right"
     - "Save current is stronger on left side"

3. **Information Display**
   - "Show wind" → Display wind forecast
   - "Show tide" / "Show current" → Display current information
   - "Show strategy" → Expand strategy card
   - "Show position" → Display current GPS coordinates

4. **Timer Controls**
   - "Start timer" → Begin countdown (defaults to 5 minutes)
   - "Stop timer" / "Pause timer" → Pause countdown
   - "Reset timer" → Reset to 5 minutes

5. **Race Incidents**
   - "Protest [red/blue/green/yellow/white/black] boat" → Flag protest incident
   - "Mark foul" / "Log foul" → Log foul incident

6. **Equipment Changes**
   - "Change to [jib/spinnaker/genoa/code zero]" → Log sail change

7. **System Commands**
   - "Help" / "What can I say" → Show available commands
   - "Cancel" / "Stop" → Cancel current operation

### Wake Phrase (Optional)
- "Hey RegattaFlow" → Activate voice listening
- Currently disabled for faster access during racing

## Testing Procedures

### Basic Testing (Quiet Environment)

1. **Setup**
   ```bash
   npx expo start --ios  # or --android
   ```

2. **Navigate to Tactical Screen**
   - Create or select a race
   - Open tactical race view
   - Grant microphone permissions when prompted

3. **Test Basic Commands**
   - Tap microphone button (🎤) in conditions bar
   - Wait for "Listening for command..." indicator
   - Speak clearly: "Mark tack"
   - Verify:
     - ✅ Tack event logged on map
     - ✅ Timestamp recorded
     - ✅ Success feedback (visual/haptic)

4. **Test Voice Notes**
   - Tap microphone button
   - Say: "Note wind shift to the right"
   - Verify:
     - ✅ Voice note saved with GPS coordinates
     - ✅ Transcription displayed for 5 seconds
     - ✅ Note appears in events list

### Noise Simulation Testing

Real-world sailing conditions include significant wind noise, water splashing, and sail flapping. Test voice commands under simulated conditions.

#### Method 1: Simulated Wind Noise (Desktop)

1. **Play Wind Noise**
   - Open: https://www.youtube.com/watch?v=0PEa8JlwcVI (Ocean Wind Sounds)
   - Set volume to 60-70% to simulate 15-20 knot winds

2. **Position Device**
   - Place phone 12-18 inches from speaker
   - Simulate typical racing position (helm's pocket, neck lanyard)

3. **Test Commands**
   - Speak at normal sailing volume (louder than conversation)
   - Test all command categories
   - Document:
     - ✅ Commands that work reliably
     - ❌ Commands that fail or misinterpret
     - 🔄 Commands requiring repetition

#### Method 2: Real Environment Testing

**On-Water Testing:**
1. Take device sailing (protected waterproof case)
2. Test at different wind speeds:
   - Light air (5-8 knots)
   - Moderate (10-15 knots)
   - Fresh (18-25 knots)
3. Test at different points of sail:
   - Upwind (more focused, easier)
   - Reaching (moderate)
   - Downwind (noisier, harder)

**Driving Simulation:**
1. Mount device in car
2. Drive with windows down at 15-25 mph
3. Test voice commands with wind noise through windows

### Offline Mode Testing

1. **Enable Airplane Mode**
   ```
   Device Settings → Airplane Mode ON
   ```

2. **Use Voice Commands**
   - Commands execute locally
   - Queued for sync when online
   - Badge shows queued count (🎤 with number)

3. **Return Online**
   - Disable Airplane Mode
   - Tap "⏫ SYNC X OFFLINE" button
   - Verify all queued commands processed

4. **Test Scenarios**
   - ✅ Mark tack while offline → Syncs later
   - ✅ Save voice note offline → Uploads when online
   - ✅ Log protest offline → Syncs with server

### Error Handling Testing

1. **Microphone Permission Denied**
   - Expected: Alert with permission request
   - User must grant in Settings

2. **No GPS Signal**
   - Commands requiring location show error
   - Information commands still work

3. **Misheard Commands**
   - System should ignore unrecognized speech
   - No false positives

4. **Background Noise**
   - Test with music, conversation, engine noise
   - Document false activation rate

## Performance Benchmarks

### Target Metrics

- **Activation Time**: < 500ms from button tap to listening
- **Recognition Time**: < 1.5s from speech end to action
- **Accuracy (Quiet)**: > 95% correct command recognition
- **Accuracy (Moderate Wind)**: > 80% correct recognition
- **Accuracy (Heavy Wind)**: > 60% correct recognition
- **Battery Impact**: < 5% per hour of active listening

### Measuring Performance

1. **Command Response Time**
   ```javascript
   const start = Date.now();
   // Speak command
   // Wait for action
   const elapsed = Date.now() - start;
   console.log(`Response time: ${elapsed}ms`);
   ```

2. **Recognition Accuracy**
   - Test 20 commands per category
   - Calculate success rate: (successful / total) × 100
   - Document misrecognitions

## Known Limitations

1. **Language Support**
   - Currently English (US) only
   - Regional accents may affect accuracy

2. **Wind Noise Threshold**
   - Commands may fail in 30+ knot winds
   - Recommend manual buttons in extreme conditions

3. **Offline Limitations**
   - Voice transcription requires internet
   - Command patterns work offline
   - Sync required for cloud storage

4. **Device Position**
   - Best results: Device within 6-12 inches of mouth
   - Mounted devices may have lower accuracy
   - Waterproof cases can muffle microphone

## Troubleshooting

### "No microphone permission"
**Solution:** Settings → RegattaFlow → Microphone → Enable

### "Commands not recognized"
**Causes:**
- Speaking too quietly
- Too much background noise
- Incorrect command phrasing

**Solutions:**
- Speak louder and clearer
- Move to quieter location
- Use exact command phrases from list
- Tap "Help" for command reference

### "Offline commands not syncing"
**Solution:**
1. Verify internet connection
2. Check network indicator in app
3. Manually tap "⏫ SYNC X OFFLINE" button

### "Battery drains quickly"
**Solution:**
- Voice recognition is battery-intensive
- Use sparingly during long races
- Disable when not actively needed

## Best Practices for Racing

1. **Pre-Race Setup**
   - Test voice commands before starting
   - Verify microphone works
   - Practice 2-3 commands

2. **During Race**
   - Keep device accessible (pocket/lanyard)
   - Speak clearly at sailing volume
   - Use manual buttons as backup

3. **Critical Moments**
   - Start sequence: Use timer controls
   - Mark roundings: Use voice or buttons
   - Protests: Voice for quick logging

4. **Post-Race**
   - Review voice notes and transcriptions
   - Sync offline commands if needed
   - Check GPS track accuracy

## Accessibility Notes

Voice commands improve accessibility for sailors with:
- Limited hand mobility during racing
- Visual impairments (audio feedback)
- Multi-tasking needs (helm + tactics)

## Audio Feedback Setup (TODO)

Currently using visual feedback. To add audio:

1. **Create Audio Files**
   ```
   assets/sounds/voice-activated.mp3  (Brief beep)
   assets/sounds/voice-success.mp3    (Confirmation tone)
   assets/sounds/voice-error.mp3      (Error tone)
   ```

2. **Recommended Audio**
   - Short (< 500ms)
   - Distinct tones for each type
   - Audible in wind (1000-2000 Hz range)
   - Not annoying during repeated use

3. **Update Service**
   - Uncomment audio playback in `voiceCommandService.ts`
   - Test audio levels in noisy environments

## Future Enhancements

- [ ] Multi-language support
- [ ] Custom command training
- [ ] Noise cancellation improvements
- [ ] Offline voice transcription
- [ ] Wake word customization
- [ ] Command shortcuts/macros
- [ ] Voice-to-text race notes
- [ ] Coach communication integration

## Testing Checklist

Before release:
- [ ] Test all 20+ command patterns
- [ ] Verify offline queueing works
- [ ] Test with simulated wind noise
- [ ] Verify GPS tagging accuracy
- [ ] Test battery impact (1 hour session)
- [ ] Verify permission handling
- [ ] Test on iOS and Android
- [ ] Document false positive rate
- [ ] Test with waterproof cases
- [ ] Verify sync after offline use

---

**Last Updated:** 2025-10-03
**Version:** 1.0.0
**Platform:** iOS, Android (Expo)
