-- Supabase Complete Schema for MangaPulse
-- User Profiles, Reading Library, Custom Collections & Chapter Notifications

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Reading Library Table
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

-- 3. Custom Collections Table (Reference: custom reading lists e.g. "Favorites", "Peak Fiction")
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

-- 4. Collection Manga Items
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

-- 5. Notifications Table
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

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_library_user_id ON public.user_manga_library(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_col_manga_collection ON public.collection_manga(collection_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.user_notifications(user_id, is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manga_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Library Policies
CREATE POLICY "Users can manage own library" ON public.user_manga_library FOR ALL USING (auth.uid() = user_id);

-- Collections Policies
CREATE POLICY "Users can manage own collections" ON public.user_collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public collections viewable by anyone" ON public.user_collections FOR SELECT USING (is_private = false);

-- Collection Manga Policies
CREATE POLICY "Users can manage own collection items" ON public.collection_manga FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_collections WHERE id = collection_manga.collection_id AND user_id = auth.uid()));

-- Notifications Policies
CREATE POLICY "Users can manage own notifications" ON public.user_notifications FOR ALL USING (auth.uid() = user_id);
