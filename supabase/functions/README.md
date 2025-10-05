# Supabase Edge Functions

This directory contains Supabase Edge Functions for the RegattaFlow coaching platform.

## Available Functions

### 1. stripe-balance
Fetches the current Stripe balance for a coach's connected account.

**Endpoint:** `GET /functions/v1/stripe-balance`

**Query Parameters:**
- `coachId` - The coach profile ID
- `userId` - The authenticated user ID

**Returns:**
```json
{
  "available": 0,    // Available balance in cents
  "pending": 0,      // Pending balance in cents
  "currency": "usd"
}
```

### 2. stripe-transactions
Fetches recent transactions and transfers for a coach's connected account.

**Endpoint:** `GET /functions/v1/stripe-transactions`

**Query Parameters:**
- `coachId` - The coach profile ID
- `userId` - The authenticated user ID
- `limit` (optional) - Number of transactions to return (default: 25, max: 100)

**Returns:**
```json
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

## Deployment

### Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref <your-project-ref>`

### Deploy Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy stripe-balance
supabase functions deploy stripe-transactions
```

### Set Environment Variables
```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx

# Verify secrets
supabase secrets list
```

### Required Environment Variables
The following environment variables are automatically available in Edge Functions:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access

You need to manually set:
- `STRIPE_SECRET_KEY` - Your Stripe secret key

## Testing Locally

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test with curl
curl -i --location --request GET 'http://localhost:54321/functions/v1/stripe-balance?coachId=xxx&userId=xxx' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY'
```

## Database Requirements

The Edge Functions require the following database schema:

### coach_profiles table
Must have these columns:
- `id` (UUID) - Coach profile ID
- `user_id` (UUID) - User ID (references auth.users)
- `stripe_account_id` (TEXT) - Stripe Connect account ID
- `stripe_details_submitted` (BOOLEAN)
- `stripe_charges_enabled` (BOOLEAN)
- `stripe_payouts_enabled` (BOOLEAN)

Run the migration:
```bash
supabase db push
```

## Security

- Functions use Supabase Auth to verify user sessions
- Users can only access their own coach profile data
- Row Level Security (RLS) policies are enforced
- Stripe API calls are made server-side to protect secret keys

## Monitoring

View function logs:
```bash
supabase functions logs stripe-balance
supabase functions logs stripe-transactions
```

## Troubleshooting

### "Stripe Connect account not found" error
- Verify the coach has completed Stripe onboarding
- Check that `stripe_account_id` is set in the coach_profiles table

### "Unauthorized" error
- Verify the Authorization header contains a valid Supabase session token
- Check that the userId matches the authenticated user

### CORS errors
- The functions include CORS headers for cross-origin requests
- Verify your app's origin is allowed in production settings
