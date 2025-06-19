import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";

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
    const { data: threadResult, error: threadError } = await supabase
      .from("threads")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (threadError || !threadResult) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get all message summaries for the thread
    const { data: summaries, error: summariesError } = await supabase
      .from("message_summaries")
      .select("*")
      .eq("thread_id", params.id)
      .order("created_at", { ascending: true });

    if (summariesError) {
      throw summariesError;
    }

    // Transform to camelCase for frontend compatibility
    const formattedSummaries = summaries.map((summary) => ({
      id: summary.id,
      threadId: summary.thread_id,
      messageId: summary.message_id,
      content: summary.content,
      createdAt: summary.created_at,
    }));

    return NextResponse.json(formattedSummaries);
  } catch (error) {
    console.error("Error getting message summaries:", error);
    return NextResponse.json(
      { error: "Failed to get message summaries" },
      { status: 500 }
    );
  }
}
