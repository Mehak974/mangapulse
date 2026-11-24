const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function fixGrants() {
  const envPath = path.join(__dirname, "..", ".env.local");
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^DATABASE_URL=(.+)$/m);
    if (match) dbUrl = match[1].trim();
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to PostgreSQL Supabase instance.");

  console.log("Granting permissions on public tables to anon, authenticated, and service_role...");
  await client.query(`
    -- Grant schema usage
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;

    -- Grant specific table permissions (RLS controls actual row access)
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
  `);

  console.log("Permissions granted successfully!");

  // Verify
  const res = await client.query(`
    SELECT grantee, table_name, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_schema = 'public' AND table_name = 'profiles'
    ORDER BY grantee;
  `);
  console.log("Updated grants on profiles:", res.rows);

  await client.end();
}

fixGrants().catch((err) => {
  console.error("Error fixing grants:", err);
  process.exit(1);
});
