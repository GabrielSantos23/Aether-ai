// Script to add sources and reasoning columns to the messages table
require("dotenv").config();
const { Pool } = require("pg");

// Create a PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addColumnsToMessagesTable() {
  try {
    console.log(
      "Adding sources and reasoning columns to the messages table..."
    );

    // Connect to the database
    const client = await pool.connect();

    try {
      // Create the columns
      console.log("Adding columns...");
      const query = `
        ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sources" TEXT;
        ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "reasoning" TEXT;
      `;

      await client.query(query);
      console.log(
        "Successfully added sources and reasoning columns to messages table"
      );
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error("Error adding columns to messages table:", error);
    process.exit(1);
  } finally {
    // End the pool
    await pool.end();
  }
}

// Run the function
addColumnsToMessagesTable();
