# How to See Fleet Insights Working

## The Issue
You're currently viewing **"Corinthian 3 & 4"** which only has Demo Sailor's sessions.

Fleet Insights will only show fleet members for **"Phyloong 5 & 6"** where all 5 sailors have data.

## Steps to Fix

### 1. Navigate to Phyloong 5 & 6 Race

In the app (http://localhost:8081/races):

1. Look at the race list on the left side
2. **Scroll down** to find **"Phyloong 5 & 6"**
3. **Click on it** to select that race
4. The race details will load on the right

### 2. Open Fleet Insights

1. **Scroll down** in the right panel to find "Post-Race Analysis" section
2. It should auto-expand since you have race data
3. Click the **"Fleet Insights"** button/tab

### 3. Verify It Works

You should now see **5 fleet members**:

```
Fleet Insights
├── Demo Sailor (You)
│   ✅ GPS track  📝 Has notes
│   Updated: 11/6/2025
│
├── Sarah Chen
│   ✅ GPS track  📝 Has notes
│   Updated: [date]
│
├── Marcus Thompson
│   ✅ GPS track  📝 Has notes
│   Updated: [date]
│
├── Emma Rodriguez
│   ✅ GPS track  📝 Has notes
│   Updated: [date]
│
└── James Wilson
    ✅ GPS track  📝 Has notes
    Updated: [date]
```

## Data Breakdown by Race

| Race | Demo Sailor Sessions | Fleet Member Sessions | Total Sailors |
|------|---------------------|---------------------|---------------|
| **Phyloong 5 & 6** | ✅ 1 | ✅ 12 | **5** ← USE THIS |
| Corinthian 3 & 4 | ✅ 2 | ❌ 0 | 1 |
| 1 | ✅ 1 | ❌ 0 | 1 |

## Still Not Working?

If Fleet Insights still shows "Unable to load", check the browser console for errors:

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for messages starting with `[FleetPostRaceInsights]`
4. Share the error messages

## Expected Console Logs

When working correctly, you should see:

```
[FleetPostRaceInsights] 🔍 Querying race_timer_sessions for regatta_id: 758d5a82-d6ce-40d7-b6a8-fb98d2c82f2d
[FleetPostRaceInsights] 📊 Found 13 race sessions
[FleetPostRaceInsights] 🔍 Querying sailor_profiles for 5 sailors
[FleetPostRaceInsights] ✅ Loaded 5 sailor profiles
```

## Alternative: Test with Fleet Member Account

If you want to verify it works immediately:

1. Logout from Demo Sailor
2. Login as **Sarah Chen**: `sarah.chen@demo.regattaflow.com` / `sailing123`
3. Navigate to "Phyloong 5 & 6" (will be in her race list)
4. Fleet Insights will show all 5 sailors including "Demo Sailor"
