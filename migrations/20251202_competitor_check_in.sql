-- ============================================================================
-- Competitor Check-In System Migration
-- Tracks competitor check-in status for race day operations
-- ============================================================================

-- 1. Add check-in settings to regatta_races table
ALTER TABLE public.regatta_races
ADD COLUMN IF NOT EXISTS check_in_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS check_in_opens_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_in_closes_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_dns_on_start BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS self_check_in_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS check_in_qr_token TEXT;

COMMENT ON COLUMN public.regatta_races.check_in_enabled IS 'Whether check-in is required for this race';
COMMENT ON COLUMN public.regatta_races.check_in_opens_at IS 'When check-in opens (optional)';
COMMENT ON COLUMN public.regatta_races.check_in_closes_at IS 'When check-in closes (usually race start)';
COMMENT ON COLUMN public.regatta_races.auto_dns_on_start IS 'Automatically mark non-checked-in as DNS when race starts';
COMMENT ON COLUMN public.regatta_races.self_check_in_enabled IS 'Allow competitors to self-check-in via QR code';
COMMENT ON COLUMN public.regatta_races.check_in_qr_token IS 'Unique token for QR code self-check-in';

-- 2. Create race_check_ins table
CREATE TABLE IF NOT EXISTS public.race_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    entry_id UUID NOT NULL REFERENCES public.race_entries(id) ON DELETE CASCADE,
    
    -- Check-in status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',        -- Not yet checked in
        'checked_in',     -- Checked in and ready to race
        'late',           -- Checked in after deadline
        'scratched',      -- Withdrew before race
        'dns_auto',       -- Auto-marked DNS (didn't check in)
        'dns_manual'      -- Manually marked DNS
    )),
    
    -- Check-in details
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES auth.users(id),
    check_in_method TEXT CHECK (check_in_method IN (
        'manual',         -- Race officer checked them in
        'self_qr',        -- Self check-in via QR code
        'self_app',       -- Self check-in via app
        'radio',          -- Check-in via radio
        'visual'          -- Visual confirmation on water
    )),
    
    -- Scratch/withdrawal details
    scratched_at TIMESTAMPTZ,
    scratch_reason TEXT,
    
    -- Notes
    notes TEXT,
    
    -- Location (for on-water check-in)
    check_in_location TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One check-in record per entry per race
    UNIQUE(regatta_id, race_number, entry_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_regatta ON public.race_check_ins(regatta_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_race ON public.race_check_ins(regatta_id, race_number);
CREATE INDEX IF NOT EXISTS idx_check_ins_entry ON public.race_check_ins(entry_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON public.race_check_ins(status);

-- 3. Create check_in_notifications table for tracking notifications
CREATE TABLE IF NOT EXISTS public.check_in_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    race_number INTEGER NOT NULL,
    entry_id UUID NOT NULL REFERENCES public.race_entries(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'reminder',       -- Check-in reminder
        'warning',        -- Late check-in warning
        'dns_notice'      -- DNS notification
    )),
    
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    sent_via TEXT CHECK (sent_via IN ('push', 'sms', 'email')),
    delivered BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_entry ON public.check_in_notifications(entry_id);

-- 4. Create function to auto-create check-in records when race is created
CREATE OR REPLACE FUNCTION create_check_in_records()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create if check-in is enabled
    IF NEW.check_in_enabled THEN
        -- Insert pending check-in record for each confirmed entry
        INSERT INTO public.race_check_ins (regatta_id, race_number, entry_id, status)
        SELECT 
            NEW.regatta_id,
            NEW.race_number,
            re.id,
            'pending'
        FROM public.race_entries re
        WHERE re.regatta_id = NEW.regatta_id
        AND re.status = 'confirmed'
        ON CONFLICT (regatta_id, race_number, entry_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_check_ins
    AFTER INSERT ON public.regatta_races
    FOR EACH ROW
    EXECUTE FUNCTION create_check_in_records();

-- 5. Create function to generate QR token for race
CREATE OR REPLACE FUNCTION generate_check_in_qr_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.self_check_in_enabled AND NEW.check_in_qr_token IS NULL THEN
        NEW.check_in_qr_token := encode(gen_random_bytes(16), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_qr_token
    BEFORE INSERT OR UPDATE ON public.regatta_races
    FOR EACH ROW
    EXECUTE FUNCTION generate_check_in_qr_token();

-- 6. Create function to auto-DNS on race start
CREATE OR REPLACE FUNCTION auto_dns_on_race_start()
RETURNS TRIGGER AS $$
BEGIN
    -- When race status changes to 'started' and auto_dns is enabled
    IF NEW.status = 'started' AND OLD.status != 'started' AND NEW.auto_dns_on_start THEN
        -- Mark all pending check-ins as dns_auto
        UPDATE public.race_check_ins
        SET 
            status = 'dns_auto',
            updated_at = NOW()
        WHERE regatta_id = NEW.regatta_id
        AND race_number = NEW.race_number
        AND status = 'pending';
        
        -- Also update race_results if they exist
        UPDATE public.race_results
        SET 
            status = 'dns',
            score_code = 'DNS'
        WHERE regatta_id = NEW.regatta_id
        AND race_number = NEW.race_number
        AND entry_id IN (
            SELECT entry_id FROM public.race_check_ins
            WHERE regatta_id = NEW.regatta_id
            AND race_number = NEW.race_number
            AND status = 'dns_auto'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_dns
    AFTER UPDATE ON public.regatta_races
    FOR EACH ROW
    EXECUTE FUNCTION auto_dns_on_race_start();

-- 7. Create view for check-in status summary
CREATE OR REPLACE VIEW public.race_check_in_summary AS
SELECT 
    ci.regatta_id,
    ci.race_number,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE ci.status = 'checked_in') as checked_in,
    COUNT(*) FILTER (WHERE ci.status = 'late') as late,
    COUNT(*) FILTER (WHERE ci.status = 'pending') as pending,
    COUNT(*) FILTER (WHERE ci.status = 'scratched') as scratched,
    COUNT(*) FILTER (WHERE ci.status IN ('dns_auto', 'dns_manual')) as dns,
    ROUND(
        COUNT(*) FILTER (WHERE ci.status IN ('checked_in', 'late'))::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        1
    ) as check_in_percentage
FROM public.race_check_ins ci
GROUP BY ci.regatta_id, ci.race_number;

-- 8. RLS Policies
ALTER TABLE public.race_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_notifications ENABLE ROW LEVEL SECURITY;

-- Club staff can manage check-ins
CREATE POLICY "Club staff can manage check-ins"
    ON public.race_check_ins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = race_check_ins.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer', 'scorer')
        )
    );

-- Competitors can view their own check-in status
CREATE POLICY "Competitors can view own check-in"
    ON public.race_check_ins FOR SELECT
    USING (
        entry_id IN (
            SELECT id FROM race_entries WHERE sailor_id = auth.uid()
        )
    );

-- Competitors can self-check-in
CREATE POLICY "Competitors can self-check-in"
    ON public.race_check_ins FOR UPDATE
    USING (
        entry_id IN (
            SELECT id FROM race_entries WHERE sailor_id = auth.uid()
        )
        AND status = 'pending'
    )
    WITH CHECK (
        status IN ('checked_in', 'scratched')
    );

-- Notifications policies
CREATE POLICY "Staff can manage notifications"
    ON public.check_in_notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM regattas r
            JOIN club_members cm ON cm.club_id = r.club_id
            WHERE r.id = check_in_notifications.regatta_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'race_officer')
        )
    );

-- 9. Grants
GRANT ALL ON public.race_check_ins TO authenticated;
GRANT ALL ON public.check_in_notifications TO authenticated;
GRANT SELECT ON public.race_check_in_summary TO authenticated;

-- 10. Update trigger
CREATE TRIGGER update_check_ins_updated_at
    BEFORE UPDATE ON public.race_check_ins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Comments
COMMENT ON TABLE public.race_check_ins IS 'Tracks competitor check-in status for each race';
COMMENT ON TABLE public.check_in_notifications IS 'Tracks notifications sent for check-in reminders';
COMMENT ON VIEW public.race_check_in_summary IS 'Summary statistics for race check-ins';

