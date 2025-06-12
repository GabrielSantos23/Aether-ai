"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import {
  useChatStore,
  Chat as ChatType,
  Message as StoredMessage,
} from "@/frontend/stores/ChatStore";
import { generateChatTitle } from "@/frontend/services/ChatService";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";

function errorHandler(error: unknown) {
  if (error == null) {
    return "Unknown error occurred";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

interface Source {
  id: string;
  sourceType: string;
  title?: string;
  url?: string;
}

export function Chat() {
  const { id: chatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [useThinking, setUseThinking] = useState<boolean>(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedModel, setSelectedModel] =
    useState<string>("Gemini 2.5 Flash");
  const [messageToSourcesMap, setMessageToSourcesMap] = useState<
    Record<string, Source[]>
  >({});
  const [messageToReasoningMap, setMessageToReasoningMap] = useState<
    Record<string, string>
  >({});
  const [reasoningUpdateTimestamps, setReasoningUpdateTimestamps] = useState<
    Record<string, number>
  >({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const apiKeyStore = useAPIKeyStore();
  const { createChat, getChat, addMessage, updateChatTitle, setActiveChat } =
    useChatStore();
  const { findModelConfig } = require("@/lib/models");
  const modelConfig = findModelConfig(selectedModel);
  const provider = modelConfig?.provider || "google";
  const apiKey = apiKeyStore.getKey(provider);

  const supportsWebSearch = modelConfig?.supportsWebSearch || false;
  const supportsThinking = modelConfig?.supportsThinking || false;

  const effectiveWebSearch = supportsWebSearch && useWebSearch;
  const effectiveThinking = supportsThinking && useThinking;

  // Initialize chat or redirect if invalid ID
  useEffect(() => {
    const initializeChat = async () => {
      // Reset state when chatId changes
      setInitialMessages([]);
      setMessageToSourcesMap({});
      setMessageToReasoningMap({});
      setReasoningUpdateTimestamps({});
      setSources([]);

      if (chatId) {
        const existingChat = getChat(chatId);
        if (!existingChat) {
          // If the chat doesn't exist (invalid ID), redirect to a new chat
          navigate("/chat");
        } else {
          setActiveChat(chatId);

          // Convert stored messages to AI SDK format
          const initialMsgs = existingChat.messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            createdAt: new Date(msg.createdAt),
          }));

          setInitialMessages(initialMsgs);
          setIsInitialized(true);
        }
      } else {
        // No chatId in URL means we're on the /chat route (new chat)
        // Don't create a chat yet - wait for the first message
        setActiveChat(null);
        setInitialMessages([]);
        setIsInitialized(true);
      }
    };

    initializeChat();

    // Listen for popstate events (back/forward browser navigation)
    const handlePopState = () => {
      const pathParts = window.location.pathname.split("/");
      const newChatId =
        pathParts[pathParts.length - 1] === "chat"
          ? null
          : pathParts[pathParts.length - 1];

      if (newChatId !== chatId) {
        setIsInitialized(false);
        // Let the effect handle the rest
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Cleanup function
    return () => {
      window.removeEventListener("popstate", handlePopState);
      setIsInitialized(false);
      setInitialMessages([]);
    };
  }, [chatId, navigate, getChat, setActiveChat]);

  const {
    messages,
    input,
    handleInputChange: originalHandleInputChange,
    handleSubmit: aiSdkHandleSubmit,
    isLoading,
    error,
    data,
  } = useChat({
    initialMessages,
    body: {
      apiKey,
      selectedModel,
      useWebSearch: effectiveWebSearch,
      useThinking: effectiveThinking,
    },
    onResponse: (response) => {
      console.log("Response received, waiting for sources...");
    },
    onFinish: async (message) => {
      if (message.role === "assistant" && chatId) {
        console.log("Message finished, processing sources:", message.id);

        // Save the assistant message to our store
        addMessage(chatId, message.content, "assistant");

        extractSourcesFromRawContent(message.content, message.id);

        if (data && Array.isArray(data)) {
          const sourcesFromData = data
            .filter(
              (item: any) =>
                item &&
                typeof item === "object" &&
                item.type === "source" &&
                item.source
            )
            .map((item: any) => item.source);

          if (sourcesFromData.length > 0) {
            console.log("Sources found in data:", sourcesFromData);
            setMessageToSourcesMap((prev) => ({
              ...prev,
              [message.id]: sourcesFromData,
            }));
          }
        }

        if (useThinking && selectedModel.includes("Deepseek")) {
          try {
            const reasoningMatch = message.content.match(
              /### My reasoning:([\s\S]+?)(?=### Final answer:|$)/
            );
            if (reasoningMatch && reasoningMatch[1]) {
              const reasoning = reasoningMatch[1].trim();
              processReasoningData(reasoning, message.id);

              const cleanedContent = message.content.replace(
                /### My reasoning:[\s\S]+?(?=### Final answer:|$)/,
                ""
              );
              const finalContent = cleanedContent
                .replace(/### Final answer:/, "")
                .trim();

              if (finalContent !== message.content) {
                message.content = finalContent;
              }
            }
          } catch (error) {
            console.error(
              "Error extracting reasoning from OpenRouter model:",
              error
            );
          }
        }

        if (useThinking) {
          try {
            const reasoningMatch = message.content.match(
              /### My reasoning:([\s\S]+?)(?=### Final answer:|$)/
            );
            if (reasoningMatch && reasoningMatch[1]) {
              const reasoning = reasoningMatch[1].trim();
              processReasoningData(reasoning, message.id);

              const cleanedContent = message.content.replace(
                /### My reasoning:[\s\S]+?(?=### Final answer:|$)/,
                ""
              );
              const finalContent = cleanedContent
                .replace(/### Final answer:/, "")
                .trim();

              if (finalContent !== message.content) {
                message.content = finalContent;
              }
            }
          } catch (error) {
            console.error("Error extracting reasoning:", error);
          }
        }
      }
    },
    id: chatId || undefined,
  });

  // Custom handleSubmit that integrates with our chat store
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || !isInitialized || isLoading) return;

    let currentChatId = chatId;

    // If we don't have an active chat, create one but don't navigate yet
    if (!currentChatId) {
      currentChatId = createChat();

      // Update URL without causing a navigation/reload
      window.history.pushState({}, "", `/chat/${currentChatId}`);

      // Update active chat
      setActiveChat(currentChatId);
    }

    // Save the message to our store
    const messageId = addMessage(currentChatId, input, "user");

    // Call the AI SDK's submit handler
    aiSdkHandleSubmit(e);

    // Generate title asynchronously for first message
    const chat = getChat(currentChatId);
    if (chat && chat.messages.length === 1) {
      try {
        const title = await generateChatTitle(input, messageId, currentChatId);
        updateChatTitle(currentChatId, title);
      } catch (error) {
        console.error("Failed to generate chat title:", error);
      }
    }
  };

  // Handle errors from the AI SDK
  useEffect(() => {
    if (error) {
      console.error("Chat error details:", errorHandler(error));

      const errorMessage = error.message?.toLowerCase() || "";
      if (
        errorMessage.includes("api key") ||
        errorMessage.includes("apikey") ||
        errorMessage.includes("authentication")
      ) {
        toast.error("API key error. Please check your API key in settings.");
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("timed out")
      ) {
        toast.error("Request timed out. Please try again.");
      }
    }
  }, [error]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      console.log("Processing streaming data:", data);

      const lastUserMessage = messages.filter((m) => m.role === "user").pop();
      if (!lastUserMessage) return;

      const assistantMessageIndex = messages.findIndex(
        (m, index) =>
          m.role === "user" &&
          m.id === lastUserMessage.id &&
          index < messages.length - 1 &&
          messages[index + 1]?.role === "assistant"
      );

      const assistantMessage =
        assistantMessageIndex >= 0 ? messages[assistantMessageIndex + 1] : null;

      if (assistantMessage) {
        const sources: Source[] = [];

        data.forEach((item: any) => {
          if (
            item &&
            typeof item === "object" &&
            item.type === "source" &&
            item.source
          ) {
            const source: Source = {
              id: item.source.id || Math.random().toString(),
              sourceType: item.source.sourceType || "url",
              title: item.source.title || "",
              url: item.source.url || "",
            };

            if (!sources.some((s) => s.id === source.id)) {
              sources.push(source);
            }
          }
        });

        if (sources.length > 0) {
          console.log(
            `Found ${sources.length} sources for assistant message ${assistantMessage.id}`,
            sources
          );

          setMessageToSourcesMap((prev) => ({
            ...prev,
            [assistantMessage.id]: sources,
          }));

          setSources((prev) => {
            const newSources = [...prev];
            sources.forEach((source) => {
              if (!newSources.some((s) => s.id === source.id)) {
                newSources.push(source);
              }
            });
            return newSources;
          });
        }

        data.forEach((item: any) => {
          if (
            item &&
            typeof item === "object" &&
            item.type === "reasoning" &&
            item.text
          ) {
            console.log("Received reasoning data:", item.text);
            setMessageToReasoningMap((prev) => ({
              ...prev,
              [assistantMessage.id]: item.text,
            }));

            setReasoningUpdateTimestamps((prev) => ({
              ...prev,
              [`_lastUpdate_${assistantMessage.id}`]: Date.now(),
            }));
          }
        });

        if (
          selectedModel.includes("Deepseek") &&
          useThinking &&
          assistantMessage.content
        ) {
          const reasoningMatch = assistantMessage.content.match(
            /### My reasoning:([\s\S]+?)(?=### Final answer:|$)/
          );

          if (reasoningMatch && reasoningMatch[1]) {
            const reasoning = reasoningMatch[1].trim();
            console.log(
              "Extracted reasoning from OpenRouter model:",
              reasoning
            );

            setMessageToReasoningMap((prev) => ({
              ...prev,
              [assistantMessage.id]: reasoning,
            }));

            setReasoningUpdateTimestamps((prev) => ({
              ...prev,
              [`_lastUpdate_${assistantMessage.id}`]: Date.now(),
            }));
          }
        }
      }
    }
  }, [data, messages, selectedModel, useThinking]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.target instanceof HTMLInputElement) {
      originalHandleInputChange(e as ChangeEvent<HTMLInputElement>);
    } else {
      originalHandleInputChange(e as ChangeEvent<HTMLTextAreaElement>);
    }
  };

  const parseRawGeminiOutput = (
    content: string
  ): { text: string; sources: Source[] } => {
    const lines = content.split("\n");
    const sourceLines: string[] = [];
    const textLines: string[] = [];

    lines.forEach((line) => {
      if (line.startsWith("h:")) {
        sourceLines.push(line);
      } else if (
        line.startsWith('0:"') ||
        line.startsWith("f:") ||
        line.startsWith("d:") ||
        line.startsWith("e:")
      ) {
        if (line.startsWith('0:"')) {
          try {
            const textContent = JSON.parse(line.substring(2));
            textLines.push(textContent);
          } catch (e) {
            textLines.push(line);
          }
        }
      } else {
        textLines.push(line);
      }
    });

    const sources: Source[] = [];
    sourceLines.forEach((line) => {
      try {
        const sourceData = JSON.parse(line.slice(2));
        if (sourceData && sourceData.sourceType === "url") {
          if (!sources.some((s) => s.id === sourceData.id)) {
            sources.push(sourceData);
          }
        }
      } catch (e) {
        console.error("Error parsing source:", e);
      }
    });

    return {
      text: textLines.join("\n"),
      sources,
    };
  };

  const extractSourcesFromRawContent = (content: string, messageId: string) => {
    if (content.includes('h:{"sourceType":"url"')) {
      console.log(`Found raw source data in message ${messageId}`);

      const { sources: extractedSources } = parseRawGeminiOutput(content);

      if (extractedSources.length > 0) {
        console.log(
          `Extracted ${extractedSources.length} sources for message ${messageId}`,
          extractedSources
        );

        setMessageToSourcesMap((prev) => ({
          ...prev,
          [messageId]: extractedSources,
        }));

        setSources((prev) => {
          const newSources = [...prev];
          for (const source of extractedSources) {
            if (!newSources.some((s) => s.id === source.id)) {
              newSources.push(source);
            }
          }
          return newSources;
        });
      }
    } else {
      const lines = content.split("\n");
      const sourceLines = lines.filter((line) => line.startsWith("h:"));

      if (sourceLines.length > 0) {
        console.log(
          `Found ${sourceLines.length} source lines for message ${messageId}`
        );
        const extractedSources: Source[] = [];

        sourceLines.forEach((line: string) => {
          try {
            const sourceData = JSON.parse(line.slice(2));
            if (sourceData && sourceData.sourceType === "url") {
              if (!extractedSources.some((s) => s.id === sourceData.id)) {
                extractedSources.push({
                  id: sourceData.id || Math.random().toString(),
                  sourceType: sourceData.sourceType || "url",
                  title: sourceData.title || "",
                  url: sourceData.url || "",
                });
              }
            }
          } catch (error) {
            console.error("Error parsing source line:", error);
          }
        });

        if (extractedSources.length > 0) {
          console.log(
            `Extracted ${extractedSources.length} sources for message ${messageId}`,
            extractedSources
          );

          setMessageToSourcesMap((prev) => ({
            ...prev,
            [messageId]: extractedSources,
          }));

          setSources((prev) => {
            const newSources = [...prev];
            for (const source of extractedSources) {
              if (!newSources.some((s) => s.id === source.id)) {
                newSources.push(source);
              }
            }
            return newSources;
          });
        }
      }
    }
  };

  const cleanRawGeminiOutput = (content: string): string => {
    if (!content.includes('h:{"sourceType":"url"')) {
      return content;
    }

    const { text } = parseRawGeminiOutput(content);
    return text;
  };

  const processReasoningData = (reasoning: string, messageId: string) => {
    if (reasoning && messageId) {
      console.log(
        `Processing reasoning data for message ${messageId}:`,
        reasoning
      );
      setMessageToReasoningMap((prev) => ({
        ...prev,
        [messageId]: reasoning,
      }));

      setReasoningUpdateTimestamps((prev) => ({
        ...prev,
        [`_lastUpdate_${messageId}`]: Date.now(),
      }));
    }
  };

  // Skip auto-scrolling when user has scrolled up
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  useEffect(() => {
    if (containerRef.current && autoScrollEnabled) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScrollEnabled]);

  // Monitor scroll position to toggle auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // If we're at the bottom, enable auto-scroll
    if (distanceFromBottom < 10) {
      setAutoScrollEnabled(true);
    } else {
      setAutoScrollEnabled(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Message action handlers
  const handleRetry = (messageId: string) => {
    // Find the message and resubmit it
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];

    if (message.role === "user") {
      // Set input to the message content and clear subsequent messages
      originalHandleInputChange({ target: { value: message.content } } as any);
      // TODO: Clear subsequent messages in the actual implementation
      aiSdkHandleSubmit(new Event("submit") as any);
    } else {
      // For assistant messages, retry the generation
      // This effectively means resending the last user message
      const lastUserMessageIndex = messages
        .slice(0, messageIndex)
        .map((m, i) => ({ message: m, index: i }))
        .filter((item) => item.message.role === "user")
        .pop()?.index;

      if (lastUserMessageIndex !== undefined) {
        const lastUserMessage = messages[lastUserMessageIndex];
        originalHandleInputChange({
          target: { value: lastUserMessage.content },
        } as any);
        aiSdkHandleSubmit(new Event("submit") as any);
      }
    }
  };

  const handleEdit = (messageId: string, content: string) => {
    // Set the input field to the edited message content
    originalHandleInputChange({ target: { value: content } } as any);

    // Focus the input field
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.focus();
    }
  };

  const handleBranchOff = (messageId: string) => {
    // Create a new chat with the context up to this message
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Create a new chat
    const newChatId = createChat();

    // Get all messages up to and including this message
    const messagesUpToThis = messages.slice(0, messageIndex + 1);

    // Add these messages to the new chat
    messagesUpToThis.forEach((msg) => {
      addMessage(newChatId, msg.content, msg.role as "user" | "assistant");
    });

    // Navigate to the new chat
    navigate(`/chat/${newChatId}`);
  };

  // If not initialized, show loading state
  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-between w-full h-screen overflow-y-auto"
    >
      <div className="w-full max-w-4xl flex-1 pb-52">
        <MessageList
          messages={messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content:
              m.role === "assistant" && useWebSearch
                ? cleanRawGeminiOutput(m.content)
                : m.content,
          }))}
          isLoading={isLoading}
          messageToSourcesMap={messageToSourcesMap}
          messageToReasoningMap={messageToReasoningMap}
          reasoningUpdateTimestamps={reasoningUpdateTimestamps}
          sources={sources}
          useThinking={useThinking}
          selectedModel={selectedModel}
          onRetry={handleRetry}
          onEdit={handleEdit}
          onBranchOff={handleBranchOff}
        />
      </div>

      <div
        className={`${
          messages.length > 0 ? "fixed bottom-5" : "fixed top-2/4"
        } border p-4 bg-card/80 backdrop-blur-lg  w-full max-w-4xl rounded-2xl shadow-lg z-10 `}
      >
        {messages.length > 0 && (
          <ScrollToBottomButton containerRef={containerRef} />
        )}
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          error={error || null}
          apiKey={apiKey}
          useWebSearch={useWebSearch}
          setUseWebSearch={setUseWebSearch}
          useThinking={useThinking}
          setUseThinking={setUseThinking}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>
    </div>
  );
}
