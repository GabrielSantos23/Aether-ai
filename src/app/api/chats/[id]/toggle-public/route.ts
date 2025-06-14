import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;

    // Try to get the session
    let session;
    try {
      session = await auth.api.getSession(req);
    } catch (e) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get request body
    const { isPublic } = await req.json();

    // Get chat from database
    const chatResult = await db.query.chat.findFirst({
      where: eq(chat.id, chatId),
    });

    if (!chatResult) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is the creator of the chat
    if (chatResult.creatorId !== userId) {
      return NextResponse.json(
        { error: "Only the creator can change chat visibility" },
        { status: 403 }
      );
    }

    // Update chat visibility
    await db
      .update(chat)
      .set({ isPublic: isPublic === true })
      .where(eq(chat.id, chatId));

    return NextResponse.json({
      success: true,
      isPublic: isPublic === true,
    });
  } catch (error) {
    console.error("Error updating chat visibility:", error);
    return NextResponse.json(
      { error: "Failed to update chat visibility" },
      { status: 500 }
    );
  }
}
