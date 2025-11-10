# Testing Built-In Skills

## Browser Console Check

Open the browser console (F12 or Cmd+Option+I) and look for these logs:

### Expected Logs (Good ✅)
```
🚀 SmartRaceCoach mounted, fetching initial advice
🔍 invokeSkill called with: {skillName: 'starting-line-mastery', skillId: 'skill_builtin_starting_line_mastery'}
✅ Using built-in skill: starting-line-mastery
✅ Built-in advice generated: {primary: '...', details: '...', ...}
```

### Bad Logs (Indicates Problem ❌)
```
⚠️ Not a built-in skill, calling API for: starting-line-mastery
Edge Function error: ...
Skill invocation error: ...
```

## Force Full Reload

The app might be showing cached code. Try these steps in order:

1. **Hard Refresh**:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + F5`

2. **Clear Cache and Reload**:
   - Open DevTools (F12)
   - Right-click the reload button
   - Select "Empty Cache and Hard Reload"

3. **Restart Dev Server**:
   ```bash
   # Kill the current server (Ctrl+C)
   # Then restart:
   npm start
   ```

4. **Check for Console Errors**:
   - Look for any red errors in console
   - Check for warnings about missing dependencies
   - Look for infinite loop warnings

## Verify Changes Applied

Check that SmartRaceCoach.tsx shows:
```typescript
const SKILL_IDS = {
  'starting-line-mastery': 'skill_builtin_starting_line_mastery',
  // ... all should start with 'skill_builtin_'
};
```

## Test Quick Skill Buttons

1. Scroll to the Quick AI Coaching buttons
2. Click "Start Strategy" button
3. Should see an alert popup immediately (no loading)
4. Console should show:
   ```
   🎯 Invoking skill: Start Strategy
   ✅ Got advice: {primary: '...', details: '...'}
   ```

## If Still Broken

If you still see "Unable to get AI advice at this time":

1. Check the EXACT error message in console
2. Share the console logs with me
3. Verify the files were saved (look at file modification times)
4. Try stopping and restarting the dev server completely

## Expected Behavior (Working)

- AI Race Coach panel shows tactical advice immediately
- No "Unable to get AI advice" message
- Quick Skill Buttons show instant popups
- No API errors in console
- No continuous reloading
