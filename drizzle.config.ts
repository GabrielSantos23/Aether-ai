import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

// NOTE: This file is kept for reference and migration purposes only.
// The application now uses Supabase client directly instead of drizzle-orm.

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `postgresql://${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(
          "https://",
          ""
        )}`
      : "",
  },
  verbose: true,
  strict: true,
  entities: {
    roles: {
      provider: "supabase",
    },
  },
});
