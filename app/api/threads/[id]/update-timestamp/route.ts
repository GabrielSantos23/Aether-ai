import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { threads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/threads/[id]/update-timestamp - Update the last message timestamp for a thread
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Store threadId from params to avoid NextJS warning
    const threadId = params.id;

    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get timestamp data from request body
    const { lastMessageAt } = await request.json();

    // Check if the thread belongs to the user
    const threadResult = await db
      .select()
      .from(threads)
      .where(
        and(eq(threads.id, threadId), eq(threads.userId, session.user.id))
      );

    if (threadResult.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Update the thread's last message timestamp
    await db
      .update(threads)
      .set({
        lastMessageAt: lastMessageAt ? new Date(lastMessageAt) : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(threads.id, threadId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating thread timestamp:", error);
    return NextResponse.json(
      { error: "Failed to update thread timestamp" },
      { status: 500 }
    );
  }
}
