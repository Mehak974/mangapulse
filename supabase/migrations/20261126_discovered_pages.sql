-- Migration: 20261126_discovered_pages.sql
-- Table to store user-visited pages for dynamic sitemap indexing and search engine discovery

CREATE TABLE IF NOT EXISTS public.discovered_pages (
  url TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  title TEXT,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  visit_count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_discovered_pages_visited ON public.discovered_pages (last_visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_pages_path ON public.discovered_pages (path);

-- Enable Row Level Security (RLS)
ALTER TABLE public.discovered_pages ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated roles to select, insert, and update
CREATE POLICY "Allow public read discovered_pages" ON public.discovered_pages
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert discovered_pages" ON public.discovered_pages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update discovered_pages" ON public.discovered_pages
  FOR UPDATE USING (true);
