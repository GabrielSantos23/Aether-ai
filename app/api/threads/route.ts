import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { threads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/threads - Get all threads for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all threads for the current user
    const userThreads = await db
      .select()
      .from(threads)
      .where(eq(threads.userId, session.user.id))
      .orderBy(threads.lastMessageAt);

    return NextResponse.json(userThreads.reverse());
  } catch (error) {
    console.error("Error getting threads:", error);
    return NextResponse.json(
      { error: "Failed to get threads" },
      { status: 500 }
    );
  }
}

// POST /api/threads - Create a new thread
export async function POST(request: NextRequest) {
  try {
    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get thread data from request body
    const { id, title } = await request.json();

    // Create the thread
    await db.insert(threads).values({
      id,
      title,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

// DELETE /api/threads - Delete all threads for the current user
export async function DELETE(request: NextRequest) {
  try {
    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all threads for the current user
    await db.delete(threads).where(eq(threads.userId, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting threads:", error);
    return NextResponse.json(
      { error: "Failed to delete threads" },
      { status: 500 }
    );
  }
}
