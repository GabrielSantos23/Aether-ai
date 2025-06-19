#!/usr/bin/env node

/**
 * This script tests the Supabase client connection
 * Run with: node test-supabase-connection.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function testSupabaseConnection() {
  console.log("Testing Supabase connection...");

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
    // Test the connection with a simple query
    console.log("Querying threads table...");
    const { data, error } = await supabase
      .from("threads")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    console.log("Supabase connection successful!");
    console.log("Query result:", data);

    console.log("Test completed successfully.");
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    process.exit(1);
  }
}

testSupabaseConnection();
