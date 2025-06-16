import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, messageSummaries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
    const messageResult = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));

    if (messageResult.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if the message belongs to the user
    const message = messageResult[0];
    if (message.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the summary
    await db.insert(messageSummaries).values({
      id: uuidv4(),
      threadId,
      messageId: messageId,
      content,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating message summary:", error);
    return NextResponse.json(
      { error: "Failed to create message summary" },
      { status: 500 }
    );
  }
}
