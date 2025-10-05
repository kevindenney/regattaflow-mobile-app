# Stripe Earnings Implementation Summary

## Overview
Replaced mock transaction data in the earnings screen with real Stripe data and database-driven monthly statistics.

## Changes Made

### 1. Earnings Screen (`src/app/(tabs)/earnings.tsx`)

#### Added Real Monthly Statistics
- **Before:** Hardcoded monthly overview (24 sessions, $118 average, $2,840 total)
- **After:** Real data from `coaching_sessions` table in Supabase

**New Features:**
- Query coaching sessions for current month
- Calculate real metrics:
  - Sessions completed
  - Average per session
  - Total earned
  - Platform fee (15%)
- Auto-refresh on pull-to-refresh

#### Added Balance API Notice
- Shows informational notice when Stripe balance is $0 (API not yet set up)
- Helps users understand backend requirements

### 2. Stripe Connect Service (`src/services/StripeConnectService.ts`)

#### Updated API Endpoints
- **Before:** Called non-existent `/api/stripe/connect/*` endpoints
- **After:** Uses Supabase Edge Functions

**Changes:**
- Added `getSupabaseFunctionUrl()` helper
- Updated `getBalance()` to call `stripe-balance` function
- Updated `getTransactions()` to call `stripe-transactions` function

### 3. Supabase Edge Functions (NEW)

#### Created `stripe-balance` Function
**File:** `supabase/functions/stripe-balance/index.ts`

**Features:**
- Fetches Stripe balance for connected accounts
- Authentication via Supabase Auth
- Security: Users can only access their own data
- Returns available and pending balance in cents

**API:**
```
GET /functions/v1/stripe-balance?coachId=xxx&userId=xxx
Authorization: Bearer <supabase-token>

Response:
{
  "available": 0,
  "pending": 0,
  "currency": "usd"
}
```

#### Created `stripe-transactions` Function
**File:** `supabase/functions/stripe-transactions/index.ts`

**Features:**
- Fetches recent charges and transfers
- Combines and sorts by date
- Configurable limit (default 25, max 100)
- Returns unified transaction format

**API:**
```
GET /functions/v1/stripe-transactions?coachId=xxx&userId=xxx&limit=25
Authorization: Bearer <supabase-token>

Response:
{
  "transactions": [
    {
      "id": "ch_xxx",
      "amount": 10000,
      "currency": "usd",
      "created": 1234567890,
      "description": "Coaching session payment",
      "status": "succeeded",
      "type": "charge"
    }
  ]
}
```

### 4. Database Schema Update

#### Fixed Missing Column
**File:** `supabase/migrations/20251004_stripe_connect_fields.sql`

**Added:**
```sql
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
```

This column stores the Stripe Connect account ID for each coach.

### 5. Documentation

#### Edge Functions README
**File:** `supabase/functions/README.md`

**Contains:**
- Function descriptions
- Deployment instructions
- Environment variable setup
- Testing guide
- Troubleshooting tips

## Deployment Steps

### 1. Run Database Migration
```bash
supabase db push
```

This adds the `stripe_account_id` column to `coach_profiles`.

### 2. Deploy Edge Functions
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref <your-project-ref>

# Deploy functions
supabase functions deploy stripe-balance
supabase functions deploy stripe-transactions
```

### 3. Set Environment Variables
```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx

# Verify
supabase secrets list
```

### 4. Test the Implementation
1. Start the app: `npm run web` or `expo start`
2. Navigate to the Earnings tab
3. Pull to refresh to load data
4. Verify:
   - Monthly overview shows real session data
   - Balance shows $0 with notice (until Stripe Connect is set up)
   - Transactions show empty state

## How It Works

### Data Flow

1. **Monthly Statistics:**
   ```
   User → Earnings Screen → Supabase → coaching_sessions table
   → Calculate totals → Display
   ```

2. **Stripe Balance:**
   ```
   User → Earnings Screen → StripeConnectService
   → Supabase Edge Function → Stripe API → Display
   ```

3. **Stripe Transactions:**
   ```
   User → Earnings Screen → StripeConnectService
   → Supabase Edge Function → Stripe API (charges + transfers)
   → Combine & Sort → Display
   ```

### Security

- ✅ Supabase Auth token required
- ✅ Row Level Security (RLS) enforced
- ✅ Users can only access their own data
- ✅ Stripe secret key stored server-side
- ✅ CORS headers configured

## Testing Locally

### Test Monthly Stats (Works Now)
1. Add test coaching sessions to database
2. Pull to refresh on earnings screen
3. Verify monthly overview shows correct data

### Test Stripe Balance (Requires Setup)
1. Complete Stripe Connect onboarding for a coach
2. Add `stripe_account_id` to coach_profiles record
3. Deploy Edge Functions
4. Pull to refresh on earnings screen
5. Verify balance displays correctly

### Test with Supabase Local Dev
```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test balance endpoint
curl -i --location --request GET \
  'http://localhost:54321/functions/v1/stripe-balance?coachId=xxx&userId=xxx' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'

# Test transactions endpoint
curl -i --location --request GET \
  'http://localhost:54321/functions/v1/stripe-transactions?coachId=xxx&userId=xxx&limit=10' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

## Verification Checklist

- [x] Monthly stats pull from real `coaching_sessions` data
- [x] Balance API endpoint created (`stripe-balance`)
- [x] Transactions API endpoint created (`stripe-transactions`)
- [x] StripeConnectService updated to use Edge Functions
- [x] Database migration includes `stripe_account_id` column
- [x] TypeScript types are correct (no compilation errors)
- [x] Refresh functionality works
- [x] Error handling for missing Stripe setup
- [x] Documentation created
- [ ] Edge Functions deployed (pending user action)
- [ ] Environment variables set (pending user action)
- [ ] Integration tested with real Stripe account (pending user action)

## Next Steps

1. **Deploy Edge Functions** (see deployment steps above)
2. **Set Stripe Environment Variables** in Supabase dashboard
3. **Test with Real Stripe Account:**
   - Complete coach onboarding flow
   - Create coaching sessions
   - Process payments
   - Verify balance and transactions display correctly
4. **Monitor Function Logs:**
   ```bash
   supabase functions logs stripe-balance
   supabase functions logs stripe-transactions
   ```

## Files Modified

1. `src/app/(tabs)/earnings.tsx` - Added real monthly stats, updated UI
2. `src/services/StripeConnectService.ts` - Updated to use Edge Functions
3. `supabase/migrations/20251004_stripe_connect_fields.sql` - Added stripe_account_id column

## Files Created

1. `supabase/functions/stripe-balance/index.ts` - Balance API
2. `supabase/functions/stripe-transactions/index.ts` - Transactions API
3. `supabase/functions/README.md` - Deployment documentation
4. `STRIPE_EARNINGS_IMPLEMENTATION.md` - This file

## Troubleshooting

### Balance shows $0
- Check if Stripe Connect is set up for the coach
- Verify `stripe_account_id` is set in database
- Check Edge Functions are deployed
- Verify `STRIPE_SECRET_KEY` environment variable is set

### Transactions are empty
- Same as balance checks above
- Verify coach has processed payments in Stripe
- Check function logs for errors

### "Unauthorized" errors
- Verify user is logged in
- Check Supabase session token is valid
- Verify userId matches coach's user_id

### API Notice always shows
- This is expected until Edge Functions are deployed
- Once deployed and Stripe is set up, real balance will display
- Notice will automatically hide when balance > 0
