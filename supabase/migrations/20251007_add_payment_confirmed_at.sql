-- Add payment_confirmed_at column to race_entries table
-- This tracks when the payment was confirmed via Stripe webhook or API

ALTER TABLE race_entries
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

-- Add index for payment_confirmed_at for queries filtering by payment confirmation
CREATE INDEX IF NOT EXISTS idx_race_entries_payment_confirmed
ON race_entries(payment_confirmed_at)
WHERE payment_confirmed_at IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN race_entries.payment_confirmed_at IS
'Timestamp when payment was confirmed via Stripe. Set after successful payment intent confirmation.';
