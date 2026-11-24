const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        process.env.DATABASE_URL = match[1].trim();
      }
    }
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Error: Missing DATABASE_URL environment variable.");
    console.error("Please set DATABASE_URL in your environment or in .env.local before running migrations.");
    process.exit(1);
  }
  
  console.log("Connecting to PostgreSQL Supabase instance (session pooler port 5432)...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");

    const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying main schema...");
    await client.query(sql);
    console.log("Main schema applied successfully! All tables, RLS policies, and indexes created.");

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261124_production_hardening.sql');
    if (fs.existsSync(migrationPath)) {
      console.log("Applying production hardening migration...");
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      await client.query(migrationSql);
      console.log("Production hardening migration applied successfully!");
    }
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
