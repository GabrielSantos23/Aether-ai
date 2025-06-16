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
    const messageId = params.id;
    console.log("Sources API called for message ID:", messageId);

    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      console.log("Unauthorized: No session or user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", session.user.id);

    // Get sources data from request body
    const body = await request.json();
    const { sources } = body;

    console.log("Received sources data:", {
      messageId,
      sourcesCount: sources ? sources.length : 0,
      body: body,
    });

    if (!sources || !Array.isArray(sources)) {
      console.log("No valid sources data provided");
      return NextResponse.json(
        { error: "No valid sources data provided" },
        { status: 400 }
      );
    }

    // Check if this is a temporary ID (starts with "temp-")
    if (messageId.startsWith("temp-")) {
      console.log("Temporary message ID detected, cannot update in database");
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
      console.log("Querying database for message:", messageId);
      const messageResult = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId));

      console.log("Query result length:", messageResult.length);

      if (messageResult.length === 0) {
        console.log("Message not found:", messageId);
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }

      // Check if the message belongs to the user
      const message = messageResult[0];
      console.log("Message found:", {
        messageId: message.id,
        userId: message.userId,
        sessionUserId: session.user.id,
      });

      if (message.userId !== session.user.id) {
        console.log("Unauthorized: Message belongs to a different user");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Convert sources to JSON string
      const sourcesJson = sources.length > 0 ? JSON.stringify(sources) : null;
      console.log(
        "Prepared JSON for database:",
        sourcesJson ? "JSON string of length " + sourcesJson.length : "null"
      );

      // Update sources directly in the messages table
      console.log("Updating sources for message:", messageId);
      const updateResult = await db
        .update(messages)
        .set({
          sources: sourcesJson,
        })
        .where(eq(messages.id, messageId));

      console.log("Update operation completed");

      // Verify the update worked
      const verifyResult = await db
        .select({ sources: messages.sources })
        .from(messages)
        .where(eq(messages.id, messageId));

      console.log("Verification query result:", {
        found: verifyResult.length > 0,
        hasSourcesField:
          verifyResult.length > 0 && verifyResult[0].sources !== undefined,
        sourcesValue: verifyResult.length > 0 ? verifyResult[0].sources : null,
      });

      console.log("Sources updated successfully");
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("Database error while saving sources:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Error updating message sources:", error);
    return NextResponse.json(
      {
        error: "Failed to update message sources",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
