const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Error: Missing DATABASE_URL environment variable.");
    console.error("Please set DATABASE_URL in your environment before running migrations.");
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
