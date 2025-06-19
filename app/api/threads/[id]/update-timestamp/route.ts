import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";

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
    const { data: threadResult, error: threadError } = await supabase
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", session.user.id)
      .single();

    if (threadError || !threadResult) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Update the thread's last message timestamp
    const { error: updateError } = await supabase
      .from("threads")
      .update({
        last_message_at: lastMessageAt
          ? new Date(lastMessageAt).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating thread timestamp:", error);
    return NextResponse.json(
      { error: "Failed to update thread timestamp" },
      { status: 500 }
    );
  }
}
