import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { threads, sharedThreads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authClient } from "@/lib/auth-client";

/**
 * POST /api/threads/[id]/share - Share a thread with specific users
 * Allows the creator of a thread to share it with other users
 */
export async function POST(
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

    // Get the thread to check if user is owner
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check if user is the creator
    if (thread.userId !== userId) {
      return NextResponse.json(
        { error: "Only the creator can share this thread" },
        { status: 403 }
      );
    }

    // Get emails from request body
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "No valid emails provided" },
        { status: 400 }
      );
    }

    // Get existing shared users
    const existingSharedUsers = await db.query.sharedThreads.findMany({
      where: eq(sharedThreads.threadId, threadId),
    });

    const existingEmails = existingSharedUsers.map((user) => user.userId);

    // Filter out emails that are already shared
    const newEmails = emails.filter((email) => !existingEmails.includes(email));

    // Add new shared users
    if (newEmails.length > 0) {
      for (const email of newEmails) {
        await db.insert(sharedThreads).values({
          threadId,
          userId: email,
        });
      }
    }

    // Get all shared users after update
    const updatedSharedUsers = await db.query.sharedThreads.findMany({
      where: eq(sharedThreads.threadId, threadId),
    });

    const sharedWithEmails = updatedSharedUsers.map((user) => user.userId);

    return NextResponse.json({
      success: true,
      sharedWith: sharedWithEmails,
    });
  } catch (error) {
    console.error("Error sharing thread:", error);
    return NextResponse.json(
      { error: "Failed to share thread" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/threads/[id]/share/[email] - Remove a user's access to a thread
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; email: string } }
) {
  try {
    const { data: session } = await authClient.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const threadId = params.id;
    const emailToRemove = decodeURIComponent(params.email);

    // Get the thread to check if user is owner
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check if user is the creator
    if (thread.userId !== userId) {
      return NextResponse.json(
        { error: "Only the creator can modify sharing settings" },
        { status: 403 }
      );
    }

    // Remove the shared user
    await db
      .delete(sharedThreads)
      .where(
        and(
          eq(sharedThreads.threadId, threadId),
          eq(sharedThreads.userId, emailToRemove)
        )
      );

    // Get updated list of shared users
    const remainingSharedUsers = await db.query.sharedThreads.findMany({
      where: eq(sharedThreads.threadId, threadId),
    });

    const sharedWithEmails = remainingSharedUsers.map((user) => user.userId);

    return NextResponse.json({
      success: true,
      sharedWith: sharedWithEmails,
    });
  } catch (error) {
    console.error("Error removing shared access:", error);
    return NextResponse.json(
      { error: "Failed to remove shared access" },
      { status: 500 }
    );
  }
}
