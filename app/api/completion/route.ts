import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const headersList = headers();
  const googleApiKey = headersList.get("X-Google-API-Key");

  if (!googleApiKey) {
    console.error("Missing Google API key in request headers");
    return NextResponse.json(
      {
        error: "Google API key is required to enable chat title generation.",
      },
      { status: 400 }
    );
  }

  try {
    const { prompt, isTitle, messageId, threadId } = await req.json();

    if (!prompt) {
      console.error("Missing prompt in request body");
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log(
      `Generating title for ${isTitle ? "thread" : "message"}: ${threadId}`
    );

    const google = createGoogleGenerativeAI({
      apiKey: googleApiKey,
    });

    const { text: title } = await generateText({
      model: google("gemini-2.5-flash-preview-04-17"),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - you should NOT answer the user's message, you should only generate a summary/title
      - do not use quotes or colons`,
      prompt,
    });

    console.log(
      `Generated title: "${title}" for ${
        isTitle ? "thread" : "message"
      }: ${threadId}`
    );

    return NextResponse.json({
      title,
      isTitle: isTitle || false,
      messageId,
      threadId,
    });
  } catch (error) {
    console.error("Failed to generate title:", error);
    return NextResponse.json(
      { error: "Failed to generate title", details: String(error) },
      { status: 500 }
    );
  }
}
