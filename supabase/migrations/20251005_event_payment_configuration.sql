-- Event Payment Configuration Enhancement
-- Add payment requirement and refund policy fields

-- Add payment configuration fields to club_events
ALTER TABLE club_events
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT 'partial' CHECK (refund_policy IN ('full', 'partial', 'none'));

-- Add platform fee tracking to event_registrations
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS club_payout DECIMAL(10, 2) DEFAULT 0;

-- Create function to calculate platform fee (10% for event registrations)
CREATE OR REPLACE FUNCTION calculate_event_platform_fee(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(amount * 0.10, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate platform fees on payment
CREATE OR REPLACE FUNCTION update_event_registration_fees()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.amount_paid IS NOT NULL AND NEW.amount_paid > 0 THEN
    NEW.platform_fee := calculate_event_platform_fee(NEW.amount_paid);
    NEW.club_payout := NEW.amount_paid - NEW.platform_fee;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_registration_fees
  BEFORE INSERT OR UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registration_fees();

-- Create view for club earnings dashboard
CREATE OR REPLACE VIEW club_event_earnings AS
SELECT
  ce.id as event_id,
  ce.club_id,
  ce.title as event_title,
  ce.start_date,
  ce.registration_fee,
  ce.currency,
  COUNT(er.id) as total_registrations,
  COUNT(er.id) FILTER (WHERE er.payment_status = 'paid') as paid_count,
  COUNT(er.id) FILTER (WHERE er.payment_status = 'unpaid') as unpaid_count,
  COALESCE(SUM(er.amount_paid) FILTER (WHERE er.payment_status = 'paid'), 0) as total_collected,
  COALESCE(SUM(er.platform_fee) FILTER (WHERE er.payment_status = 'paid'), 0) as total_platform_fees,
  COALESCE(SUM(er.club_payout) FILTER (WHERE er.payment_status = 'paid'), 0) as total_club_payout,
  COALESCE(SUM(er.amount_paid) FILTER (WHERE er.payment_status = 'refunded'), 0) as total_refunded
FROM club_events ce
LEFT JOIN event_registrations er ON er.event_id = ce.id
GROUP BY ce.id, ce.club_id, ce.title, ce.start_date, ce.registration_fee, ce.currency;

-- Grant access to the view
GRANT SELECT ON club_event_earnings TO authenticated;

-- Add RLS policy for the view
ALTER VIEW club_event_earnings SET (security_invoker = true);

COMMENT ON VIEW club_event_earnings IS 'Club earnings dashboard showing revenue, platform fees, and payouts per event';
