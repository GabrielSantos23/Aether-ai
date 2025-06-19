import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// POST /api/messages/[id]/summary - Create a summary for a message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Store messageId from params to avoid NextJS warning
    const messageId = params.id;

    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get summary data from request body
    const { threadId, content } = await request.json();

    // Check if the message exists and belongs to the user
    const { data: messageResult, error: messageError } = await supabase
      .from("messages")
      .select("user_id")
      .eq("id", messageId)
      .single();

    if (messageError) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if the message belongs to the user
    if (messageResult.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the summary
    const { error: insertError } = await supabase
      .from("message_summaries")
      .insert({
        id: uuidv4(),
        thread_id: threadId,
        message_id: messageId,
        content,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating message summary:", error);
    return NextResponse.json(
      { error: "Failed to create message summary" },
      { status: 500 }
    );
  }
}
