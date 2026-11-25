-- ==============================================================================
-- Migration: 20261126_security_telemetry_and_rbac_hardening.sql
-- 1. Hardens protect_profile_roles() against self-elevation of role, bans, and perks.
-- 2. Moves IP and User-Agent telemetry to private table user_security_telemetry
--    to prevent exposure via public profiles table.
-- ==============================================================================

-- 1. Ensure protect_profile_roles strictly protects role, bans, and supporter status
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        OLD.is_supporter IS DISTINCT FROM NEW.is_supporter OR 
        OLD.supporter_tier IS DISTINCT FROM NEW.supporter_tier OR
        OLD.role IS DISTINCT FROM NEW.role OR
        OLD.is_banned IS DISTINCT FROM NEW.is_banned OR
        OLD.is_shadow_banned IS DISTINCT FROM NEW.is_shadow_banned
    ) THEN
        IF current_setting('role', true) != 'service_role' 
           AND current_user NOT IN ('postgres', 'supabase_admin') 
           AND NOT public.is_admin(auth.uid()) THEN
            NEW.is_supporter := OLD.is_supporter;
            NEW.supporter_tier := OLD.supporter_tier;
            NEW.role := OLD.role;
            NEW.is_banned := OLD.is_banned;
            NEW.is_shadow_banned := OLD.is_shadow_banned;
        END IF;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_roles ON public.profiles;
CREATE TRIGGER tr_protect_profile_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_roles();

-- 2. Create private security telemetry table (zero anon leakage)
CREATE TABLE IF NOT EXISTS public.user_security_telemetry (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    signup_ip TEXT,
    last_login_ip TEXT,
    last_user_agent TEXT,
    last_login_at TIMESTAMPTZ,
    auth_provider TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_security_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin only access to telemetry" ON public.user_security_telemetry;
CREATE POLICY "Admin only access to telemetry" ON public.user_security_telemetry
    FOR ALL USING (
        current_setting('role', true) = 'service_role' 
        OR public.is_admin(auth.uid())
    );

-- Migrate any existing telemetry from profiles and remove public IP columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_login_ip'
    ) THEN
        INSERT INTO public.user_security_telemetry (user_id, signup_ip, last_login_ip, last_user_agent, last_login_at, auth_provider)
        SELECT id, signup_ip, last_login_ip, last_user_agent, last_login_at, auth_provider
        FROM public.profiles
        ON CONFLICT (user_id) DO UPDATE 
        SET last_login_ip = EXCLUDED.last_login_ip,
            last_user_agent = EXCLUDED.last_user_agent,
            last_login_at = EXCLUDED.last_login_at,
            auth_provider = COALESCE(public.user_security_telemetry.auth_provider, EXCLUDED.auth_provider);

        ALTER TABLE public.profiles DROP COLUMN IF EXISTS signup_ip;
        ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_login_ip;
        ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_user_agent;
    END IF;
END $$;
