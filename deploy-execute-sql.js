#!/usr/bin/env node

/**
 * This script deploys the execute_sql function to Supabase
 * Run with: node deploy-execute-sql.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function deployFunction() {
  console.log("Deploying execute_sql function to Supabase...");

  // Create a Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read the SQL file
    const sqlFilePath = path.join(
      __dirname,
      "drizzle",
      "migrations",
      "execute_sql_function.sql"
    );
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    console.log("SQL content loaded, executing...");

    // Execute the SQL directly through the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        sql_query: sqlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to deploy function: ${errorText}`);
    }

    console.log("SQL function deployed successfully!");
    console.log(
      "You can now use the execute_sql function in your application."
    );
  } catch (error) {
    console.error("Error deploying function:", error);
    process.exit(1);
  }
}

deployFunction();
