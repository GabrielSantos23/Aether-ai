import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";

// PUT /api/messages/[id]/reasoning - Update reasoning for a message
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const messageId = context.params.id;

    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get reasoning data from request body
    const body = await request.json();
    const { reasoning } = body;

    if (!reasoning) {
      return NextResponse.json(
        { error: "No reasoning data provided" },
        { status: 400 }
      );
    }

    // Check if this is a temporary ID (starts with "temp-")
    if (messageId.startsWith("temp-")) {
      // For temporary messages, we'll return success but won't attempt to update the database
      // These messages will be replaced with permanent ones later
      return NextResponse.json({
        success: true,
        warning:
          "Temporary message ID - reasoning will be saved when the message is finalized",
      });
    }

    // Check if the message exists and belongs to the user
    try {
      const { data: messageResult, error: messageError } = await supabase
        .from("messages")
        .select("user_id")
        .eq("id", messageId)
        .single();

      if (messageError) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }

      // Check if the message belongs to the user
      if (messageResult.user_id !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Ensure reasoning is a string
      const safeReasoning = reasoning ? String(reasoning) : "";

      // Update reasoning directly in the messages table
      const { error: updateError } = await supabase
        .from("messages")
        .update({ reasoning: safeReasoning })
        .eq("id", messageId);

      if (updateError) {
        throw updateError;
      }

      // Verify the update worked
      const { data: verifyData, error: verifyError } = await supabase
        .from("messages")
        .select("reasoning")
        .eq("id", messageId)
        .single();

      if (verifyError) {
        console.error("Verification error:", verifyError);
      }

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("Database error while saving reasoning:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Error updating message reasoning:", error);
    return NextResponse.json(
      {
        error: "Failed to update message reasoning",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
