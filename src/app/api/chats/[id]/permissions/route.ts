import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chat, chatAccess } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    let userId = null;

    try {
      // Try to get the session, but don't require it
      const session = await auth.api.getSession(req);
      userId = session?.user?.id;
    } catch (e) {
      // If no session, return unauthorized
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If no user ID, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chat from database
    const chatResult = await db.query.chat.findFirst({
      where: eq(chat.id, chatId),
    });

    if (!chatResult) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is the creator of the chat
    const isCreator = chatResult.creatorId === userId;

    // If user is creator, they have full permissions
    if (isCreator) {
      return NextResponse.json({
        canWrite: true,
        isCreator: true,
      });
    }

    // If chat is public, check if user has explicit write permission
    if (chatResult.isPublic) {
      // Check if user has explicit write access
      const accessResult = await db.query.chatAccess.findFirst({
        where: and(
          eq(chatAccess.chatId, chatId),
          eq(chatAccess.userId, userId)
        ),
      });

      return NextResponse.json({
        canWrite: accessResult?.canWrite || false,
        isCreator: false,
      });
    }

    // If chat is private, check if user has any access
    const accessResult = await db.query.chatAccess.findFirst({
      where: and(eq(chatAccess.chatId, chatId), eq(chatAccess.userId, userId)),
    });

    if (!accessResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      canWrite: accessResult.canWrite,
      isCreator: false,
    });
  } catch (error) {
    console.error("Error checking chat permissions:", error);
    return NextResponse.json(
      { error: "Failed to check chat permissions" },
      { status: 500 }
    );
  }
}
