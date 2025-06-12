import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";

export async function generateChatTitle(
  message: string,
  messageId: string,
  threadId: string
) {
  try {
    // Get the Google API key from the store
    const googleApiKey = useAPIKeyStore.getState().getKey("google");

    if (!googleApiKey) {
      console.warn("Google API key not found, skipping title generation");
      return "New Chat";
    }

    // Add a small delay to ensure store is fully initialized
    await new Promise((resolve) => setTimeout(resolve, 100));

    const response = await fetch("/api/completion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Google-API-Key": googleApiKey,
      },
      body: JSON.stringify({
        prompt: message,
        isTitle: true,
        messageId,
        threadId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate title: ${response.statusText}`);
    }

    const data = await response.json();
    return data.title || "New Chat";
  } catch (error) {
    console.error("Error generating chat title:", error);
    return "New Chat";
  }
}
