#!/usr/bin/env node

const { Pool } = require("pg");
require("dotenv").config();

async function updateUserIdColumns() {
  // Create a database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log("Updating user_id columns in the database...");

  try {
    // Start a transaction
    await pool.query("BEGIN");

    // Get all tables in the database
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public';
    `);

    // For each table, check if it has a user_id column and drop any foreign key constraints
    for (const table of tablesResult.rows) {
      const tableName = table.tablename;

      // Check if this table has a user_id column
      const columnResult = await pool.query(
        `
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'user_id';
      `,
        [tableName]
      );

      if (columnResult.rows.length > 0) {
        console.log(
          `Table ${tableName} has a user_id column, checking for constraints...`
        );

        // Get all constraints for this table
        const constraintsResult = await pool.query(
          `
          SELECT con.conname as constraint_name
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
          WHERE rel.relname = $1
          AND att.attname = 'user_id'
          AND con.contype = 'f';
        `,
          [tableName]
        );

        // Drop each constraint
        for (const constraint of constraintsResult.rows) {
          console.log(
            `Dropping constraint ${constraint.constraint_name} from table ${tableName}...`
          );
          await pool.query(`
            ALTER TABLE "${tableName}" 
            DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";
          `);
        }
      }
    }

    // Alter the columns to change from UUID to TEXT
    console.log("Altering user_id columns to TEXT type...");

    // Check if threads table has user_id column
    const threadsColumnResult = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'threads' AND column_name = 'user_id';
    `);

    if (threadsColumnResult.rows.length > 0) {
      console.log(
        `Altering threads.user_id from ${threadsColumnResult.rows[0].data_type} to TEXT`
      );
      await pool.query(`
        ALTER TABLE threads 
        ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      `);
    }

    // Check if messages table has user_id column
    const messagesColumnResult = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'user_id';
    `);

    if (messagesColumnResult.rows.length > 0) {
      console.log(
        `Altering messages.user_id from ${messagesColumnResult.rows[0].data_type} to TEXT`
      );
      await pool.query(`
        ALTER TABLE messages 
        ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
      `);
    }

    // Commit the transaction
    await pool.query("COMMIT");
    console.log("Successfully updated user_id columns to TEXT type");
  } catch (error) {
    // Rollback the transaction on error
    await pool.query("ROLLBACK");
    console.error("Error updating user_id columns:", error);
    process.exit(1);
  } finally {
    // Close the connection
    await pool.end();
  }
}

updateUserIdColumns();
