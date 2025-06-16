#!/usr/bin/env node

const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const { Pool } = require("pg");
const path = require("path");

async function runMigrations() {
  // Load environment variables
  require("dotenv").config();

  // Create a database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create a drizzle instance
  const db = drizzle(pool);

  // Run migrations
  console.log("Running migrations...");
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../drizzle/migrations"),
    });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  // Close the connection
  await pool.end();
}

runMigrations();
