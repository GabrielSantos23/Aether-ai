import { NextRequest, NextResponse } from "next/server";
import { createMessagesTable } from "@/lib/db/migrations/create-messages-table";
import { createAnonymousUser } from "@/lib/db/migrations/create-anonymous-user";

export async function GET(request: NextRequest) {
  try {
    // Check for a secret key to prevent unauthorized migrations
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get("key");

    if (!secretKey || secretKey !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the migrations
    await createMessagesTable();
    await createAnonymousUser();

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
