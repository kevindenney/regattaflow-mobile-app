# Stripe Payment Flow Implementation

**Status**: ✅ Complete - Ready for Testing
**Date**: January 2025
**Feature**: Race Registration Payment Integration

---

## Overview

This document describes the complete Stripe payment flow implementation for race registrations in the RegattaFlow mobile and web app.

## Architecture

```
┌─────────────────┐
│  Registration   │
│     Screen      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Registration   │
│      Form       │──── Collect entry details
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Document      │
│    Upload       │──── Upload required docs
└────────┬────────┘
         │
         v
┌─────────────────┐      ┌────────────────────┐
│ PaymentFlow     │─────►│  Edge Function     │
│   Component     │      │ create-payment-    │
└────────┬────────┘      │    intent          │
         │               └──────────┬─────────┘
         │                          │
         v                          v
┌─────────────────┐      ┌────────────────────┐
│ Stripe Payment  │◄─────┤   Stripe API       │
│     Sheet       │      │ Payment Intent     │
└────────┬────────┘      └────────────────────┘
         │
         v
┌─────────────────┐
│   Confirm &     │
│  Send Email     │
└─────────────────┘
```

## Files Modified/Created

### 1. Edge Function
**File**: `supabase/functions/create-payment-intent/index.ts`
- ✅ **Created**: Supabase Edge Function to create Stripe payment intents
- Validates entry ID, amount, currency
- Creates Stripe payment intent with metadata
- Returns client secret for React Native Stripe SDK
- CORS support for web requests
- Error handling and logging

### 2. Payment Flow Component
**File**: `src/components/registration/PaymentFlowComponent.tsx`
- ✅ **Updated**: Integrated Stripe React Native SDK
- Imports `useStripe` hook from `@stripe/stripe-react-native`
- Initializes payment sheet with proper styling
- Presents payment sheet and handles user cancellation
- Confirms payment with backend after successful payment
- Platform-specific handling (mobile vs web)
- Comprehensive error states and loading indicators

### 3. Registration Service
**File**: `src/services/RaceRegistrationService.ts`
- ✅ **Updated**: `createPaymentIntent()` method
  - Calls Supabase Edge Function instead of external API
  - Updates entry status to `pending_payment`
  - Stores `payment_intent_id` in database
- ✅ **Updated**: `confirmPayment()` method
  - Updates `payment_status` to `paid`
  - Updates `status` to `confirmed`
  - Sets `payment_confirmed_at` timestamp
  - Sends confirmation email to sailor
  - Sends payment notification to club

### 4. App Layout
**File**: `src/app/_layout.tsx`
- ✅ **Updated**: Added `StripeProvider` to component tree
- Wraps app with Stripe context for payment sheet access

### 5. Stripe Provider
**File**: `src/providers/StripeProvider.native.tsx`
- ✅ **Already exists**: Configures Stripe React Native SDK
- Requires `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` environment variable
- Merchant identifier for Apple Pay: `merchant.com.regattaflow`
- URL scheme for redirects: `regattaflow://`

### 6. Database Migration
**File**: `supabase/migrations/20251007_add_payment_confirmed_at.sql`
- ✅ **Created**: Adds `payment_confirmed_at` column to `race_entries` table
- Index for performance on payment confirmation queries
- Documentation comment

### 7. Registration Screen
**File**: `src/app/(tabs)/race/register/[id].tsx`
- ✅ **Already complete**: Multi-step workflow ready
- Entry form → Documents → **Payment** → Confirmation
- Calls `PaymentFlowComponent` with proper props
- Handles payment success/cancel callbacks

---

## Environment Setup

### Required Environment Variables

Add these to your `.env` file:

```bash
# Stripe Publishable Key (starts with pk_)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Stripe Secret Key (starts with sk_) - for Edge Functions
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Optional: Stripe Webhook Secret (for webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### Getting Stripe Keys

1. **Sign up for Stripe** at https://dashboard.stripe.com/register
2. **Get Test Keys** from https://dashboard.stripe.com/test/apikeys
   - **Publishable key**: Used in mobile/web app (safe to expose)
   - **Secret key**: Used in Edge Functions (keep secret!)
3. **Add to `.env`** file in project root

### Deploy Edge Function

```bash
# Make sure you're logged into Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set the secret key in Supabase
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY

# Deploy the function
supabase functions deploy create-payment-intent
```

---

## Database Schema

### Existing Tables (No Changes Needed)

#### `race_entries` Table
```sql
- id: UUID (primary key)
- regatta_id: UUID (references regattas)
- sailor_id: UUID (references auth.users)
- boat_id: UUID (references sailor_boats)
- entry_class: TEXT
- division: TEXT
- sail_number: TEXT
- status: TEXT ('draft', 'pending_payment', 'confirmed', etc.)
- entry_number: TEXT (unique)
- entry_fee_amount: DECIMAL(10,2)
- entry_fee_currency: TEXT
- payment_status: TEXT ('unpaid', 'pending', 'paid', 'refunded', 'waived')
- payment_intent_id: TEXT ✅
- payment_method: TEXT
- paid_at: TIMESTAMPTZ
- payment_confirmed_at: TIMESTAMPTZ ✅ NEW
- crew_member_ids: UUID[]
- documents_required: JSONB
- documents_submitted: JSONB
- special_requests: TEXT
- dietary_requirements: TEXT
- equipment_notes: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `entry_payment_transactions` Table
Optional detailed payment tracking:
```sql
- id: UUID
- entry_id: UUID
- amount: DECIMAL(10,2)
- currency: TEXT
- payment_method: TEXT
- stripe_payment_intent_id: TEXT
- stripe_charge_id: TEXT
- status: TEXT
- processed_at: TIMESTAMPTZ
```

---

## Payment Flow Steps

### 1. User Fills Registration Form
- Select boat
- Enter sail number, class, division
- Select crew members
- Add special requests

### 2. Upload Documents
- Upload required documents (crew list, insurance, etc.)
- Mark documents as submitted

### 3. Payment Step (New Implementation)

#### Mobile Flow (iOS/Android)
```typescript
1. PaymentFlowComponent loads entry info
2. User clicks "Pay $XX.XX" button
3. Call raceRegistrationService.createPaymentIntent()
   ↓
4. Edge Function creates Stripe payment intent
   ↓
5. Returns client secret
   ↓
6. Initialize Stripe Payment Sheet
   ↓
7. Present Payment Sheet to user
   ↓
8. User enters card details
   ↓
9. Stripe processes payment
   ↓
10. On success: confirmPayment()
    - Updates database (status → 'confirmed', payment_status → 'paid')
    - Sends confirmation email
    - Shows success alert
   ↓
11. Navigate to confirmation screen
```

#### Web Flow
Currently shows message: "Please use mobile app to complete payment"

**Future Enhancement**: Implement Stripe Checkout or Stripe Elements for web

### 4. Confirmation
- Show entry number
- Display success message
- Email confirmation sent
- Navigate to dashboard or races list

---

## Testing the Payment Flow

### Prerequisites
1. ✅ Stripe account created
2. ✅ Test API keys added to `.env`
3. ✅ Edge Function deployed
4. ✅ Database migrations applied
5. ✅ App rebuilt with new environment variables

### Testing Steps

#### Test 1: Free Entry (No Payment Required)
```bash
1. Create a regatta with entry_fee = 0
2. Fill registration form
3. Upload documents
4. Should skip payment and go straight to confirmation
```

#### Test 2: Paid Entry - Successful Payment
```bash
1. Create a regatta with entry_fee > 0
2. Fill registration form
3. Upload documents
4. Click "Pay $XX.XX"
5. Payment sheet should appear
6. Use Stripe test card: 4242 4242 4242 4242
   - Expiry: any future date (e.g., 12/25)
   - CVC: any 3 digits (e.g., 123)
   - ZIP: any 5 digits (e.g., 12345)
7. Confirm payment
8. Should show success alert
9. Navigate to confirmation with entry number
10. Check database: payment_status = 'paid', status = 'confirmed'
```

#### Test 3: Paid Entry - User Cancels
```bash
1. Follow steps 1-5 above
2. Click "Cancel" or back button in payment sheet
3. Should return to payment screen with error: "Payment was cancelled"
4. Can retry payment or skip for now
```

#### Test 4: Paid Entry - Card Declined
```bash
1. Follow steps 1-5 above
2. Use declined card: 4000 0000 0000 0002
3. Should show error: "Your card was declined"
4. Can retry with valid card
```

#### Test 5: Skip Payment
```bash
1. Follow steps 1-4 above
2. Click "Pay Later"
3. Confirm skip
4. Navigate to confirmation
5. Check database: payment_status = 'unpaid', status = 'draft' or 'pending_payment'
```

### Stripe Test Cards
```
Success:        4242 4242 4242 4242
Declined:       4000 0000 0000 0002
Insufficient:   4000 0000 0000 9995
Processing:     4000 0000 0000 0127
3D Secure:      4000 0027 6000 3184
```

Full list: https://stripe.com/docs/testing#cards

---

## Stripe Dashboard Monitoring

### View Test Payments
1. Go to https://dashboard.stripe.com/test/payments
2. See all payment intents created
3. Click on payment to see details:
   - Amount
   - Status
   - Metadata (entry_id)
   - Customer details
   - Timeline of events

### View Logs
1. Go to https://dashboard.stripe.com/test/logs
2. Filter by API calls
3. Debug any issues with payment creation or confirmation

---

## Error Handling

### Client-Side Errors
- **Missing Stripe key**: Shows warning, payments disabled
- **Invalid amount**: Validation before API call
- **Network error**: Retry logic with user feedback
- **User cancellation**: Graceful handling, allow retry
- **Card declined**: Show Stripe error message

### Server-Side Errors
- **Invalid entry**: 400 error with message
- **Already paid**: Prevent duplicate payments
- **Stripe API error**: Log error, return user-friendly message
- **Database error**: Rollback, log, notify admin

### Edge Function Errors
All errors return structured JSON:
```json
{
  "error": "Human-readable error message",
  "details": "error_type_code"
}
```

---

## Security Considerations

### ✅ Implemented
1. **API Keys**: Secret key only in Edge Functions (server-side)
2. **Authentication**: Requires valid Supabase auth token
3. **Input Validation**: Amount, currency, entryId validated
4. **CORS**: Configured for app domains only
5. **Metadata**: Entry ID stored for reconciliation
6. **No PCI Compliance Needed**: Stripe handles all card data

### 🔒 Recommended Enhancements
1. **Webhooks**: Listen to Stripe webhooks for async payment confirmation
2. **Idempotency**: Prevent duplicate payment intents for same entry
3. **Amount Verification**: Server-side verification of payment amount
4. **Rate Limiting**: Prevent payment intent spam
5. **Refund Handling**: Admin interface for refunds

---

## Next Steps

### Priority 1: Testing
- [ ] Deploy Edge Function to Supabase
- [ ] Add Stripe test keys to environment
- [ ] Run through all test scenarios
- [ ] Verify database updates correctly
- [ ] Test email confirmations

### Priority 2: Production Setup
- [ ] Get Stripe live API keys
- [ ] Configure production environment variables
- [ ] Set up Stripe webhooks for production
- [ ] Test with real cards (use small amounts!)
- [ ] Monitor first few transactions closely

### Priority 3: Enhancements
- [ ] Implement web payment flow (Stripe Checkout or Elements)
- [ ] Add webhook handler for async payment confirmation
- [ ] Implement refund workflow for admins
- [ ] Add payment receipt generation
- [ ] Support alternative payment methods (Apple Pay, Google Pay)
- [ ] Add currency conversion for international events

### Priority 4: Admin Features
- [ ] Payment dashboard for clubs
- [ ] Manual payment recording (cash, check)
- [ ] Bulk refund processing
- [ ] Payment analytics and reporting
- [ ] Failed payment retry notifications

---

## Troubleshooting

### Payment Sheet Not Appearing (Mobile)
```bash
# Check:
1. StripeProvider is in app layout? ✓
2. EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY set? ✓
3. useStripe() hook returns valid object? ✓
4. clientSecret received from API? ✓

# Debug:
console.log('Stripe hook:', useStripe())
console.log('Client secret:', intentResult.clientSecret)
```

### Edge Function Failing
```bash
# Check function logs:
supabase functions logs create-payment-intent

# Common issues:
- STRIPE_SECRET_KEY not set in Supabase secrets
- CORS error (check allowed origins)
- Invalid Stripe API version
- Network timeout
```

### Database Update Failing
```bash
# Check migration applied:
SELECT * FROM race_entries WHERE id = 'YOUR_ENTRY_ID';

# Verify columns exist:
\d race_entries  (in psql)

# Check RLS policies allow update:
SELECT * FROM pg_policies WHERE tablename = 'race_entries';
```

### Payment Succeeds But Database Not Updated
```bash
# This indicates confirmPayment() failed
# Check:
1. Supabase auth token valid?
2. RLS policies allow update?
3. confirmPayment() error logged?
4. Network connectivity?

# Temporary fix:
- Manually update entry in Supabase dashboard
- payment_status → 'paid'
- status → 'confirmed'
- payment_confirmed_at → NOW()
```

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs/payments/accept-a-payment?platform=react-native
- **Stripe React Native SDK**: https://github.com/stripe/stripe-react-native
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **RegattaFlow Support**: Create issue in GitHub repo

---

**Implementation Complete**: ✅
**Status**: Ready for testing with test API keys
**Estimated Testing Time**: 1-2 hours
**Production Ready**: After testing validation

---

*This document should be updated as the payment system evolves.*
