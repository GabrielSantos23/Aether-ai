import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { message } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { ANONYMOUS_USER_ID } from "@/lib/db/migrations/create-anonymous-user";

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { chatId, content, role, userId } = body;

    // Validate required fields
    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }
    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }
    if (!role || (role !== "user" && role !== "assistant")) {
      return NextResponse.json(
        { error: 'role must be either "user" or "assistant"' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = new Date();

    // Check if we need to create the anonymous user first
    try {
      // Use a valid user ID that exists in the database or the anonymous user ID
      const effectiveUserId = userId || ANONYMOUS_USER_ID;

      // Check if we need to create the anonymous user
      if (effectiveUserId === ANONYMOUS_USER_ID) {
        try {
          // Try to select the anonymous user to see if it exists
          const anonymousUser = await db.query.user.findFirst({
            where: (fields, { eq }) => eq(fields.id, ANONYMOUS_USER_ID),
          });

          // If the anonymous user doesn't exist, create it
          if (!anonymousUser) {
            try {
              await db.execute(sql`
                INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
                VALUES (${ANONYMOUS_USER_ID}, 'Anonymous', 'anonymous@example.com', true, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
              `);
              console.log("Created anonymous user for message association");
            } catch (createError) {
              console.error("Error creating anonymous user:", createError);
              // Continue anyway, another request might have created it
            }
          }
        } catch (checkError) {
          console.error("Error checking for anonymous user:", checkError);
          // Continue anyway
        }
      }

      // Insert the message with the effective user ID
      await db.insert(message).values({
        id,
        chatId,
        userId: effectiveUserId,
        role,
        content:
          typeof content === "object" ? JSON.stringify(content) : content,
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (dbError) {
      console.error("Database error when saving message:", dbError);

      // Check for specific database errors
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";

      if (errorMessage.includes("foreign key constraint")) {
        return NextResponse.json(
          {
            error:
              "Foreign key constraint failed. The chatId or userId may not exist.",
            details: errorMessage,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Database error when saving message",
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error saving message:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const messages = await db.query.message.findMany({
      where: (fields, { eq }) => eq(fields.chatId, chatId),
      orderBy: (fields, { asc }) => [asc(fields.createdAt)],
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return NextResponse.json(
      { error: "Failed to retrieve messages" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    await db.delete(message).where(eq(message.chatId, chatId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting messages:", error);
    return NextResponse.json(
      { error: "Failed to delete messages" },
      { status: 500 }
    );
  }
}
