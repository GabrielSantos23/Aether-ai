import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chat, chatAccess, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

// GET: List all users who have access to this chat
export async function GET(
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
        { error: "Only the creator can view access permissions" },
        { status: 403 }
      );
    }

    // Get all users with access to this chat
    const accessResults = await db.query.chatAccess.findMany({
      where: eq(chatAccess.chatId, chatId),
    });

    // Get user details for each access entry
    const usersWithAccess = [];
    for (const access of accessResults) {
      const userData = await db.query.user.findFirst({
        where: eq(user.id, access.userId),
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
          username: true,
          displayUsername: true,
        },
      });

      if (userData) {
        usersWithAccess.push({
          ...userData,
          canWrite: access.canWrite,
        });
      }
    }

    return NextResponse.json({
      users: usersWithAccess,
    });
  } catch (error) {
    console.error("Error fetching chat access:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat access" },
      { status: 500 }
    );
  }
}

// POST: Grant access to a user
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

    const creatorId = session.user.id;

    // Get request body
    const { email, canWrite = false } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Get chat from database
    const chatResult = await db.query.chat.findFirst({
      where: eq(chat.id, chatId),
    });

    if (!chatResult) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is the creator of the chat
    if (chatResult.creatorId !== creatorId) {
      return NextResponse.json(
        { error: "Only the creator can grant access" },
        { status: 403 }
      );
    }

    // Find the user by email
    const userResult = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has access
    const existingAccess = await db.query.chatAccess.findFirst({
      where: and(
        eq(chatAccess.chatId, chatId),
        eq(chatAccess.userId, userResult.id)
      ),
    });

    if (existingAccess) {
      // Update existing access
      await db
        .update(chatAccess)
        .set({ canWrite })
        .where(
          and(
            eq(chatAccess.chatId, chatId),
            eq(chatAccess.userId, userResult.id)
          )
        );
    } else {
      // Create new access
      await db.insert(chatAccess).values({
        id: uuidv4(),
        chatId,
        userId: userResult.id,
        canWrite,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userResult.id,
        name: userResult.name,
        email: userResult.email,
        canWrite,
      },
    });
  } catch (error) {
    console.error("Error granting chat access:", error);
    return NextResponse.json(
      { error: "Failed to grant chat access" },
      { status: 500 }
    );
  }
}

// DELETE: Remove access from a user
export async function DELETE(
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

    const creatorId = session.user.id;

    // Get request body
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get chat from database
    const chatResult = await db.query.chat.findFirst({
      where: eq(chat.id, chatId),
    });

    if (!chatResult) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is the creator of the chat
    if (chatResult.creatorId !== creatorId) {
      return NextResponse.json(
        { error: "Only the creator can revoke access" },
        { status: 403 }
      );
    }

    // Delete access
    await db
      .delete(chatAccess)
      .where(and(eq(chatAccess.chatId, chatId), eq(chatAccess.userId, userId)));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error revoking chat access:", error);
    return NextResponse.json(
      { error: "Failed to revoke chat access" },
      { status: 500 }
    );
  }
}
