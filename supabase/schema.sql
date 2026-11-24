-- ==============================================================================
-- Supabase Production Database Schema for MangaPulse
-- User Profiles, Reading Library, Custom Collections, Subscriptions, Forum & RLS
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
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
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
    -- If supporter status is being changed, verify it comes from service_role
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
-- 2. Subscriptions & Entitlements Table (Server-Managed Only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('kofi', 'polar', 'lemonsqueezy', 'stripe')),
    provider_customer_id TEXT,
    provider_subscription_id TEXT UNIQUE,
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
-- 3. Reading Library Table
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
-- 4. Custom Collections Table
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
-- 5. Collection Manga Items
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
-- 6. Notifications Table
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
-- 7. Community Forum Tables
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
-- 8. Outbound Telemetry Table
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
-- Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manga_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_click_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Public viewable, authenticated update own profile (protected by role trigger)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions: Read-only for authenticated user; NO user insert or update (service_role only)
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Library
CREATE POLICY "Users can manage own library" ON public.user_manga_library FOR ALL USING (auth.uid() = user_id);

-- Collections
CREATE POLICY "Users can manage own collections" ON public.user_collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public collections viewable by anyone" ON public.user_collections FOR SELECT USING (is_private = false);

-- Collection Manga: Owner can manage; anyone can view items belonging to public collections
CREATE POLICY "Users can manage own collection items" ON public.collection_manga FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_collections WHERE id = collection_manga.collection_id AND user_id = auth.uid()));
CREATE POLICY "Public collection items viewable by anyone" ON public.collection_manga FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_collections WHERE id = collection_manga.collection_id AND is_private = false));

-- Notifications
CREATE POLICY "Users can manage own notifications" ON public.user_notifications FOR ALL USING (auth.uid() = user_id);

-- Forum
CREATE POLICY "Categories viewable by anyone" ON public.forum_categories FOR SELECT USING (true);
CREATE POLICY "Threads viewable by anyone" ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON public.forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own threads" ON public.forum_threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own threads" ON public.forum_threads FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Posts viewable by anyone" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = author_id);

-- Outbound Events: Anyone can insert tracking events; read is restricted
CREATE POLICY "Anyone can record outbound events" ON public.outbound_click_events FOR INSERT WITH CHECK (true);
