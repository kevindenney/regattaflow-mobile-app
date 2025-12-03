-- Migration: Add Public Publishing Tables
-- Description: Creates tables for microsite configuration, widget settings, and public access tracking
-- Date: 2025-12-02

-- ============================================================================
-- MICROSITE CONFIGURATION TABLE
-- Stores settings for auto-generated public regatta sites
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.club_microsites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    regatta_id UUID REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    -- URL Configuration
    subdomain TEXT UNIQUE,                           -- e.g., "dragon-worlds-2027"
    custom_domain TEXT,                              -- e.g., "worlds.dragonclass.org"
    slug TEXT NOT NULL,                              -- URL-safe identifier
    
    -- Branding
    theme JSONB DEFAULT '{}',                        -- colors, fonts, etc.
    logo_url TEXT,
    banner_url TEXT,
    favicon_url TEXT,
    
    -- Content Settings
    enabled_sections TEXT[] DEFAULT ARRAY['schedule', 'results', 'notices', 'documents'],
    default_section TEXT DEFAULT 'schedule',
    show_entry_list BOOLEAN DEFAULT true,
    show_weather BOOLEAN DEFAULT true,
    show_venue_map BOOLEAN DEFAULT true,
    
    -- Access Control
    public BOOLEAN DEFAULT true,
    password_protected BOOLEAN DEFAULT false,
    password_hash TEXT,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_club_regatta_microsite UNIQUE (club_id, regatta_id)
);

-- Index for fast subdomain/domain lookups
CREATE INDEX IF NOT EXISTS idx_microsites_subdomain ON public.club_microsites(subdomain);
CREATE INDEX IF NOT EXISTS idx_microsites_custom_domain ON public.club_microsites(custom_domain);
CREATE INDEX IF NOT EXISTS idx_microsites_club ON public.club_microsites(club_id);

-- ============================================================================
-- EMBEDDABLE WIDGETS TABLE
-- Tracks widget configurations for embedding on external sites
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.club_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    regatta_id UUID REFERENCES public.regattas(id) ON DELETE CASCADE,
    
    -- Widget Configuration
    widget_type TEXT NOT NULL CHECK (widget_type IN (
        'calendar',
        'results',
        'standings',
        'notices',
        'schedule',
        'entry_list',
        'countdown',
        'weather'
    )),
    name TEXT NOT NULL,
    
    -- Appearance
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    accent_color TEXT DEFAULT '#0EA5E9',
    width TEXT DEFAULT '100%',
    height TEXT DEFAULT 'auto',
    border_radius INTEGER DEFAULT 8,
    show_branding BOOLEAN DEFAULT true,
    custom_css TEXT,
    
    -- Data Filters
    filters JSONB DEFAULT '{}',                      -- e.g., {"division": "A", "limit": 10}
    
    -- Embed Configuration
    embed_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    allowed_domains TEXT[],                          -- CORS whitelist
    
    -- Analytics
    embed_count INTEGER DEFAULT 0,
    last_embedded_at TIMESTAMPTZ,
    impressions INTEGER DEFAULT 0,
    
    -- Metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for fast widget lookups
CREATE INDEX IF NOT EXISTS idx_widgets_embed_token ON public.club_widgets(embed_token);
CREATE INDEX IF NOT EXISTS idx_widgets_club ON public.club_widgets(club_id);
CREATE INDEX IF NOT EXISTS idx_widgets_type ON public.club_widgets(widget_type);

-- ============================================================================
-- PUBLIC ACCESS LOG TABLE
-- Tracks public page views for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.public_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Resource Identification
    resource_type TEXT NOT NULL CHECK (resource_type IN (
        'microsite',
        'widget',
        'api',
        'results',
        'schedule',
        'notices'
    )),
    resource_id UUID,
    regatta_id UUID REFERENCES public.regattas(id) ON DELETE SET NULL,
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    
    -- Access Details
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country_code TEXT,
    
    -- For widgets specifically
    widget_token TEXT,
    embedding_domain TEXT
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_access_log_regatta ON public.public_access_log(regatta_id);
CREATE INDEX IF NOT EXISTS idx_access_log_club ON public.public_access_log(club_id);
CREATE INDEX IF NOT EXISTS idx_access_log_accessed ON public.public_access_log(accessed_at);
CREATE INDEX IF NOT EXISTS idx_access_log_type ON public.public_access_log(resource_type);

-- Partition by month for performance (optional - depends on usage scale)
-- CREATE TABLE public.public_access_log_2025_12 PARTITION OF public.public_access_log
--     FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- ============================================================================
-- RACE NOTICES TABLE (if not exists)
-- For public notice board functionality
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.race_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    
    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Priority & Status
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'important', 'normal')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'entrants', 'members', 'private')),
    
    -- Timing
    published_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Author
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_race_notices_regatta ON public.race_notices(regatta_id);
CREATE INDEX IF NOT EXISTS idx_race_notices_visibility ON public.race_notices(visibility);
CREATE INDEX IF NOT EXISTS idx_race_notices_published ON public.race_notices(published_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.club_microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_notices ENABLE ROW LEVEL SECURITY;

-- Microsites: Public can read public microsites, club admins can manage
CREATE POLICY "Public microsites are viewable by anyone"
    ON public.club_microsites FOR SELECT
    USING (public = true);

CREATE POLICY "Club admins can manage microsites"
    ON public.club_microsites FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_members.club_id = club_microsites.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('admin', 'communications')
        )
    );

-- Widgets: Public can read active widgets (for embedding), club admins can manage
CREATE POLICY "Active widgets are viewable by anyone"
    ON public.club_widgets FOR SELECT
    USING (active = true);

CREATE POLICY "Club admins can manage widgets"
    ON public.club_widgets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_members.club_id = club_widgets.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('admin', 'communications')
        )
    );

-- Access log: Insert only for service role, club admins can read their own
CREATE POLICY "Service role can insert access logs"
    ON public.public_access_log FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Club admins can view their access logs"
    ON public.public_access_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_members.club_id = public_access_log.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('admin', 'communications')
        )
    );

-- Race notices: Public notices viewable by anyone, club staff can manage
CREATE POLICY "Public notices are viewable by anyone"
    ON public.race_notices FOR SELECT
    USING (visibility = 'public' AND published_at <= NOW());

CREATE POLICY "Club staff can manage notices"
    ON public.race_notices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_members.club_id = race_notices.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('admin', 'race_officer', 'communications')
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate a URL-safe slug from text
CREATE OR REPLACE FUNCTION generate_slug(input TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(input, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Increment view count for microsite
CREATE OR REPLACE FUNCTION increment_microsite_views(microsite_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.club_microsites
    SET view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE id = microsite_id;
END;
$$ LANGUAGE plpgsql;

-- Increment impression count for widget
CREATE OR REPLACE FUNCTION increment_widget_impressions(widget_token_param TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.club_widgets
    SET impressions = impressions + 1,
        last_embedded_at = NOW()
    WHERE embed_token = widget_token_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate slug for microsites
CREATE OR REPLACE FUNCTION auto_generate_microsite_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Try to use regatta name, fall back to club name
        IF NEW.regatta_id IS NOT NULL THEN
            SELECT generate_slug(name) INTO NEW.slug
            FROM public.regattas WHERE id = NEW.regatta_id;
        ELSE
            SELECT generate_slug(club_name) INTO NEW.slug
            FROM public.clubs WHERE id = NEW.club_id;
        END IF;
        
        -- Append random suffix if slug already exists
        IF EXISTS (SELECT 1 FROM public.club_microsites WHERE slug = NEW.slug AND id != NEW.id) THEN
            NEW.slug := NEW.slug || '-' || substr(md5(random()::text), 1, 6);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_microsite_slug
    BEFORE INSERT OR UPDATE ON public.club_microsites
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_microsite_slug();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_microsites_updated
    BEFORE UPDATE ON public.club_microsites
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_widgets_updated
    BEFORE UPDATE ON public.club_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_notices_updated
    BEFORE UPDATE ON public.race_notices
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.club_microsites TO anon;
GRANT SELECT ON public.club_widgets TO anon;
GRANT SELECT ON public.race_notices TO anon;

GRANT ALL ON public.club_microsites TO authenticated;
GRANT ALL ON public.club_widgets TO authenticated;
GRANT ALL ON public.race_notices TO authenticated;
GRANT INSERT ON public.public_access_log TO authenticated;

COMMENT ON TABLE public.club_microsites IS 'Configuration for auto-generated public regatta microsites';
COMMENT ON TABLE public.club_widgets IS 'Embeddable widget configurations for external sites';
COMMENT ON TABLE public.public_access_log IS 'Analytics tracking for public page and widget access';
COMMENT ON TABLE public.race_notices IS 'Official race committee notices for regattas';

