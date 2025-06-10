import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-uitls";

export async function GET(req: Request) {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Fetch all chats for the user
    const chats = await db
      .select()
      .from(schema.chat)
      .where(eq(schema.chat.userId, user.id))
      .orderBy(desc(schema.chat.updatedAt));

    // Return chats list
    return new Response(JSON.stringify({ chats }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
