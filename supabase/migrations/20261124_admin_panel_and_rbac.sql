-- ==============================================================================
-- Migration: 20261124_admin_panel_and_rbac.sql
-- MangaPulse Admin Panel & Role-Based Access Control (RBAC)
-- Roles: USER, SUPPORTER, MODERATOR, ADMIN
-- Adds Audit Logs, Manga Overrides / DMCA Killswitch, Sitewide Broadcasts,
-- Forum Soft Deletion, and Telemetry Fields
-- ==============================================================================

-- 1. User Profiles Enhancements (Role & Telemetry)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_ip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_user_agent TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_ip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id);

-- Enforce valid roles constraint if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles 
            ADD CONSTRAINT profiles_role_check 
            CHECK (role IN ('USER', 'SUPPORTER', 'MODERATOR', 'ADMIN'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);

-- 2. Forum Soft-Delete Enhancements
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 4. Manga Overrides & DMCA Killswitch Table
CREATE TABLE IF NOT EXISTS public.manga_overrides (
    manga_slug TEXT PRIMARY KEY,
    is_delisted BOOLEAN DEFAULT false NOT NULL,
    status_override TEXT,
    next_chapter_override INTEGER,
    target_timestamp_override BIGINT,
    reason TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manga_overrides_delisted ON public.manga_overrides(is_delisted);

-- 5. Sitewide Broadcasts Table
CREATE TABLE IF NOT EXISTS public.sitewide_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    level TEXT DEFAULT 'info' NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sitewide_broadcasts_active ON public.sitewide_broadcasts(is_active);

-- 6. Helper Function: Check Admin / Mod privileges
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN false;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN false;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role IN ('ADMIN', 'MODERATOR')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update Profile Protection Trigger to protect 'role', 'is_banned', etc.
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Only service_role or authenticated ADMINs can modify protected administrative fields
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

-- 8. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitewide_broadcasts ENABLE ROW LEVEL SECURITY;

-- Audit Logs RLS: Only Admins can view
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR current_setting('role', true) = 'service_role');

-- Manga Overrides RLS: Anyone can view (for checking delisted/status), only staff can manage
DROP POLICY IF EXISTS "Anyone can view manga overrides" ON public.manga_overrides;
CREATE POLICY "Anyone can view manga overrides" ON public.manga_overrides
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage manga overrides" ON public.manga_overrides;
CREATE POLICY "Staff can manage manga overrides" ON public.manga_overrides
    FOR ALL USING (public.is_staff(auth.uid()) OR current_setting('role', true) = 'service_role');

-- Sitewide Broadcasts RLS: Anyone can view active broadcasts, only admins can manage
DROP POLICY IF EXISTS "Anyone can view active sitewide broadcasts" ON public.sitewide_broadcasts;
CREATE POLICY "Anyone can view active sitewide broadcasts" ON public.sitewide_broadcasts
    FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage sitewide broadcasts" ON public.sitewide_broadcasts;
CREATE POLICY "Admins can manage sitewide broadcasts" ON public.sitewide_broadcasts
    FOR ALL USING (public.is_admin(auth.uid()) OR current_setting('role', true) = 'service_role');

-- 9. Seed / Grant Admin Role to Mehak's accounts
UPDATE public.profiles 
SET role = 'ADMIN'
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE LOWER(email) IN ('mehakiqbal974@gmail.com', 'mehakiqbal978@gmail.com')
);

-- Ensure profiles exist for all auth.users if any were missing
INSERT INTO public.profiles (id, username, display_name, role)
SELECT 
    u.id, 
    LOWER(SPLIT_PART(u.email, '@', 1)), 
    COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
    CASE 
        WHEN LOWER(u.email) IN ('mehakiqbal974@gmail.com', 'mehakiqbal978@gmail.com') THEN 'ADMIN'
        ELSE 'USER'
    END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role;
