import Chat from "@/frontend/components/Chat";
import { useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { getMessagesByThreadId } from "../dexie/queries";
import { type DBMessage } from "../dexie/db";
import { UIMessage } from "ai";
import { useDataService } from "@/frontend/hooks/useDataService";
import { useEffect, useState } from "react";
import { RightSidebar } from "../components/sidebar/RightSidebar";
import { SidebarButtonsRight } from "../components/sidebar/sidebar-buttons";

// Define ExtendedUIMessage interface to include sources and reasoning
interface ExtendedUIMessage extends UIMessage {
  sources?: any[];
  reasoning?: string;
}

export default function Thread() {
  const { id } = useParams();
  if (!id) throw new Error("Thread ID is required");

  const {
    dataService,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useDataService();
  const [serverMessages, setServerMessages] = useState<ExtendedUIMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [shouldTriggerAI, setShouldTriggerAI] = useState(false);

  // Local messages from IndexedDB (used when not authenticated)
  const localMessages = useLiveQuery(() => getMessagesByThreadId(id), [id]);

  // Fetch messages from server when authenticated
  useEffect(() => {
    const fetchServerMessages = async () => {
      if (!isAuthLoading && isAuthenticated && id) {
        try {
          setIsLoadingMessages(true);
          console.log("Fetching messages from server for thread:", id);
          const messages = await dataService.getMessagesByThreadId(id);
          console.log("Server messages:", messages);
          setServerMessages(convertToUIMessages(messages));
        } catch (error) {
          console.error("Error fetching messages from server:", error);
        } finally {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchServerMessages();
  }, [id, isAuthenticated, isAuthLoading, dataService]);

  const convertToUIMessages = (messages?: any[]): ExtendedUIMessage[] => {
    return (
      messages?.map((message) => ({
        id: message.id,
        role: message.role,
        parts: message.parts as UIMessage["parts"],
        content: message.content || "",
        createdAt: message.createdAt,
        sources: message.sources || [], // Include sources from DB messages
        reasoning: message.reasoning || "", // Include reasoning from DB messages
      })) || []
    );
  };

  // Use server messages if authenticated, otherwise use local messages
  const messagesToUse = isAuthenticated
    ? serverMessages
    : convertToUIMessages(localMessages);

  // Check if we need to trigger an AI response
  useEffect(() => {
    // Only proceed if we have messages and they've been loaded
    if (messagesToUse.length > 0 && !isLoadingMessages) {
      // Check if we have only user messages without any AI responses
      const hasUserMessages = messagesToUse.some((msg) => msg.role === "user");
      const hasAssistantMessages = messagesToUse.some(
        (msg) => msg.role === "assistant"
      );

      // If we have user messages but no assistant messages, we need to trigger the AI
      if (hasUserMessages && !hasAssistantMessages) {
        console.log(
          "Found user messages without AI response, will trigger AI..."
        );
        setShouldTriggerAI(true);
      }
    }
  }, [messagesToUse, isLoadingMessages]);

  return (
    <div className="relative w-full">
      <Chat
        key={id}
        threadId={id}
        initialMessages={messagesToUse}
        isLoadingMessages={isLoadingMessages}
        autoSubmitFirstUserMessage={shouldTriggerAI}
      />
      <SidebarButtonsRight threadId={id} />
    </div>
  );
}
