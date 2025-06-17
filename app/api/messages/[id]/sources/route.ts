import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PUT /api/messages/[id]/sources - Update sources for a message
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = await Promise.resolve(params.id);
    console.log("Sources API called for message ID:", messageId);

    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      console.log("Unauthorized: No session or user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sources data from request body
    const body = await request.json();
    const { sources } = body;

    if (!sources || !Array.isArray(sources)) {
      console.log("No valid sources data provided");
      return NextResponse.json(
        { error: "No valid sources data provided" },
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
          "Temporary message ID - sources will be saved when the message is finalized",
      });
    }

    // Check if the message exists and belongs to the user
    try {
      const messageResult = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId));

      if (messageResult.length === 0) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }

      // Check if the message belongs to the user
      const message = messageResult[0];

      if (message.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Convert sources to JSON string
      const sourcesJson = sources.length > 0 ? JSON.stringify(sources) : null;

      // Update sources directly in the messages table
      const updateResult = await db
        .update(messages)
        .set({
          sources: sourcesJson,
        })
        .where(eq(messages.id, messageId));

      // Verify the update worked
      const verifyResult = await db
        .select({ sources: messages.sources })
        .from(messages)
        .where(eq(messages.id, messageId));

      return NextResponse.json({ success: true });
    } catch (dbError) {
      throw dbError;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update message sources",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
