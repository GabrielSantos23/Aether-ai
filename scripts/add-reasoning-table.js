#!/usr/bin/env node

const { Pool } = require("pg");
require("dotenv").config();

async function addReasoningTable() {
  // Create a database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log("Adding message_reasonings table to the database...");

  try {
    // Start a transaction
    await pool.query("BEGIN");

    // Create the message_reasonings table
    console.log("Creating message_reasonings table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "message_reasonings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "message_id" uuid REFERENCES "messages"("id") ON DELETE CASCADE,
        "content" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Commit the transaction
    await pool.query("COMMIT");
    console.log("Successfully added message_reasonings table");
  } catch (error) {
    // Rollback the transaction on error
    await pool.query("ROLLBACK");
    console.error("Error adding message_reasonings table:", error);
    process.exit(1);
  } finally {
    // Close the connection
    await pool.end();
  }
}

addReasoningTable();
