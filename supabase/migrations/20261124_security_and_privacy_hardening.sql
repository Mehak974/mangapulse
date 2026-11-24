-- ==============================================================================
-- Migration: 20261124_security_and_privacy_hardening.sql
-- Hardens RLS, protects private data, prevents enumeration, and secures webhooks
-- ==============================================================================

-- 1. Private Profiles RLS: Hide profile data if user toggled is_private = true
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (is_private = false OR auth.uid() = id);

-- 2. Move sensitive kofi_email to private user table (Zero anon leakage)
CREATE TABLE IF NOT EXISTS public.user_private_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    kofi_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.user_private_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own private settings" ON public.user_private_settings;
CREATE POLICY "Users can view own private settings" ON public.user_private_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own private settings" ON public.user_private_settings;
CREATE POLICY "Users can update own private settings" ON public.user_private_settings
    FOR ALL USING (auth.uid() = user_id);

-- Migrate existing kofi_email if present in profiles
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'kofi_email'
    ) THEN
        INSERT INTO public.user_private_settings (user_id, kofi_email)
        SELECT id, kofi_email FROM public.profiles WHERE kofi_email IS NOT NULL
        ON CONFLICT (user_id) DO UPDATE SET kofi_email = EXCLUDED.kofi_email;
    END IF;
END $$;

-- 3. Revoke get_user_id_by_email from anon and authenticated to eliminate email enumeration
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO service_role;

-- 4. Protect Forum Thread fields (authors cannot tamper with pinned/locked status or counters)
CREATE OR REPLACE FUNCTION public.protect_forum_thread_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('role', true) != 'service_role' THEN
        NEW.is_pinned := OLD.is_pinned;
        NEW.is_locked := OLD.is_locked;
        NEW.views_count := OLD.views_count;
        NEW.likes_count := OLD.likes_count;
        NEW.replies_count := OLD.replies_count;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_forum_threads ON public.forum_threads;
CREATE TRIGGER tr_protect_forum_threads
    BEFORE UPDATE ON public.forum_threads
    FOR EACH ROW EXECUTE FUNCTION public.protect_forum_thread_fields();

-- 5. Safe Unclaimed Ko-fi Payments table for atomic webhook resolution
CREATE TABLE IF NOT EXISTS public.unclaimed_kofi_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL UNIQUE,
    payer_email TEXT NOT NULL,
    tier TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    payload JSONB NOT NULL,
    is_claimed BOOLEAN DEFAULT false NOT NULL,
    claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.unclaimed_kofi_events ENABLE ROW LEVEL SECURITY;
-- Internal table: accessible only to service_role
