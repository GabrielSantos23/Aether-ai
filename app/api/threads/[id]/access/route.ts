import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { threads, sharedThreads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authClient } from "@/lib/auth-client";

/**
 * GET /api/threads/[id]/access - Get access information for a thread
 * Returns if the current user is the creator and shared access info
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: session } = await authClient.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const threadId = params.id;

    // Get thread information
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check if user is creator
    const isCreator = thread.userId === userId;

    // Check if thread is public
    const isPublic = thread.isPublic || false;

    // Get shared users (if any)
    const sharedUsers = await db.query.sharedThreads.findMany({
      where: eq(sharedThreads.threadId, threadId),
    });

    const sharedWithEmails = sharedUsers.map((user) => user.userId);
    const isShared = sharedUsers.length > 0;

    // Check if user has access (either creator or shared with)
    const hasAccess =
      isCreator ||
      isPublic ||
      sharedUsers.some((user) => user.userId === userId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this thread" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isCreator,
      isShared,
      isPublic,
      sharedWith: isCreator ? sharedWithEmails : [],
      threadId,
    });
  } catch (error) {
    console.error("Error getting thread access:", error);
    return NextResponse.json(
      { error: "Failed to get thread access information" },
      { status: 500 }
    );
  }
}
