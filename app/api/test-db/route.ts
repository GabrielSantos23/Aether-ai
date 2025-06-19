import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import postgres from "postgres";

export async function GET() {
  try {
    // Get the database URL
    const databaseUrl = process.env.DATABASE_URL || "";

    // Log connection details (without password)
    const sanitizedUrl = databaseUrl.replace(
      /\/\/[^:]+:[^@]+@/,
      "//[REDACTED]:[REDACTED]@"
    );

    // Try to connect directly with postgres
    const sql = postgres(databaseUrl, {
      prepare: false,
      connect_timeout: 60,
      ssl: { rejectUnauthorized: false },
    });

    // Test the connection
    const result = await sql`SELECT current_timestamp as time`;

    // Close the connection
    await sql.end();

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      time: result[0].time,
      connectionUrl: sanitizedUrl,
      env: process.env.NODE_ENV,
    });
  } catch (error: any) {
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: {
          message: error.message,
          code: error.code,
          errno: error.errno,
          syscall: error.syscall,
          hostname: error.hostname,
        },
      },
      { status: 500 }
    );
  }
}
