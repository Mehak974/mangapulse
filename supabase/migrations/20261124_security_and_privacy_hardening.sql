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
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_private_settings_kofi_email 
    ON public.user_private_settings(LOWER(kofi_email)) 
    WHERE kofi_email IS NOT NULL;

ALTER TABLE public.user_private_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own private settings" ON public.user_private_settings;
CREATE POLICY "Users can view own private settings" ON public.user_private_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own private settings" ON public.user_private_settings;
CREATE POLICY "Users can update own private settings" ON public.user_private_settings
    FOR ALL USING (auth.uid() = user_id);

-- Migrate existing kofi_email if present in profiles, then drop from profiles
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'kofi_email'
    ) THEN
        INSERT INTO public.user_private_settings (user_id, kofi_email)
        SELECT id, LOWER(TRIM(kofi_email)) FROM public.profiles WHERE kofi_email IS NOT NULL
        ON CONFLICT (user_id) DO UPDATE SET kofi_email = EXCLUDED.kofi_email;

        DROP INDEX IF EXISTS public.idx_profiles_kofi_email;
        ALTER TABLE public.profiles DROP COLUMN IF EXISTS kofi_email;
    END IF;
END $$;

-- 3. Require confirmed email and revoke get_user_id_by_email from anon/authenticated
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
    matched_id UUID;
BEGIN
    SELECT id INTO matched_id 
    FROM auth.users 
    WHERE LOWER(email) = LOWER(user_email)
      AND email_confirmed_at IS NOT NULL
    LIMIT 1;
    RETURN matched_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO service_role;

-- 4. Protect Forum Threads & Posts
-- 4a. Forum Thread protection (cannot edit pinned/locked status or counters)
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

-- 4b. Forum Posts: Enforce thread is not locked when inserting; reset likes_count
CREATE OR REPLACE FUNCTION public.check_forum_post_insert()
RETURNS TRIGGER AS $$
DECLARE
    thread_locked BOOLEAN;
BEGIN
    SELECT is_locked INTO thread_locked FROM public.forum_threads WHERE id = NEW.thread_id;
    IF thread_locked IS TRUE AND current_setting('role', true) != 'service_role' THEN
        RAISE EXCEPTION 'Cannot post in a locked thread';
    END IF;
    NEW.likes_count := 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_forum_post_insert ON public.forum_posts;
CREATE TRIGGER tr_check_forum_post_insert
    BEFORE INSERT ON public.forum_posts
    FOR EACH ROW EXECUTE FUNCTION public.check_forum_post_insert();

-- 4c. Forum Posts: Protect likes_count, thread_id, author_id on update
CREATE OR REPLACE FUNCTION public.protect_forum_post_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('role', true) != 'service_role' THEN
        NEW.likes_count := OLD.likes_count;
        NEW.thread_id := OLD.thread_id;
        NEW.author_id := OLD.author_id;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_forum_posts ON public.forum_posts;
CREATE TRIGGER tr_protect_forum_posts
    BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW EXECUTE FUNCTION public.protect_forum_post_fields();

-- 5. Safe Unclaimed Ko-fi Payments table
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
CREATE INDEX IF NOT EXISTS idx_unclaimed_kofi_payer ON public.unclaimed_kofi_events(LOWER(payer_email)) WHERE is_claimed = false;
ALTER TABLE public.unclaimed_kofi_events ENABLE ROW LEVEL SECURITY;

-- 6. Atomic Claim Procedure for Unclaimed Payments when email is linked or verified
CREATE OR REPLACE FUNCTION public.claim_unclaimed_kofi_payments(target_user_id UUID, user_email TEXT)
RETURNS INTEGER AS $$
DECLARE
    claimed_count INTEGER := 0;
    unclaimed_rec RECORD;
    highest_tier TEXT := 'coffee';
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() != target_user_id AND current_setting('role', true) != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized to claim payments for another user';
    END IF;

    FOR unclaimed_rec IN 
        SELECT id, tier, amount_cents 
        FROM public.unclaimed_kofi_events 
        WHERE LOWER(payer_email) = LOWER(user_email) 
          AND is_claimed = false 
        FOR UPDATE
    LOOP
        IF unclaimed_rec.tier = 'legend' THEN
            highest_tier := 'legend';
        ELSIF unclaimed_rec.tier = 'supporter' AND highest_tier != 'legend' THEN
            highest_tier := 'supporter';
        END IF;

        UPDATE public.unclaimed_kofi_events
        SET is_claimed = true,
            claimed_by = target_user_id
        WHERE id = unclaimed_rec.id;

        claimed_count := claimed_count + 1;
    END LOOP;

    -- If unclaimed payments matched, insert/update active subscription (trigger tr_sync_subscription syncs to profiles)
    IF claimed_count > 0 THEN
        INSERT INTO public.subscriptions (
            user_id,
            provider,
            provider_customer_id,
            status,
            tier,
            current_period_end,
            updated_at
        )
        VALUES (
            target_user_id,
            'kofi',
            LOWER(user_email),
            'active',
            highest_tier,
            timezone('utc'::text, now()) + INTERVAL '32 days',
            timezone('utc'::text, now())
        )
        ON CONFLICT (user_id, provider) DO UPDATE
        SET status = 'active',
            tier = EXCLUDED.tier,
            current_period_end = timezone('utc'::text, now()) + INTERVAL '32 days',
            updated_at = timezone('utc'::text, now());
    END IF;

    RETURN claimed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
