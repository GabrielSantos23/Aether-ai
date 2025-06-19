import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";

// GET /api/threads - Get all threads for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all threads for the current user
    const { data: userThreads, error } = await supabase
      .from("threads")
      .select("*")
      .eq("user_id", session.user.id)
      .order("last_message_at", { ascending: true });

    if (error) {
      throw error;
    }

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
    const { id, title, isBranch = false } = await request.json();

    // Create the thread
    const { error } = await supabase.from("threads").insert({
      id,
      title,
      user_id: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      is_branch: isBranch,
    });

    if (error) {
      throw error;
    }

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
    const { error } = await supabase
      .from("threads")
      .delete()
      .eq("user_id", session.user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting threads:", error);
    return NextResponse.json(
      { error: "Failed to delete threads" },
      { status: 500 }
    );
  }
}
