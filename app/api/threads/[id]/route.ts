import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";

// GET /api/threads/[id] - Get a specific thread
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

    // Get the thread
    const { data: threadResult, error } = await supabase
      .from("threads")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Convert to camelCase for frontend
    const thread = {
      id: threadResult.id,
      title: threadResult.title,
      userId: threadResult.user_id,
      createdAt: threadResult.created_at,
      updatedAt: threadResult.updated_at,
      lastMessageAt: threadResult.last_message_at,
      isPublic: threadResult.is_public,
      isBranch: threadResult.is_branch,
    };

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Error getting thread:", error);
    return NextResponse.json(
      { error: "Failed to get thread" },
      { status: 500 }
    );
  }
}

// PATCH /api/threads/[id] - Update a thread
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get thread data from request body
    const { title, isBranch } = await request.json();

    // Prepare update data
    const updateData: any = { updated_at: new Date().toISOString() };
    if (title) updateData.title = title;
    if (isBranch !== undefined) updateData.is_branch = isBranch;

    // Update the thread
    const { error } = await supabase
      .from("threads")
      .update(updateData)
      .eq("id", params.id)
      .eq("user_id", session.user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating thread:", error);
    return NextResponse.json(
      { error: "Failed to update thread" },
      { status: 500 }
    );
  }
}

// DELETE /api/threads/[id] - Delete a thread
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the thread
    const { error } = await supabase
      .from("threads")
      .delete()
      .eq("id", params.id)
      .eq("user_id", session.user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting thread:", error);
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    );
  }
}
