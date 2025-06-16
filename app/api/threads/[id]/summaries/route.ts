import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageSummaries, threads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/threads/[id]/summaries - Get all message summaries for a thread
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the thread belongs to the user
    const threadResult = await db
      .select()
      .from(threads)
      .where(
        and(eq(threads.id, params.id), eq(threads.userId, session.user.id))
      );

    if (threadResult.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get all message summaries for the thread
    const summaries = await db
      .select()
      .from(messageSummaries)
      .where(eq(messageSummaries.threadId, params.id))
      .orderBy(messageSummaries.createdAt);

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Error getting message summaries:", error);
    return NextResponse.json(
      { error: "Failed to get message summaries" },
      { status: 500 }
    );
  }
}
