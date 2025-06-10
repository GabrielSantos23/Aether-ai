"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChat } from "@ai-sdk/react";
import { useUser } from "@/lib/hooks/useUser";
import { Provider } from "@/frontend/stores/APIKeyStore";
import { findModelConfig } from "@/lib/models";
import { toast } from "sonner";
import Messages from "./messages";
import InputComponent from "./input";
import { Message } from "ai";

export function ChatDetail() {
  const { id: initialChatId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(initialChatId);
  const [provider, setProvider] = useState<Provider>("google");
  const [model, setModel] = useState<string>("gemini-2.5-flash-preview-04-17");

  // Initialize chat with the Vercel AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  } = useChat({
    id: chatId, // Use chatId as the chat identifier
    api: "/api/chat",
    body: {
      chatId,
      provider,
      model,
    },
    onResponse: (response) => {
      // Get chat ID from response headers for new chats
      const newChatId = response.headers.get("x-chat-id");
      if (newChatId && !chatId) {
        setChatId(newChatId);
        // Navigate to the new chat
        navigate(`/chat/${newChatId}`, { replace: true });
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Error", {
        description: error.message,
      });
    },
    onFinish: (message) => {
      console.log("Message finished:", message);
    },
  });

  // Set default model on component mount
  useEffect(() => {
    const defaultModel = "Gemini 2.5 Flash";
    const modelConfig = findModelConfig(defaultModel);
    if (modelConfig) {
      setModel(modelConfig.modelId);
      setProvider(modelConfig.provider);
    }
  }, []);

  // Fetch chat history when component loads with an existing chat ID
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!initialChatId || !user) return;

      try {
        setIsLoadingHistory(true);
        const response = await fetch(`/api/chat/${initialChatId}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Chat not found or not owned by user
            navigate("/chat", { replace: true });
            return;
          }
          throw new Error(
            `Failed to fetch chat history: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Convert the messages to the format expected by useChat
        const chatMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          createdAt: new Date(msg.createdAt),
        }));

        // Set the messages in the chat
        setMessages(chatMessages);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchChatHistory();
  }, [initialChatId, user, navigate, setMessages]);

  useEffect(() => {
    if (error) {
      toast.error("Error", {
        description: error.message,
      });
    }
  }, [error]);

  return (
    <div className="flex flex-col relative ">
      <div className="h-[calc(100vh-60px)] ">
        <Messages
          messages={messages}
          isLoading={isLoading || isLoadingHistory}
        />
      </div>
      <InputComponent
        input={input}
        handleInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        provider={provider}
        setProvider={setProvider}
        model={model}
        setModel={setModel}
      />
    </div>
  );
}
