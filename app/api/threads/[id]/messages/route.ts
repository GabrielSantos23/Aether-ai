import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";

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
    const { data: threadResult, error: threadError } = await supabase
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", session.user.id)
      .single();

    if (threadError || !threadResult) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get all messages for the thread
    const { data: result, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

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
        threadId: message.thread_id,
        userId: message.user_id,
        createdAt: new Date(message.created_at),
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
    const { data: threadResult, error: threadError } = await supabase
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", session.user.id)
      .single();

    if (threadError || !threadResult) {
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
    const { error: insertError } = await supabase.from("messages").insert({
      id,
      thread_id: threadId,
      user_id: session.user.id,
      content,
      role,
      created_at: createdAt
        ? new Date(createdAt).toISOString()
        : new Date().toISOString(),
      sources: sourcesJson,
      reasoning: reasoning || null,
    });

    if (insertError) {
      throw insertError;
    }

    // Verify the message was created with sources and reasoning
    const { data: verifyResult, error: verifyError } = await supabase
      .from("messages")
      .select("id, sources, reasoning")
      .eq("id", id)
      .single();

    if (verifyError) {
      console.error("Verification query error:", verifyError);
    } else {
      console.log("Verification query result:", {
        found: !!verifyResult,
        hasSourcesField: verifyResult && verifyResult.sources !== undefined,
        sourcesValue: verifyResult ? verifyResult.sources : null,
        hasReasoningField: verifyResult && verifyResult.reasoning !== undefined,
        reasoningPreview:
          verifyResult && verifyResult.reasoning
            ? verifyResult.reasoning.substring(0, 50) + "..."
            : null,
      });
    }

    // Update thread's last message timestamp
    const { error: updateError } = await supabase
      .from("threads")
      .update({
        last_message_at: createdAt
          ? new Date(createdAt).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId);

    if (updateError) {
      throw updateError;
    }

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
    const { data: threadResult, error: threadError } = await supabase
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", session.user.id)
      .single();

    if (threadError || !threadResult) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get deletion criteria from request body
    const { createdAt, gte: gteFlag = true } = await request.json();
    const dateToCompare = new Date(createdAt).toISOString();

    // Delete messages based on criteria
    let query = supabase.from("messages").delete().eq("thread_id", threadId);

    if (gteFlag) {
      query = query.gte("created_at", dateToCompare);
    } else {
      const nextTimestamp = new Date(
        new Date(createdAt).getTime() + 1
      ).toISOString();
      query = query.gte("created_at", nextTimestamp);
    }

    const { error: deleteError } = await query;
    if (deleteError) {
      throw deleteError;
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
