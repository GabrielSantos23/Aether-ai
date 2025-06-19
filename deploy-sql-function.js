#!/usr/bin/env node

/**
 * This script deploys the run_sql_query function to Supabase
 * Run with: node deploy-sql-function.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
  );
  process.exit(1);
}

// Use service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployFunction() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(
      __dirname,
      "drizzle",
      "migrations",
      "run_sql_query_function.sql"
    );
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    console.log("Deploying SQL function to Supabase...");

    // Execute the SQL directly
    const { data, error } = await supabase.rpc("exec_sql", { sql: sqlContent });

    if (error) {
      console.error("Error deploying function:", error);
      process.exit(1);
    }

    console.log("SQL function deployed successfully!");
    console.log(
      "You may need to create the exec_sql function first if it doesn't exist:"
    );
    console.log(`
-- Run this in the Supabase SQL Editor first:
CREATE OR REPLACE FUNCTION exec_sql(sql text) 
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
    `);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

deployFunction();
