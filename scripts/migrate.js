const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const connectionString = "postgresql://postgres.qykhdbpkylbhozuswnfp:itVkRFe8dI6KUP5b@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
  
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

    console.log("Applying schema...");
    await client.query(sql);
    console.log("Schema applied successfully! All tables, RLS policies, and indexes created.");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
