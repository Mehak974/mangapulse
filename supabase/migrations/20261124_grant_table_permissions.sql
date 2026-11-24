-- ==============================================================================
-- Migration: 20261124_grant_table_permissions.sql
-- Grant proper table access to anon, authenticated, and service_role
-- (Row Level Security controls individual row-level visibility and mutations)
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_manga_library TO authenticated;
GRANT SELECT ON public.user_manga_library TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_collections TO authenticated;
GRANT SELECT ON public.user_collections TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_manga TO authenticated;
GRANT SELECT ON public.collection_manga TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_threads TO authenticated;
GRANT SELECT ON public.forum_threads TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT SELECT ON public.forum_posts TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_private_settings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manga_overrides TO authenticated;
GRANT SELECT ON public.manga_overrides TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sitewide_broadcasts TO authenticated;
GRANT SELECT ON public.sitewide_broadcasts TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
