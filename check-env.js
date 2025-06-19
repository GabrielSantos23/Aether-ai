#!/usr/bin/env node

/**
 * This script checks if all required environment variables are set
 * Run with: node check-env.js
 */

require("dotenv").config();

const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "BETTER_AUTH_SECRET",
];

const optionalVars = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "DATABASE_URL",
];

console.log("Checking environment variables...\n");

// Check required variables
let missingRequired = false;
console.log("Required variables:");
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName} is missing`);
    missingRequired = true;
  } else {
    console.log(`✅ ${varName} is set`);
  }
}

// Check optional variables
console.log("\nOptional variables:");
for (const varName of optionalVars) {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️ ${varName} is not set`);
  } else {
    console.log(`✅ ${varName} is set`);
  }
}

// Show DATABASE_URL format
console.log("\nDatabase URL format check:");
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log(`✅ Protocol: ${url.protocol}`);
    console.log(`✅ Host: ${url.hostname}`);
    console.log(`✅ Port: ${url.port || "default"}`);
    console.log(`✅ Path: ${url.pathname}`);
    console.log(`✅ Username: ${url.username ? "set" : "not set"}`);
    console.log(`✅ Password: ${url.password ? "set" : "not set"}`);
  } catch (error) {
    console.log(`❌ DATABASE_URL is not a valid URL: ${error.message}`);
  }
}

if (missingRequired) {
  console.log(
    "\n❌ Some required environment variables are missing. Please check your .env file."
  );
  process.exit(1);
} else {
  console.log("\n✅ All required environment variables are set.");
}
