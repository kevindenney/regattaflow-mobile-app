# Stripe Earnings - Quick Start Guide

## ✅ What's Already Done

1. **Frontend Integration** - Earnings screen updated to use real data
2. **Monthly Statistics** - Pulls from `coaching_sessions` table (works now!)
3. **Stripe API Endpoints** - Edge Functions created but not yet deployed
4. **Database Schema** - Migration ready for `stripe_account_id` column
5. **Error Handling** - Graceful fallbacks when Stripe isn't set up

## 🚀 Quick Deployment (5 minutes)

### Step 1: Run Database Migration
```bash
supabase db push
```
This adds the `stripe_account_id` column to `coach_profiles`.

### Step 2: Deploy Edge Functions
```bash
# Easy way (using provided script)
./scripts/deploy-stripe-functions.sh

# Or manually
supabase functions deploy stripe-balance
supabase functions deploy stripe-transactions
```

### Step 3: Set Stripe Secret Key
```bash
# For testing
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# For production
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

### Step 4: Test It!
```bash
# Test monthly stats (works immediately)
npx tsx scripts/test-stripe-earnings.ts

# Or just open the app
npm run web
# Navigate to Earnings tab → Pull to refresh
```

## 📊 What You'll See

### Right Now (Before Stripe Setup):
- ✅ **Monthly Overview** - Real session data
- ℹ️ **Balance** - Shows $0 with "API setup required" notice
- ℹ️ **Transactions** - Shows "No recent transactions"

### After Stripe Connect Setup:
- ✅ **Monthly Overview** - Real session data (already working!)
- ✅ **Balance** - Real available and pending amounts from Stripe
- ✅ **Transactions** - Real payment and payout history
- ✅ **Withdraw Button** - Opens Stripe dashboard

## 🔧 Testing Without Real Stripe Data

Monthly stats work immediately with test data:

```sql
-- Add a test coaching session
INSERT INTO coaching_sessions (
  coach_id,
  sailor_id,
  status,
  fee_amount,
  currency,
  completed_at
) VALUES (
  'your-user-id',
  'sailor-user-id',
  'completed',
  15000,  -- $150.00 in cents
  'usd',
  NOW()
);
```

Then pull to refresh in the app!

## 🎯 File Reference

### Modified Files
- `src/app/(tabs)/earnings.tsx` - Earnings screen with real data
- `src/services/StripeConnectService.ts` - Stripe API service
- `supabase/migrations/20251004_stripe_connect_fields.sql` - Database schema

### New Files
- `supabase/functions/stripe-balance/index.ts` - Balance API
- `supabase/functions/stripe-transactions/index.ts` - Transactions API
- `scripts/deploy-stripe-functions.sh` - Easy deployment
- `scripts/test-stripe-earnings.ts` - Test script

### Documentation
- `supabase/functions/README.md` - Edge Functions guide
- `STRIPE_EARNINGS_IMPLEMENTATION.md` - Full implementation details
- `EARNINGS_QUICK_START.md` - This file!

## 🐛 Troubleshooting

### "No sessions this month" in monthly stats
✅ **Solution:** Add test coaching sessions (see SQL above)

### Balance still shows $0 after deployment
1. Check Edge Functions are deployed: `supabase functions list`
2. Verify secret is set: `supabase secrets list`
3. Check coach has `stripe_account_id` in database
4. View logs: `supabase functions logs stripe-balance`

### "Unauthorized" error
- Make sure you're logged in to the app
- Check Supabase session is valid
- Verify user_id matches coach's user_id

## 📞 Quick Commands

```bash
# Deploy everything
./scripts/deploy-stripe-functions.sh

# Test the implementation
npx tsx scripts/test-stripe-earnings.ts

# View function logs
supabase functions logs stripe-balance --follow
supabase functions logs stripe-transactions --follow

# List secrets
supabase secrets list

# Run migrations
supabase db push
```

## 🎉 Success Criteria

After deployment, you should see:

1. ✅ Monthly overview shows real coaching sessions
2. ✅ Pull to refresh updates all data
3. ✅ Balance displays real Stripe amounts (once Stripe Connect is set up)
4. ✅ Transaction history shows payments and payouts
5. ✅ Graceful error messages when Stripe isn't connected

## 📚 Additional Resources

- **Full Documentation:** `STRIPE_EARNINGS_IMPLEMENTATION.md`
- **Edge Functions Guide:** `supabase/functions/README.md`
- **Stripe Connect Docs:** https://stripe.com/docs/connect
- **Supabase Functions Docs:** https://supabase.com/docs/guides/functions

---

**Ready to deploy?** Run `./scripts/deploy-stripe-functions.sh` to get started! 🚀
