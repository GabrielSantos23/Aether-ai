// Simple script to test database connection
const postgres = require("postgres");
require("dotenv").config();

async function testConnection() {
  console.log("Testing database connection...");

  // Get Supabase URL and key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
    process.exit(1);
  }

  // Extract host from Supabase URL
  const host =
    supabaseUrl.replace("https://", "").split(".")[0] + ".supabase.co";

  // Build connection string
  const connectionString = `postgresql://postgres:${supabaseKey}@${host}:5432/postgres`;

  console.log("Using Supabase connection");

  try {
    // Create connection with IPv4 preference
    const sql = postgres(connectionString, {
      prepare: false,
      connect_timeout: 30,
      // Try different ways to force IPv4
      ssl: { rejectUnauthorized: false }, // Add SSL options
    });

    // Test query
    const result = await sql`SELECT current_timestamp as time`;
    console.log("Connection successful!");
    console.log("Database time:", result[0].time);

    // Close connection
    await sql.end();
    console.log("Connection closed");
  } catch (error) {
    console.error("Connection failed:");
    console.error(error);
  }
}

testConnection();
