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
      // Ignore auth errors - we'll handle unauthenticated users below
    }

    // Get chat from database
    const chatResult = await db.query.chat.findFirst({
      where: eq(chat.id, chatId),
    });

    if (!chatResult) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // If chat is not public and user is not authenticated, deny access
    if (!chatResult.isPublic && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If chat is not public and user is not creator or has no access, deny access
    if (!chatResult.isPublic && userId && chatResult.creatorId !== userId) {
      // Check if user has access to this chat
      const chatAccessResult = await db.query.chatAccess.findFirst({
        where: and(
          eq(chatAccess.chatId, chatId),
          eq(chatAccess.userId, userId)
        ),
      });

      if (!chatAccessResult) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Return chat's public status
    return NextResponse.json({
      isPublic: chatResult.isPublic,
      isCreator: userId ? chatResult.creatorId === userId : false,
    });
  } catch (error) {
    console.error("Error fetching chat public status:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat public status" },
      { status: 500 }
    );
  }
}
