#!/usr/bin/env node

/**
 * This script tests the database connection for better-auth
 * Run with: node test-auth-connection.js
 */

const { Pool } = require("pg");
require("dotenv").config();

async function testConnection() {
  console.log("Testing database connection...");

  // Extract connection details from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
    process.exit(1);
  }

  // Create a PostgreSQL connection pool
  const pool = new Pool({
    host: supabaseUrl.replace("https://", "").split(".")[0] + ".supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: supabaseKey,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test the connection
    const client = await pool.connect();
    console.log("Database connection successful!");

    // Try a simple query
    const result = await client.query("SELECT current_timestamp");
    console.log("Query result:", result.rows[0]);

    // Release the client
    client.release();

    // End the pool
    await pool.end();

    console.log("Test completed successfully.");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
}

testConnection();
