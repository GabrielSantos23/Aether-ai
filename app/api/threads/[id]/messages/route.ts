import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  messages,
  messageSources,
  threads,
  messageReasonings,
} from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Define SearchSource interface
interface SearchSource {
  id?: string;
  title?: string;
  url: string;
  snippet?: string;
}

// GET /api/threads/[id]/messages - Get all messages for a thread
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;

    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the thread belongs to the user
    const threadResult = await db
      .select()
      .from(threads)
      .where(
        and(eq(threads.id, threadId), eq(threads.userId, session.user.id))
      );

    if (threadResult.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get all messages for the thread
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);

    console.log(
      "Raw messages from database:",
      result.map((msg) => ({
        id: msg.id,
        role: msg.role,
        hasSourcesField: msg.sources !== undefined,
        sourcesType: msg.sources ? typeof msg.sources : "undefined",
        hasReasoningField: msg.reasoning !== undefined,
        reasoningType: msg.reasoning ? typeof msg.reasoning : "undefined",
      }))
    );

    // Process messages to ensure proper format
    const processedMessages = result.map((message) => {
      // Parse sources JSON if it exists
      let sources = [];
      if (message.sources) {
        try {
          sources = JSON.parse(message.sources);
          console.log(
            `Successfully parsed sources for message ${message.id}:`,
            sources.length > 0
              ? `${sources.length} sources found`
              : "Empty sources array"
          );
        } catch (e) {
          console.error(
            `Error parsing sources JSON for message ${message.id}:`,
            e
          );
          console.error("Raw sources value:", message.sources);
        }
      }

      // Create a properly formatted message with sources and reasoning
      return {
        ...message,
        sources,
        _reasoning: message.reasoning || "", // Add _reasoning field for client compatibility
      };
    });

    return NextResponse.json(processedMessages);
  } catch (error) {
    console.error("Error getting messages:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

// POST /api/threads/[id]/messages - Create a new message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;

    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the thread belongs to the user
    const threadResult = await db
      .select()
      .from(threads)
      .where(
        and(eq(threads.id, threadId), eq(threads.userId, session.user.id))
      );

    if (threadResult.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get message data from request body
    const {
      id,
      content,
      role,
      createdAt,
      sources = [],
      reasoning = "",
    } = await request.json();

    console.log("Creating message with data:", {
      id,
      threadId,
      userId: session.user.id,
      role,
      sourcesCount: sources.length,
      hasReasoning: !!reasoning,
      reasoningLength: reasoning ? reasoning.length : 0,
    });

    // Log the actual sources and reasoning data
    console.log("Sources data:", {
      count: sources.length,
      sources: sources,
    });

    console.log("Reasoning data:", {
      hasReasoning: !!reasoning,
      reasoningLength: reasoning ? reasoning.length : 0,
      reasoningPreview: reasoning
        ? reasoning.substring(0, 100) + "..."
        : "null",
    });

    // Stringify sources for storage
    let sourcesJson = null;
    try {
      // Ensure sources are properly serializable
      const cleanSources = sources.map((source: SearchSource) => ({
        id: source.id || null,
        title: source.title || null,
        url: source.url,
        snippet: source.snippet || null,
      }));

      sourcesJson = sources.length > 0 ? JSON.stringify(cleanSources) : null;
      console.log(
        "Sources JSON prepared:",
        sourcesJson ? "JSON string of length " + sourcesJson.length : "null"
      );
    } catch (jsonError) {
      console.error("Error stringifying sources:", jsonError);
      // Fallback to empty array if JSON stringify fails
      sourcesJson = "[]";
    }

    // Create the message with sources and reasoning directly in the row
    await db.insert(messages).values({
      id,
      threadId,
      userId: session.user.id,
      content,
      role,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      sources: sourcesJson,
      reasoning: reasoning || null,
    });

    // Verify the message was created with sources and reasoning
    const verifyResult = await db
      .select({
        id: messages.id,
        sources: messages.sources,
        reasoning: messages.reasoning,
      })
      .from(messages)
      .where(eq(messages.id, id));

    console.log("Verification query result:", {
      found: verifyResult.length > 0,
      hasSourcesField:
        verifyResult.length > 0 && verifyResult[0].sources !== undefined,
      sourcesValue: verifyResult.length > 0 ? verifyResult[0].sources : null,
      hasReasoningField:
        verifyResult.length > 0 && verifyResult[0].reasoning !== undefined,
      reasoningPreview:
        verifyResult.length > 0 && verifyResult[0].reasoning
          ? verifyResult[0].reasoning.substring(0, 50) + "..."
          : null,
    });

    // Update thread's last message timestamp
    await db
      .update(threads)
      .set({
        lastMessageAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(threads.id, threadId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

// DELETE /api/threads/[id]/messages - Delete messages from a thread
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;

    // Get the current user from the session
    const session = await auth.api.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the thread belongs to the user
    const threadResult = await db
      .select()
      .from(threads)
      .where(
        and(eq(threads.id, threadId), eq(threads.userId, session.user.id))
      );

    if (threadResult.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get deletion criteria from request body
    const { createdAt, gte: gteFlag = true } = await request.json();
    const dateToCompare = new Date(createdAt);

    // Delete messages based on criteria
    if (gteFlag) {
      await db
        .delete(messages)
        .where(
          and(
            eq(messages.threadId, threadId),
            gte(messages.createdAt, dateToCompare)
          )
        );
    } else {
      await db
        .delete(messages)
        .where(
          and(
            eq(messages.threadId, threadId),
            gte(messages.createdAt, new Date(dateToCompare.getTime() + 1))
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting messages:", error);
    return NextResponse.json(
      { error: "Failed to delete messages" },
      { status: 500 }
    );
  }
}
