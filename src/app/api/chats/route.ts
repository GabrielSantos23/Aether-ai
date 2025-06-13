import { NextRequest, NextResponse } from "next/server";
import * as chatService from "@/lib/db/chat-service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper to extract user from session (App Router)
async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.id || null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const chats = await chatService.getUserChats(userId);
    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const chatId = await chatService.createChat({ ...body, userId });
    return NextResponse.json({ chatId });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { chatId, updates } = body;
    // Convert string dates to Date objects for chat and messages
    const safeUpdates = { ...updates };
    if (safeUpdates.createdAt && typeof safeUpdates.createdAt === "string") {
      safeUpdates.createdAt = new Date(safeUpdates.createdAt);
    }
    if (safeUpdates.updatedAt && typeof safeUpdates.updatedAt === "string") {
      safeUpdates.updatedAt = new Date(safeUpdates.updatedAt);
    }
    if (Array.isArray(safeUpdates.messages)) {
      safeUpdates.messages = safeUpdates.messages.map((msg: any) => ({
        ...msg,
        createdAt:
          msg.createdAt && typeof msg.createdAt === "string"
            ? new Date(msg.createdAt)
            : msg.createdAt,
        updatedAt:
          msg.updatedAt && typeof msg.updatedAt === "string"
            ? new Date(msg.updatedAt)
            : msg.updatedAt,
      }));
      // If messages are present, use syncChatWithMessages to upsert them
      await chatService.syncChatWithMessages({
        ...safeUpdates,
        id: chatId,
        userId,
      });
    } else {
      await chatService.updateChat(chatId, safeUpdates);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { chatId } = await req.json();
    await chatService.deleteChat(chatId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
}
