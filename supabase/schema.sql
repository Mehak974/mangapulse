-- ==============================================================================
-- Supabase Complete Schema for MangaPulse
-- User Profiles, Reading Library, Custom Collections, Subscriptions, Forum & RLS
-- (Idempotent for both fresh installs and existing databases)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_supporter BOOLEAN DEFAULT false NOT NULL,
    supporter_tier TEXT DEFAULT 'none' NOT NULL,
    kofi_email TEXT,
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created earlier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_supporter BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supporter_tier TEXT DEFAULT 'none' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kofi_email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_kofi_email 
    ON public.profiles(LOWER(kofi_email)) 
    WHERE kofi_email IS NOT NULL;

-- Trigger to automatically create profile on auth.users signup with collision protection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
BEGIN
    base_username := LOWER(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
    base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');
    IF base_username = '' THEN
        base_username := 'reader';
    END IF;

    final_username := base_username;

    -- Avoid duplicate username collision (append suffix if taken)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) THEN
        final_username := SUBSTRING(base_username FROM 1 FOR 16) || '_' || SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 5);
    END IF;

    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        final_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', final_username),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security trigger: Prevent users from self-assigning is_supporter or supporter_tier
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.is_supporter IS DISTINCT FROM NEW.is_supporter OR OLD.supporter_tier IS DISTINCT FROM NEW.supporter_tier) THEN
        IF current_setting('role', true) != 'service_role' THEN
            NEW.is_supporter := OLD.is_supporter;
            NEW.supporter_tier := OLD.supporter_tier;
        END IF;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_profile_roles ON public.profiles;
CREATE TRIGGER tr_protect_profile_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_roles();

-- ------------------------------------------------------------------------------
-- 2. Webhook Event Deduplication (Idempotency)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    payload_hash TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT webhook_event_unique UNIQUE (provider, event_id)
);

-- ------------------------------------------------------------------------------
-- 3. Subscriptions & Entitlements Table (Server-Managed Only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('kofi', 'polar', 'lemonsqueezy', 'stripe')),
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
    tier TEXT NOT NULL CHECK (tier IN ('coffee', 'supporter', 'legend')),
    amount_cents INTEGER NOT NULL DEFAULT 0,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_provider_unique UNIQUE (user_id, provider)
);

-- Trigger to sync active subscription status back to profiles table
CREATE OR REPLACE FUNCTION public.sync_subscription_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'active') THEN
        UPDATE public.profiles
        SET is_supporter = true,
            supporter_tier = NEW.tier,
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.user_id;
    ELSE
        UPDATE public.profiles
        SET is_supporter = false,
            supporter_tier = 'none',
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_subscription ON public.subscriptions;
CREATE TRIGGER tr_sync_subscription
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.sync_subscription_to_profile();

-- ------------------------------------------------------------------------------
-- 4. Reading Library Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_manga_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manga_id INTEGER NOT NULL,
    manga_slug TEXT NOT NULL,
    manga_title TEXT NOT NULL,
    manga_cover TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('reading', 'plan_to_read', 'completed', 'dropped')),
    progress_chapter INTEGER NOT NULL DEFAULT 0,
    total_chapters INTEGER,
    rating NUMERIC(3, 1) CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_manga_unique UNIQUE (user_id, manga_id)
);

-- ------------------------------------------------------------------------------
-- 5. Custom Collections Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_collection_name_unique UNIQUE (user_id, name)
);

-- ------------------------------------------------------------------------------
-- 6. Collection Manga Items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collection_manga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES public.user_collections(id) ON DELETE CASCADE,
    manga_id INTEGER NOT NULL,
    manga_slug TEXT NOT NULL,
    manga_title TEXT NOT NULL,
    manga_cover TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT collection_manga_unique UNIQUE (collection_id, manga_id)
);

-- ------------------------------------------------------------------------------
-- 7. Notifications Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manga_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    url TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    type TEXT DEFAULT 'release' NOT NULL CHECK (type IN ('release', 'countdown', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. Community Forum Tables
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forum_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.forum_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id TEXT NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    views_count INTEGER DEFAULT 0 NOT NULL,
    likes_count INTEGER DEFAULT 0 NOT NULL,
    replies_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. Outbound Telemetry Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outbound_click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publisher TEXT NOT NULL,
    manga_title TEXT,
    target_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_library_user_id ON public.user_manga_library(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_col_manga_collection ON public.collection_manga(collection_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_forum_threads_cat ON public.forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON public.forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON public.forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_outbound_pub ON public.outbound_click_events(publisher);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies (Safe drop before create)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manga_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_click_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own library" ON public.user_manga_library FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own collections" ON public.user_collections FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public collections viewable by anyone" ON public.user_collections;
CREATE POLICY "Public collections viewable by anyone" ON public.user_collections FOR SELECT USING (is_private = false);

DROP POLICY IF EXISTS "Users can manage own collection items" ON public.collection_manga;
CREATE POLICY "Users can manage own collection items" ON public.collection_manga FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_collections WHERE id = collection_manga.collection_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Public collection items viewable by anyone" ON public.collection_manga;
CREATE POLICY "Public collection items viewable by anyone" ON public.collection_manga FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_collections WHERE id = collection_manga.collection_id AND is_private = false));

DROP POLICY IF EXISTS "Users can manage own notifications" ON public.user_notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Categories viewable by anyone" ON public.forum_categories;
CREATE POLICY "Categories viewable by anyone" ON public.forum_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Threads viewable by anyone" ON public.forum_threads;
CREATE POLICY "Threads viewable by anyone" ON public.forum_threads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create threads" ON public.forum_threads;
CREATE POLICY "Authenticated users can create threads" ON public.forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own threads" ON public.forum_threads;
CREATE POLICY "Users can update own threads" ON public.forum_threads FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own threads" ON public.forum_threads;
CREATE POLICY "Users can delete own threads" ON public.forum_threads FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Posts viewable by anyone" ON public.forum_posts;
CREATE POLICY "Posts viewable by anyone" ON public.forum_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.forum_posts;
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.forum_posts;
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.forum_posts;
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Anyone can record outbound events" ON public.outbound_click_events;
CREATE POLICY "Anyone can record outbound events" ON public.outbound_click_events FOR INSERT WITH CHECK (true);
