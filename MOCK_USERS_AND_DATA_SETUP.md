# Mock Users & Demo Data Setup

## Overview

Complete mock data environment has been created with users, authentication, clubs, fleets, and historical race data to demonstrate the intelligent race suggestion system.

## ✅ Created Mock Users

### User Accounts (All Active)

| Name | Email | Password | Type | Description |
|------|-------|----------|------|-------------|
| **Sarah Chen** | sarah.chen@sailing.com | sailing123 | Sailor | RHKYC member, Dragon & J/70 fleets |
| **Mike Thompson** | mike.thompson@racing.com | sailing123 | Sailor | SFYC admin, Dragon & 420 fleets |
| **Emma Wilson** | emma.wilson@yacht.club | sailing123 | Sailor | RSYS member, Laser & Optimist |
| **James Rodriguez** | james.rodriguez@fleet.com | sailing123 | Sailor | MYC & RHKYC member, J/70 |
| **Coach Anderson** | coach.anderson@sailing.com | sailing123 | Coach | Multi-club coach |

### User Profiles & Characteristics

**Sarah Chen (RHKYC, Dragon/J70)**
- Home Port: Hong Kong
- Sailing Since: 2015
- Skill Level: Advanced
- Preferred Classes: Dragon, J/70
- **Race History**: 8+ races including annual Spring Dragon Championships
- **Pattern**: Spring championship in April (3 years running)
- **Suggestions Expected**: Club events from RHKYC, Fleet races from Dragon/J70

**Mike Thompson (SFYC, Dragon/420)**
- Home Port: San Francisco
- Sailing Since: 2010
- Skill Level: Expert
- Preferred Classes: Laser, 420
- **Race History**: 6+ races including Bay Challenge Regattas
- **Pattern**: Bay Challenge in June (2 years running)
- **Suggestions Expected**: SFYC events, Dragon fleet races

**Emma Wilson (RSYS, Laser/Opti)**
- Home Port: Sydney
- Sailing Since: 2018
- Skill Level: Intermediate
- Preferred Classes: Optimist, Laser
- **Race History**: 6+ Laser club races
- **Pattern**: Regular Laser racing at Sydney Harbour
- **Suggestions Expected**: RSYS events, Laser fleet races

**James Rodriguez (MYC, J70)**
- Home Port: Miami
- Sailing Since: 2012
- Skill Level: Advanced
- Preferred Classes: Dragon, J/70
- **Race History**: Limited (newer user)
- **Suggestions Expected**: MYC events, J/70 fleet races

**Coach Anderson (Multi-club)**
- Coaching Since: 2005
- Specialties: Race tactics, Boat speed, Starts
- **Club Roles**: Coach at SFYC and RHKYC
- **Suggestions Expected**: All club events from assigned clubs

## 🏛️ Mock Clubs Created

### 1. Royal Hong Kong Yacht Club (RHKYC)
- **Slug**: `rhkyc`
- **Location**: Hong Kong (22.2793°, 114.1628°)
- **Established**: 1849
- **Members**: 2,500
- **Website**: https://rhkyc.org.hk
- **Facilities**: Marina, Race Office, Training Center, Restaurant
- **Classes**: Dragon, J/70, Laser, Optimist

**Fleets:**
- RHKYC Dragon Fleet (`rhkyc-dragon`)
- RHKYC J/70 Fleet (`rhkyc-j70`)
- RHKYC Laser Fleet (`rhkyc-laser`)

### 2. San Francisco Yacht Club (SFYC)
- **Slug**: `sfyc`
- **Location**: San Francisco, CA (37.8651°, -122.4822°)
- **Established**: 1869
- **Members**: 1,800
- **Website**: https://sfyc.org
- **Facilities**: Full Service Marina, Racing Program, Junior Sailing
- **Classes**: Dragon, J/70, Laser, 420

**Fleets:**
- SFYC Dragon Fleet (`sfyc-dragon`)
- SFYC 420 Fleet (`sfyc-420`)

### 3. Royal Sydney Yacht Squadron (RSYS)
- **Slug**: `rsys`
- **Location**: Sydney, Australia (-33.8523°, 151.2402°)
- **Established**: 1862
- **Members**: 2,000
- **Website**: https://rsys.com.au
- **Facilities**: Marina Berths, Sailing School, Race Management
- **Classes**: Laser, Optimist, 420, Dragon

**Fleets:**
- RSYS Laser Fleet (`rsys-laser`)
- RSYS Optimist Fleet (`rsys-optimist`)

### 4. Miami Yacht Club (MYC)
- **Slug**: `myc`
- **Location**: Miami, FL (25.7617°, -80.1918°)
- **Established**: 1900
- **Members**: 1,500
- **Website**: https://miamiyachtclub.org
- **Facilities**: Wet Slips, Race Committee, Youth Program
- **Classes**: J/70, Laser, Optimist

**Fleets:**
- Miami J/70 Fleet (`myc-j70`)

## 📋 Upcoming Club Events

### RHKYC Events
1. **Spring Dragon Championship 2025**
   - Type: Regatta
   - Date: 1 month from now
   - Location: Victoria Harbour
   - Classes: Dragon
   - Status: Registration Open
   - Fee: $500

2. **J/70 Winter Series - Race 3**
   - Type: Race Series
   - Date: 2 weeks from now
   - Location: Hong Kong Waters
   - Classes: J/70
   - Status: Published

### SFYC Events
3. **Bay Challenge Regatta**
   - Type: Regatta
   - Date: 2 months from now
   - Location: San Francisco Bay
   - Classes: Dragon, J/70, Laser
   - Status: Published
   - Fee: $350

### RSYS Events
4. **Sydney Harbour Sprint Series**
   - Type: Race Series
   - Date: 1.5 months from now
   - Location: Sydney Harbour
   - Classes: Laser
   - Status: Registration Open

### MYC Events
5. **Miami J/70 Midwinters**
   - Type: Regatta
   - Date: 3 months from now
   - Location: Biscayne Bay
   - Classes: J/70
   - Status: Published
   - Fee: $450

## 🔄 How to Use

### Quick Login (Login Page)

The login page (`app/(auth)/login.tsx`) has been updated with quick-login buttons for all mock users:

```
Sarah Chen (RHKYC, Dragon/J70)     →  sarah.chen@sailing.com / sailing123
Mike Thompson (SFYC, Dragon/420)   →  mike.thompson@racing.com / sailing123
Emma Wilson (RSYS, Laser/Opti)     →  emma.wilson@yacht.club / sailing123
James Rodriguez (MYC, J70)         →  james.rodriguez@fleet.com / sailing123
Coach Anderson (Multi-club)        →  coach.anderson@sailing.com / sailing123
```

### Testing Suggestions

**Recommended Test Flow:**

1. **Login as Sarah Chen**
   - Navigate to Add Race screen
   - **Expected Suggestions**:
     - ✅ "Spring Dragon Championship 2025" (Club event from RHKYC)
     - ✅ "J/70 Winter Series" (Club event from RHKYC)
     - ✅ "Spring Dragon Championship" (Pattern match - April every year)
     - ✅ "J/70 Club Race" (Template from race history)

2. **Login as Mike Thompson**
   - Navigate to Add Race screen
   - **Expected Suggestions**:
     - ✅ "Bay Challenge Regatta" (Club event from SFYC)
     - ✅ "Bay Challenge Regatta" (Pattern match - June every year)
     - ✅ Fleet races from SFYC Dragon fleet

3. **Login as Emma Wilson**
   - Navigate to Add Race screen
   - **Expected Suggestions**:
     - ✅ "Sydney Harbour Sprint Series" (Club event from RSYS)
     - ✅ "Laser Club Race" (Template from frequent racing)
     - ✅ Venue preference: Sydney Harbour

## 🔧 Scripts Created

### 1. Complete Demo Data Script
**File**: `scripts/seed-complete-demo-data.mjs`

Creates:
- 5 users with auth
- 4 yacht clubs
- 8 fleets
- Club/fleet memberships
- Upcoming events
- Historical races

**Run:**
```bash
node scripts/seed-complete-demo-data.mjs
```

### 2. Simple Users Script
**File**: `scripts/seed-demo-users-simple.mjs`

Creates:
- 5 users with auth
- 20 historical races for pattern detection

**Run:**
```bash
node scripts/seed-demo-users-simple.mjs
```

## 📊 Data Breakdown

### Historical Races Created

**Sarah Chen**: 8 races
- 3x Spring Dragon Championship (2022, 2023, 2024)
- 5x J/70 Club Race (various dates)

**Mike Thompson**: 6 races
- 2x Bay Challenge Regatta (2023, 2024)
- 4x 420 Race Day (various dates)

**Emma Wilson**: 6 races
- 6x Laser Club Race (various dates)

**Total**: 20 historical races across 3 users

### Patterns That Will Be Detected

1. **Seasonal Pattern** (Sarah Chen)
   - "Spring Dragon Championship" every April
   - Confidence: ~0.95 (3 occurrences)

2. **Temporal Annual** (Mike Thompson)
   - "Bay Challenge Regatta" every June
   - Confidence: 0.70 (2 occurrences)

3. **Venue Preference** (Sarah Chen)
   - "Hong Kong Waters" (5 races)
   - Confidence: 0.50

4. **Class Preference** (Sarah Chen)
   - Dragon class (3 races)
   - Confidence: 0.375

5. **Venue Preference** (Emma Wilson)
   - "Sydney Harbour" (6 races)
   - Confidence: 0.60

6. **Class Preference** (Emma Wilson)
   - Laser class (6 races)
   - Confidence: 0.75

## 🚀 Generating Suggestions

### Manual Trigger

To pre-compute suggestions for all users:

```bash
npx supabase functions invoke refresh-race-suggestions
```

This will:
1. Find all active users (5 mock users)
2. Generate club race suggestions
3. Generate fleet race suggestions
4. Detect and generate pattern-based suggestions
5. Cache results for 24 hours

### Expected Results

```
Processing user: sarah-chen-id
✓ Generated 4 club suggestions
✓ Generated 3 fleet suggestions
✓ Generated 3 pattern suggestions
Total: 10 suggestions

Processing user: mike-thompson-id
✓ Generated 2 club suggestions
✓ Generated 2 fleet suggestions
✓ Generated 2 pattern suggestions
Total: 6 suggestions

...and so on
```

### Auto-Refresh

Suggestions automatically refresh:
- When cache expires (24 hours)
- When user opens Add Race screen
- When background cron job runs (if configured)

## 🧪 Testing Scenarios

### Scenario 1: Club Event Suggestion
1. Login as Sarah Chen
2. Go to Add Race
3. Click "From Your Clubs" section
4. Should see "Spring Dragon Championship 2025"
5. Click "Add to Calendar"
6. Form auto-fills with event details

### Scenario 2: Pattern Match Suggestion
1. Login as Mike Thompson
2. Go to Add Race
3. Click "Based on Your History" section
4. Should see "Bay Challenge Regatta" (June pattern)
5. Reason: "You typically race 'Bay Challenge Regatta' in June"

### Scenario 3: Template Suggestion
1. Login as Emma Wilson
2. Go to Add Race
3. Click "Your Common Races" section
4. Should see "Laser Club Race" template
5. Reason: "You've used this template 6 times"

### Scenario 4: Dismiss Suggestion
1. Login as any user
2. See a suggestion
3. Click ❌ dismiss button
4. Suggestion disappears
5. Feedback recorded in database
6. Won't see that suggestion again

## 📈 Monitoring & Analytics

### Check Cached Suggestions

```sql
SELECT
  user_id,
  suggestion_type,
  race_data->>'raceName' AS race_name,
  confidence_score,
  suggestion_reason
FROM race_suggestions_cache
WHERE expires_at > NOW()
ORDER BY user_id, confidence_score DESC;
```

### View Detected Patterns

```sql
SELECT
  pattern_type,
  pattern_data,
  confidence,
  occurrence_count
FROM race_patterns
WHERE user_id = '[sarah-chen-id]';
```

### Track User Feedback

```sql
SELECT
  action,
  suggestion_type,
  COUNT(*)
FROM suggestion_feedback
GROUP BY action, suggestion_type;
```

## 🔐 Security Notes

- All users have RLS policies applied
- Users can only see their own suggestions
- Club/fleet memberships enforce access control
- Service role key required for seed scripts
- Passwords are hashed in Supabase Auth

## 📚 Related Documentation

- **Full Implementation**: `RACE_SUGGESTIONS_IMPLEMENTATION.md`
- **Quick Start Guide**: `docs/RACE_SUGGESTIONS_QUICKSTART.md`
- **Service Code**: `services/RaceSuggestionService.ts`
- **UI Component**: `components/races/RaceSuggestionsDrawer.tsx`
- **Hook**: `hooks/useRaceSuggestions.ts`

## 🐛 Troubleshooting

**Problem**: No suggestions showing

**Solutions**:
1. Check if user is logged in correctly
2. Run: `npx supabase functions invoke refresh-race-suggestions`
3. Verify cache hasn't expired
4. Check browser console for errors

**Problem**: Login not working

**Solutions**:
1. Verify email/password exactly as listed above
2. Check Supabase Auth logs in dashboard
3. Re-run seed script if needed

**Problem**: Patterns not detecting

**Solutions**:
1. Ensure user has 3+ races in history
2. Check `regattas` table for historical data
3. Patterns require minimum occurrence count

## ✅ Verification Checklist

- [x] 5 mock users created with authentication
- [x] Users can login via login page
- [x] Quick-login buttons updated with new users
- [x] Historical races created for pattern detection
- [x] Race suggestion service deployed
- [x] Background refresh function deployed
- [x] Login page shows user descriptions
- [x] All passwords set to `sailing123`

---

**Last Updated**: November 6, 2025
**Total Mock Users**: 5
**Total Historical Races**: 20
**Total Upcoming Events**: 5 (when clubs created)
**Ready for Demo**: ✅ YES
