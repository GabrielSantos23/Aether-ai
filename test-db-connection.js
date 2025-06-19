// Simple script to test database connection
const postgres = require("postgres");

async function testConnection() {
  console.log("Testing database connection...");

  // Connection string
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:gabriel.gs605@db.dggczdgoepdxmkwzoafl.supabase.co:5432/postgres";

  console.log("Using connection string:", connectionString);

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
