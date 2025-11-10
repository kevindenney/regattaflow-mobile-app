-- =====================================================
-- Club Events System Migration
-- Creates tables for event management, registrations, and documents
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- Club Events Table
CREATE TABLE IF NOT EXISTS public.club_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,

    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('regatta', 'race_series', 'training', 'social', 'meeting', 'maintenance')),

    -- Dates
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    registration_opens TIMESTAMPTZ,
    registration_closes TIMESTAMPTZ,

    -- Location
    venue_id UUID,
    location_name TEXT,
    location_coordinates JSONB,

    -- Registration Settings
    max_participants INTEGER CHECK (max_participants > 0),
    min_participants INTEGER CHECK (min_participants > 0),
    allow_waitlist BOOLEAN DEFAULT false,

    -- Payment
    registration_fee NUMERIC(10, 2) CHECK (registration_fee >= 0),
    currency TEXT DEFAULT 'USD',
    payment_required BOOLEAN DEFAULT false,
    refund_policy TEXT CHECK (refund_policy IN ('full', 'partial', 'none')),

    -- Status & Visibility
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'club', 'private')),

    -- Contact
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,

    -- Requirements
    requirements TEXT[],
    boat_classes TEXT[],

    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_registration_dates CHECK (
        (registration_opens IS NULL AND registration_closes IS NULL) OR
        (registration_opens IS NOT NULL AND registration_closes IS NOT NULL AND registration_closes >= registration_opens)
    ),
    CONSTRAINT valid_participant_counts CHECK (
        (min_participants IS NULL OR max_participants IS NULL) OR
        (max_participants >= min_participants)
    )
);

-- Event Registrations Table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.club_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist', 'withdrawn', 'cancelled')),
    registration_type TEXT,

    -- Participant Info
    participant_name TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    participant_phone TEXT,

    -- Boat Info
    boat_id UUID,
    boat_class TEXT,
    boat_name TEXT,
    sail_number TEXT,
    crew_count INTEGER DEFAULT 1 CHECK (crew_count >= 0),
    crew_names TEXT[],

    -- Payment
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'waived')),
    amount_paid NUMERIC(10, 2) CHECK (amount_paid >= 0),
    payment_date TIMESTAMPTZ,
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    platform_fee NUMERIC(10, 2) CHECK (platform_fee >= 0),
    club_payout NUMERIC(10, 2) CHECK (club_payout >= 0),

    -- Additional Info
    dietary_requirements TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    special_requirements TEXT,
    notes TEXT,

    -- Approval
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Metadata
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_event_registration UNIQUE (event_id, user_id)
);

-- Event Documents Table
CREATE TABLE IF NOT EXISTS public.event_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.club_events(id) ON DELETE CASCADE,

    -- Document Info
    document_type TEXT NOT NULL CHECK (document_type IN ('nor', 'si', 'results', 'amendment', 'notice', 'course_map', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0',

    -- File Info
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT CHECK (file_size >= 0),
    mime_type TEXT,

    -- Visibility
    is_public BOOLEAN DEFAULT false,
    requires_registration BOOLEAN DEFAULT false,

    -- Publishing
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club Event Earnings View/Table (for tracking financial data)
CREATE TABLE IF NOT EXISTS public.club_event_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.club_events(id) ON DELETE CASCADE,

    -- Financial Data
    total_registrations INTEGER DEFAULT 0,
    total_revenue NUMERIC(10, 2) DEFAULT 0 CHECK (total_revenue >= 0),
    platform_fees NUMERIC(10, 2) DEFAULT 0 CHECK (platform_fees >= 0),
    club_payout NUMERIC(10, 2) DEFAULT 0 CHECK (club_payout >= 0),

    -- Timing
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_club_event_earnings UNIQUE (event_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Club Events Indexes
CREATE INDEX IF NOT EXISTS idx_club_events_club_id ON public.club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_start_date ON public.club_events(start_date);
CREATE INDEX IF NOT EXISTS idx_club_events_status ON public.club_events(status);
CREATE INDEX IF NOT EXISTS idx_club_events_visibility ON public.club_events(visibility);
CREATE INDEX IF NOT EXISTS idx_club_events_event_type ON public.club_events(event_type);
CREATE INDEX IF NOT EXISTS idx_club_events_created_by ON public.club_events(created_by);

-- Event Registrations Indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON public.event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_registered_at ON public.event_registrations(registered_at);

-- Event Documents Indexes
CREATE INDEX IF NOT EXISTS idx_event_documents_event_id ON public.event_documents(event_id);
CREATE INDEX IF NOT EXISTS idx_event_documents_document_type ON public.event_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_event_documents_is_public ON public.event_documents(is_public);

-- Club Event Earnings Indexes
CREATE INDEX IF NOT EXISTS idx_club_event_earnings_club_id ON public.club_event_earnings(club_id);
CREATE INDEX IF NOT EXISTS idx_club_event_earnings_event_id ON public.club_event_earnings(event_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get Event Registration Statistics
CREATE OR REPLACE FUNCTION public.get_event_registration_stats(event_uuid UUID)
RETURNS TABLE (
    total_registrations BIGINT,
    approved_count BIGINT,
    pending_count BIGINT,
    waitlist_count BIGINT,
    total_paid NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_registrations,
        COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_count,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
        COUNT(*) FILTER (WHERE status = 'waitlist')::BIGINT as waitlist_count,
        COALESCE(SUM(amount_paid) FILTER (WHERE payment_status = 'paid'), 0) as total_paid
    FROM public.event_registrations
    WHERE event_id = event_uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Update event earnings when registrations change
CREATE OR REPLACE FUNCTION public.update_event_earnings()
RETURNS TRIGGER AS $$
DECLARE
    v_event RECORD;
BEGIN
    -- Get event details
    SELECT e.club_id, e.start_date, e.end_date
    INTO v_event
    FROM public.club_events e
    WHERE e.id = COALESCE(NEW.event_id, OLD.event_id);

    -- Update or insert earnings record
    INSERT INTO public.club_event_earnings (
        club_id,
        event_id,
        total_registrations,
        total_revenue,
        platform_fees,
        club_payout,
        start_date,
        end_date
    )
    SELECT
        v_event.club_id,
        COALESCE(NEW.event_id, OLD.event_id),
        COUNT(*)::INTEGER,
        COALESCE(SUM(amount_paid), 0),
        COALESCE(SUM(platform_fee), 0),
        COALESCE(SUM(club_payout), 0),
        v_event.start_date,
        v_event.end_date
    FROM public.event_registrations
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
        AND payment_status = 'paid'
    ON CONFLICT (event_id) DO UPDATE SET
        total_registrations = EXCLUDED.total_registrations,
        total_revenue = EXCLUDED.total_revenue,
        platform_fees = EXCLUDED.platform_fees,
        club_payout = EXCLUDED.club_payout,
        updated_at = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on club_events
DROP TRIGGER IF EXISTS update_club_events_updated_at ON public.club_events;
CREATE TRIGGER update_club_events_updated_at
    BEFORE UPDATE ON public.club_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at timestamp on event_registrations
DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER update_event_registrations_updated_at
    BEFORE UPDATE ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at timestamp on event_documents
DROP TRIGGER IF EXISTS update_event_documents_updated_at ON public.event_documents;
CREATE TRIGGER update_event_documents_updated_at
    BEFORE UPDATE ON public.event_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update event earnings when registrations change
DROP TRIGGER IF EXISTS update_event_earnings_on_registration ON public.event_registrations;
CREATE TRIGGER update_event_earnings_on_registration
    AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_event_earnings();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_event_earnings ENABLE ROW LEVEL SECURITY;

-- Club Events Policies
-- Everyone can view public events
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.club_events;
CREATE POLICY "Public events are viewable by everyone"
    ON public.club_events FOR SELECT
    USING (visibility = 'public' AND status IN ('published', 'registration_open', 'registration_closed', 'in_progress', 'completed'));

-- Club members can view their club's events
DROP POLICY IF EXISTS "Club members can view their club events" ON public.club_events;
CREATE POLICY "Club members can view their club events"
    ON public.club_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members cm
            WHERE cm.club_id = club_events.club_id
            AND cm.user_id = auth.uid()
            AND cm.is_active = true
        )
    );

-- Club admins can insert events
DROP POLICY IF EXISTS "Club admins can create events" ON public.club_events;
CREATE POLICY "Club admins can create events"
    ON public.club_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.club_members cm
            WHERE cm.club_id = club_events.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'owner')
            AND cm.is_active = true
        )
    );

-- Club admins can update their club's events
DROP POLICY IF EXISTS "Club admins can update events" ON public.club_events;
CREATE POLICY "Club admins can update events"
    ON public.club_events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members cm
            WHERE cm.club_id = club_events.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'owner')
            AND cm.is_active = true
        )
    );

-- Club admins can delete their club's events
DROP POLICY IF EXISTS "Club admins can delete events" ON public.club_events;
CREATE POLICY "Club admins can delete events"
    ON public.club_events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members cm
            WHERE cm.club_id = club_events.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'owner')
            AND cm.is_active = true
        )
    );

-- Event Registrations Policies
-- Users can view their own registrations
DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations;
CREATE POLICY "Users can view own registrations"
    ON public.event_registrations FOR SELECT
    USING (user_id = auth.uid());

-- Club admins can view all registrations for their events
DROP POLICY IF EXISTS "Club admins can view event registrations" ON public.event_registrations;
CREATE POLICY "Club admins can view event registrations"
    ON public.event_registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.club_events e
            JOIN public.club_members cm ON cm.club_id = e.club_id
            WHERE e.id = event_registrations.event_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'owner')
            AND cm.is_active = true
        )
    );

-- Authenticated users can create registrations
DROP POLICY IF EXISTS "Authenticated users can register" ON public.event_registrations;
CREATE POLICY "Authenticated users can register"
    ON public.event_registrations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update their own registrations
DROP POLICY IF EXISTS "Users can update own registrations" ON public.event_registrations;
CREATE POLICY "Users can update own registrations"
    ON public.event_registrations FOR UPDATE
    USING (user_id = auth.uid());

-- Club admins can update registrations for their events
DROP POLICY IF EXISTS "Club admins can update registrations" ON public.event_registrations;
CREATE POLICY "Club admins can update registrations"
    ON public.event_registrations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.club_events e
            JOIN public.club_members cm ON cm.club_id = e.club_id
            WHERE e.id = event_registrations.event_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'owner')
            AND cm.is_active = true
        )
    );

-- Event Documents Policies
-- Public documents are viewable by everyone
DROP POLICY IF EXISTS "Public documents viewable by all" ON public.event_documents;
CREATE POLICY "Public documents viewable by all"
    ON public.event_documents FOR SELECT
    USING (is_public = true);

-- Club members can view documents for events they have access to
DROP POLICY IF EXISTS "Club members can view event documents" ON public.event_documents;
CREATE POLICY "Club members can view event documents"
    ON public.event_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.club_events e
            JOIN public.club_members cm ON cm.club_id = e.club_id
            WHERE e.id = event_documents.event_id
            AND cm.user_id = auth.uid()
            AND cm.is_active = true
        )
    );

-- Registered users can view documents if requires_registration is false or they're registered
DROP POLICY IF EXISTS "Registered users can view documents" ON public.event_documents;
CREATE POLICY "Registered users can view documents"
    ON public.event_documents FOR SELECT
    USING (
        requires_registration = false OR
        EXISTS (
            SELECT 1 FROM public.event_registrations er
            WHERE er.event_id = event_documents.event_id
            AND er.user_id = auth.uid()
            AND er.status IN ('approved', 'pending')
        )
    );

-- Club admins can manage documents
DROP POLICY IF EXISTS "Club admins can manage documents" ON public.event_documents;
CREATE POLICY "Club admins can manage documents"
    ON public.event_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.club_events e
            JOIN public.club_members cm ON cm.club_id = e.club_id
            WHERE e.id = event_documents.event_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'owner')
            AND cm.is_active = true
        )
    );

-- Club Event Earnings Policies
-- Club admins and owners can view earnings
DROP POLICY IF EXISTS "Club admins can view earnings" ON public.club_event_earnings;
CREATE POLICY "Club admins can view earnings"
    ON public.club_event_earnings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members cm
            WHERE cm.club_id = club_event_earnings.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'owner')
            AND cm.is_active = true
        )
    );

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_documents TO authenticated;
GRANT SELECT ON public.club_event_earnings TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_event_registration_stats(UUID) TO authenticated;
