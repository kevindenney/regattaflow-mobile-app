# Clubs & Fleets Setup - Current Status

**Date**: November 6, 2025
**Status**: ✅ **Clubs Fully Working** | ⚠️ **Fleets Need Manual Fix**

---

## ✅ What's Working

### 1. Clubs (4 created)
- ✅ **Royal Hong Kong Yacht Club (RHKYC)**
- ✅ **San Francisco Yacht Club (SFYC)**
- ✅ **Royal Sydney Yacht Squadron (RSYS)**
- ✅ **Miami Yacht Club (MYC)**

### 2. Club Memberships (All users connected)
- ✅ Sarah Chen → RHKYC (member)
- ✅ Mike Thompson → SFYC (admin)
- ✅ Emma Wilson → RSYS (member)
- ✅ James Rodriguez → MYC + RHKYC (member)
- ✅ Coach Anderson → SFYC + RHKYC (member)

### 3. Upcoming Club Events (5 created)

#### RHKYC Events
1. **Spring Dragon Championship 2025**
   - Date: ~1 month from now
   - Type: Regatta
   - Class: Dragon
   - Fee: 500 HKD
   - Status: Registration Open

2. **J/70 Winter Series - Race 3**
   - Date: ~2 weeks from now
   - Type: Race Series
   - Class: J/70
   - Status: Published

#### SFYC Events
3. **Bay Challenge Regatta**
   - Date: ~2 months from now
   - Type: Regatta
   - Classes: Dragon, J/70, Laser
   - Fee: 350 USD
   - Status: Published

#### RSYS Events
4. **Sydney Harbour Sprint Series**
   - Date: ~1.5 months from now
   - Type: Race Series
   - Class: Laser
   - Status: Registration Open

#### MYC Events
5. **Miami J/70 Midwinters**
   - Date: ~3 months from now
   - Type: Regatta
   - Class: J/70
   - Fee: 450 USD
   - Status: Published

---

## ⚠️ Known Issue: Fleets Foreign Key

### Problem
The `fleets` table has an **incorrect foreign key constraint**:
- Current: `fleets.club_id` → `users.id` ❌
- Should be: `fleets.club_id` → `clubs.id` ✅

This prevents fleet creation and needs to be fixed manually.

### Manual Fix Required

**Run this SQL in Supabase Dashboard → SQL Editor:**

```sql
-- Drop the incorrect foreign key constraint
ALTER TABLE public.fleets
  DROP CONSTRAINT IF EXISTS fleets_club_id_fkey;

-- Add the correct foreign key constraint pointing to clubs table
ALTER TABLE public.fleets
  ADD CONSTRAINT fleets_club_id_fkey
  FOREIGN KEY (club_id)
  REFERENCES public.clubs(id)
  ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fleets_club_id ON public.fleets(club_id);
```

### After Fix: Run Fleet Seed

Once the foreign key is fixed, run:

```bash
node scripts/seed-complete-clubs-and-fleets.mjs
```

This will create 8 fleets:
- RHKYC Dragon Fleet
- RHKYC J/70 Fleet
- RHKYC Laser Fleet
- SFYC Dragon Fleet
- SFYC 420 Fleet
- RSYS Laser Fleet
- RSYS Optimist Fleet
- Miami J/70 Fleet

---

## 🧪 Testing the Current Setup

### Without Fleets (Current State)

1. **Login as Sarah Chen**
   - Email: `sarah.chen@sailing.com`
   - Password: `sailing123`

2. **Go to Add Race Screen**

3. **Expected Club Suggestions**:
   - ✅ "Spring Dragon Championship 2025" from RHKYC
   - ✅ "J/70 Winter Series - Race 3" from RHKYC

4. **Expected Pattern Suggestions**:
   - ✅ "Spring Dragon Championship" (April pattern - 3 years)
   - ✅ "J/70 Club Race" (frequent racing pattern)

### After Fleet Fix

Additional fleet-based suggestions will appear:
- Races added by other RHKYC Dragon Fleet members
- Races added by other RHKYC J/70 Fleet members

---

## 📊 Data Summary

| Category | Count | Status |
|----------|-------|--------|
| **Users** | 5 | ✅ Created |
| **Clubs** | 4 | ✅ Created |
| **Club Memberships** | 7 | ✅ Created |
| **Club Events** | 5 | ✅ Created |
| **Historical Races** | 20 | ✅ Created |
| **Fleets** | 0 | ⚠️ Blocked (FK issue) |
| **Fleet Memberships** | 0 | ⚠️ Blocked (FK issue) |

---

## 🔄 Scripts Available

### 1. Complete Seed Script
```bash
node scripts/seed-complete-clubs-and-fleets.mjs
```
- Creates clubs (or uses existing)
- Creates fleets (once FK is fixed)
- Creates memberships
- Creates club events

### 2. Verify Clubs
```bash
node scripts/verify-clubs.mjs
```
- Lists all clubs in database
- Shows IDs for troubleshooting

### 3. Cleanup Duplicates
```bash
node scripts/cleanup-duplicate-clubs.mjs
```
- Removes duplicate clubs
- Keeps most recent version

### 4. Generate Race Suggestions
```bash
npx supabase functions invoke refresh-race-suggestions
```
- Pre-computes suggestions for all users
- Caches results for 24 hours

---

## 📚 Related Files

### Seed Scripts
- `scripts/seed-complete-clubs-and-fleets.mjs` - Main seed script
- `scripts/seed-demo-users-simple.mjs` - User + race history seed
- `scripts/cleanup-duplicate-clubs.mjs` - Remove duplicates
- `scripts/verify-clubs.mjs` - Check club data

### Documentation
- `DEMO_USERS_QUICK_REF.md` - User login credentials
- `MOCK_USERS_AND_DATA_SETUP.md` - Full user setup guide
- `RACE_SUGGESTIONS_IMPLEMENTATION.md` - System architecture

### Migrations
- `supabase/migrations/20251106140000_fix_fleets_club_id_fkey.sql` - Fleet FK fix
- `supabase/migrations/20251106130000_create_race_suggestions_system.sql` - Suggestions system

---

## ✅ Next Steps

1. **Fix Fleet Foreign Key** (manual SQL in dashboard)
2. **Re-run seed script** to create fleets
3. **Test complete flow**:
   - Login as demo user
   - See club event suggestions ✅
   - See fleet race suggestions (after FK fix)
   - See pattern-based suggestions ✅

---

## 💡 Current Capabilities

Even without fleets, the system is **fully functional** for:

1. **Club-based race suggestions**
   - Users see upcoming events from their clubs
   - Events have full details (date, location, class, fees)
   - "Add to Calendar" pre-fills the race form

2. **Pattern-based suggestions**
   - Detects seasonal patterns (e.g., Spring Championship every April)
   - Detects venue preferences (e.g., Hong Kong Waters)
   - Detects class preferences (e.g., Dragon, J/70)
   - Suggests based on 20 historical races across 3 users

3. **Club memberships**
   - 5 demo users connected to 4 real clubs
   - Proper role assignments (member, admin)
   - Multiple club memberships supported

---

**Ready to test!** Login with any demo user to see club-based race suggestions working today.
