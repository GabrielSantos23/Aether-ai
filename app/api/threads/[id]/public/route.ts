import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { threads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authClient } from "@/lib/auth-client";

/**
 * POST /api/threads/[id]/public - Toggle the public status of a thread
 * Allows the creator to make a thread publicly accessible via link
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
        { error: "Only the creator can modify thread visibility" },
        { status: 403 }
      );
    }

    // Get the requested public state from the request body
    const { isPublic } = await req.json();

    if (typeof isPublic !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request, isPublic must be boolean" },
        { status: 400 }
      );
    }

    // Update the thread's public status
    await db.update(threads).set({ isPublic }).where(eq(threads.id, threadId));

    return NextResponse.json({
      success: true,
      isPublic,
    });
  } catch (error) {
    console.error("Error updating thread public status:", error);
    return NextResponse.json(
      { error: "Failed to update thread public status" },
      { status: 500 }
    );
  }
}
