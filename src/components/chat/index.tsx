"use client";

import { useState, useEffect, ChangeEvent, useRef, useMemo } from "react";
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
import { ChatTitle } from "./title/chattitle";
import { siteConfig } from "@/config/site.config";
import { ShineBorder } from "../ui/shine-border";
import { saveMessage } from "@/lib/message-service";
import { useAuth } from "@/components/providers/AuthProvider";

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
  const { id: chatIdParam } = useParams<{ id: string }>();
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [messageToModelMap, setMessageToModelMap] = useState<
    Record<string, string>
  >({});
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [canWrite, setCanWrite] = useState<boolean>(true);
  const { data: session } = useAuth();
  const userId = session?.user?.id;

  const containerRef = useRef<HTMLDivElement>(null);

  const apiKeyStore = useAPIKeyStore();
  const {
    createChat,
    getChat,
    addMessage,
    updateChatTitle,
    setActiveChat,
    deleteChat,
  } = useChatStore();
  const { findModelConfig } = require("@/lib/models");
  const modelConfig = findModelConfig(selectedModel);
  const provider = modelConfig?.provider || "google";
  const apiKey = apiKeyStore.getKey(provider);

  const supportsWebSearch = modelConfig?.supportsWebSearch || false;
  const supportsThinking = modelConfig?.supportsThinking || false;

  const effectiveWebSearch = supportsWebSearch && useWebSearch;
  const effectiveThinking = supportsThinking && useThinking;

  // Add local state for currentChatId
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Initialize chat or redirect if invalid ID
  useEffect(() => {
    const initializeChat = async () => {
      // Reset state when chatId changes
      setInitialMessages([]);
      setMessageToSourcesMap({});
      setMessageToReasoningMap({});
      setReasoningUpdateTimestamps({});
      setSources([]);
      setCanWrite(true); // Reset write permission

      if (chatIdParam) {
        const existingChat = getChat(chatIdParam);
        if (!existingChat) {
          // If the chat doesn't exist (invalid ID), redirect to a new chat
          navigate("/chat");
          setCurrentChatId(null);
        } else {
          setActiveChat(chatIdParam);
          setCurrentChatId(chatIdParam);

          // Convert stored messages to AI SDK format
          const initialMsgs = existingChat.messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            createdAt: new Date(msg.createdAt),
          }));

          setInitialMessages(initialMsgs);
          setIsInitialized(true);

          // Check if the user has write permission for this chat
          if (userId) {
            try {
              const response = await fetch(
                `/api/chats/${chatIdParam}/permissions`
              );
              if (response.ok) {
                const { canWrite: hasWritePermission, isCreator } =
                  await response.json();
                setCanWrite(hasWritePermission || isCreator);
              }
            } catch (error) {
              console.error("Error checking chat permissions:", error);
            }
          } else {
            // If no user is logged in, they can't write
            setCanWrite(false);
          }
        }
      } else {
        // No chatId in URL means we're on the /chat route (new chat)
        // Don't create a chat yet - wait for the first message
        setActiveChat(null);
        setCurrentChatId(null);
        setInitialMessages([]);
        setIsInitialized(true);
        // New chat always has write permission for the creator
        setCanWrite(!!userId);
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

      if (newChatId !== chatIdParam) {
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
  }, [chatIdParam, navigate, getChat, setActiveChat, userId]);

  // Load messageToModelMap from localStorage on component mount
  useEffect(() => {
    const savedModelMap = localStorage.getItem(`chat_models_${currentChatId}`);
    if (savedModelMap) {
      try {
        const parsedModelMap = JSON.parse(savedModelMap);
        setMessageToModelMap(parsedModelMap);
      } catch (e) {
        console.error("Failed to parse saved model map:", e);
      }
    }
  }, [currentChatId]);

  // Save messageToModelMap to localStorage whenever it changes
  useEffect(() => {
    if (currentChatId && Object.keys(messageToModelMap).length > 0) {
      localStorage.setItem(
        `chat_models_${currentChatId}`,
        JSON.stringify(messageToModelMap)
      );
    }
  }, [messageToModelMap, currentChatId]);

  // Track which message is being replaced (for model change)
  const [replaceAssistantMessageId, setReplaceAssistantMessageId] = useState<
    string | null
  >(null);

  const {
    messages,
    input,
    handleInputChange: originalHandleInputChange,
    handleSubmit: aiSdkHandleSubmit,
    isLoading,
    error,
    data,
    setMessages: aiSdkSetMessages,
    append,
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
      if (message.role === "assistant" && currentChatId) {
        if (replaceAssistantMessageId) {
          // Remove the last user message if it's a duplicate
          let updatedMessages = [...messages];
          if (
            updatedMessages.length > 1 &&
            updatedMessages[updatedMessages.length - 1].role === "user" &&
            updatedMessages[updatedMessages.length - 1].content ===
              updatedMessages[updatedMessages.length - 2].content
          ) {
            updatedMessages.pop();
          }
          // Replace the old assistant message
          const idx = updatedMessages.findIndex(
            (m) => m.id === replaceAssistantMessageId
          );
          if (idx !== -1) {
            updatedMessages[idx] = {
              ...updatedMessages[idx],
              content: message.content,
            };
            aiSdkSetMessages(updatedMessages);
          }
          // Update in store
          const chat = getChat(currentChatId);
          if (chat) {
            let updatedStoreMessages = [...chat.messages];
            if (
              updatedStoreMessages.length > 1 &&
              updatedStoreMessages[updatedStoreMessages.length - 1].role ===
                "user" &&
              updatedStoreMessages[updatedStoreMessages.length - 1].content ===
                updatedStoreMessages[updatedStoreMessages.length - 2].content
            ) {
              updatedStoreMessages.pop();
            }
            const idx = updatedStoreMessages.findIndex(
              (m) => m.id === replaceAssistantMessageId
            );
            if (idx !== -1) {
              updatedStoreMessages[idx] = {
                ...updatedStoreMessages[idx],
                content: message.content,
              };
              useChatStore.setState((state) => ({
                chats: state.chats.map((c) =>
                  c.id === currentChatId
                    ? {
                        ...c,
                        messages: updatedStoreMessages,
                        updatedAt: new Date().toISOString(),
                      }
                    : c
                ),
              }));
            }
          }
          setMessageToModelMap((prev) => ({
            ...prev,
            [replaceAssistantMessageId]: selectedModel,
          }));
          setReplaceAssistantMessageId(null);
        } else {
          // Normal flow: add a new assistant message
          addMessage(currentChatId, message.content, "assistant");
          setMessageToModelMap((prev) => ({
            ...prev,
            [message.id]: selectedModel,
          }));

          // Save assistant message to database - don't await to keep UI responsive
          saveMessage({
            chatId: currentChatId,
            content: message.content,
            role: "assistant",
          }).catch((err) => {
            // Just log the error, don't block the UI
            console.error("Failed to save assistant message to database:", err);
          });
        }
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
    id: currentChatId || undefined,
  });

  // Custom handleSubmit that integrates with our chat store
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      (!input.trim() && !imageFiles) ||
      !isInitialized ||
      isLoading ||
      !canWrite
    )
      return;
    let chatId = currentChatId;
    if (!chatId) {
      chatId = createChat();
      window.history.pushState({}, "", `/chat/${chatId}`);
      setActiveChat(chatId);
      setCurrentChatId(chatId);
    }
    // Prepare message content for multimodal (text + image)
    let messageContent: any[] = [];
    if (input.trim()) {
      messageContent.push({ type: "text", text: input });
    }
    if (imageFiles && imageFiles.length > 0) {
      // For now, only support the first image
      const file = imageFiles[0];
      const imageUrl = URL.createObjectURL(file);
      messageContent.push({ type: "image", image: imageUrl });
    }
    // Save the message to our store (for now, just save text or multimodal)
    let messageId;
    let content;
    if (messageContent.length === 1 && messageContent[0].type === "text") {
      content = input;
      messageId = addMessage(chatId, content, "user");
    } else {
      // Save a JSON string for multimodal content for local display
      content = JSON.stringify(messageContent);
      messageId = addMessage(chatId, content, "user");
    }

    // Save message to database - don't await to keep UI responsive
    saveMessage({
      chatId,
      content,
      role: "user",
    }).catch((err) => {
      // Just log the error, don't block the UI
      console.error("Failed to save message to database:", err);
    });

    // Call the AI SDK's submit handler, passing attachments if present
    aiSdkHandleSubmit(e, { experimental_attachments: imageFiles || undefined });
    // Generate title asynchronously for first message
    const chat = getChat(chatId);
    if (chat && chat.messages.length === 1) {
      try {
        const title = await generateChatTitle(input, messageId, chatId);
        updateChatTitle(chatId, title);
      } catch (error) {
        console.error("Failed to generate chat title:", error);
      }
    }
    // Clear image files after submit
    setImageFiles(null);
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
    let contentToResubmit: string;
    let userMessageIndex: number;

    if (message.role === "user") {
      // For user messages, use the current message's content
      contentToResubmit = message.content;
      userMessageIndex = messageIndex;
    } else {
      // For assistant messages, find the last user message before this one
      const lastUserItem = messages
        .slice(0, messageIndex)
        .map((m, i) => ({ message: m, index: i }))
        .filter((item) => item.message.role === "user")
        .pop();

      if (!lastUserItem) return;

      contentToResubmit = lastUserItem.message.content;
      userMessageIndex = lastUserItem.index;
    }

    // Keep only messages up to the user message that we're retrying
    const messagesToKeep = messages.slice(0, userMessageIndex);

    // Update the messages in the AI SDK's state (excluding the last user message)
    aiSdkSetMessages(messagesToKeep);

    // If we have a chatId, update our local chat store to match AI SDK state
    if (currentChatId) {
      const chat = getChat(currentChatId);
      if (chat) {
        // Get the messages from our store up to the retry point (excluding the last user message)
        const storeMsgsToKeep = chat.messages.slice(0, userMessageIndex);

        // Delete the current chat and create a new one with the same ID and filtered messages
        deleteChat(currentChatId);

        // Manually create a new chat with the same ID and only the kept messages
        useChatStore.setState((state) => ({
          chats: [
            ...state.chats,
            {
              id: currentChatId,
              title: chat.title,
              createdAt: chat.createdAt,
              updatedAt: new Date().toISOString(),
              messages: storeMsgsToKeep,
            },
          ],
        }));
      }
    }

    // Now append the user message to trigger a new response
    append({
      role: "user",
      content: contentToResubmit,
    });
  };

  const handleEdit = (messageId: string, content: string) => {
    // Special case for cancel
    if (content === "cancel") {
      setEditingMessageId(null);
      setEditingContent("");
      return;
    }

    if (editingMessageId === messageId) {
      // User is submitting an edit
      // Find the message in the messages array
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // We can only edit user messages
      const message = messages[messageIndex];
      if (message.role !== "user") return;

      // Create a new messages array with the updated message
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: editingContent,
      };

      // Update the messages in the AI SDK's state
      aiSdkSetMessages(updatedMessages);

      // If we have a chatId, update our local chat store
      if (currentChatId) {
        const chat = getChat(currentChatId);
        if (chat) {
          // Find the message in our store
          const storeMessageIndex = chat.messages.findIndex(
            (m) => m.id === messageId
          );
          if (storeMessageIndex !== -1) {
            // Create a new messages array for the store with the updated message
            const updatedStoreMessages = [...chat.messages];
            updatedStoreMessages[storeMessageIndex] = {
              ...updatedStoreMessages[storeMessageIndex],
              content: editingContent,
            };

            // Update the chat in the store
            useChatStore.setState((state) => ({
              chats: state.chats.map((c) =>
                c.id === currentChatId
                  ? {
                      ...c,
                      messages: updatedStoreMessages,
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              ),
            }));
          }
        }
      }

      // Clear editing state
      setEditingMessageId(null);
      setEditingContent("");

      // Generate a new response based on the edited message
      // If this message was followed by an assistant message, we need to retry it
      if (
        messageIndex < messages.length - 1 &&
        messages[messageIndex + 1].role === "assistant"
      ) {
        handleRetry(messageId);
      }
    } else {
      // User wants to edit a message - set up the editing state
      setEditingMessageId(messageId);
      setEditingContent(content);
    }
  };

  const handleBranchOff = async (messageId: string) => {
    // Find the message in the messages array
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Get all messages up to and including the selected message
    const messagesUpToSelected = messages.slice(0, messageIndex + 1);

    // Create a new chat and mark it as a branch from the current chat
    const newChatId = createChat(currentChatId ?? undefined);

    // Set a temporary title
    const selectedMessage = messages[messageIndex];
    const truncatedContent =
      selectedMessage.content.substring(0, 30) +
      (selectedMessage.content.length > 30 ? "..." : "");
    updateChatTitle(newChatId, `Branch: ${truncatedContent}`);

    // Copy all messages up to the selected one into the new chat
    messagesUpToSelected.forEach((msg) => {
      addMessage(newChatId, msg.content, msg.role as "user" | "assistant");
    });

    // Navigate to the new chat
    navigate(`/chat/${newChatId}`);

    // Generate a better title asynchronously
    try {
      const title = await generateChatTitle(
        selectedMessage.content,
        messageId,
        newChatId
      );
      updateChatTitle(newChatId, `${title} (branch)`);
    } catch (error) {
      console.error("Failed to generate branch title:", error);
    }
  };

  // Store the model that generated each response
  useEffect(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    if (lastAssistantMessage && !messageToModelMap[lastAssistantMessage.id]) {
      // This is a new assistant message that we haven't tracked yet
      setMessageToModelMap((prev) => ({
        ...prev,
        [lastAssistantMessage.id]: selectedModel,
      }));
    }
  }, [messages, messageToModelMap, selectedModel]);

  // Track when we're changing models for a specific message
  const [modelChangeInProgress, setModelChangeInProgress] = useState(false);
  const [originalSelectedModel, setOriginalSelectedModel] = useState<
    string | null
  >(null);

  // Restore original model after a response is generated with a different model
  useEffect(() => {
    if (!isLoading && modelChangeInProgress && originalSelectedModel) {
      // Response generation completed, restore the original model
      setSelectedModel(originalSelectedModel);
      setModelChangeInProgress(false);
      setOriginalSelectedModel(null);
    }
  }, [isLoading, modelChangeInProgress, originalSelectedModel]);

  // Update the onModelChange handler to handle model changes for specific messages
  const handleModelChange = (messageId: string, newModel: string) => {
    // Find the assistant message and the user message before it
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== "assistant")
      return;
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMessageIndex = i;
        break;
      }
    }
    if (userMessageIndex === -1) return;
    // Remove the assistant message after the user message
    const messagesToKeep = messages.slice(0, userMessageIndex + 1);
    aiSdkSetMessages(messagesToKeep);
    // Remove from store as well
    if (currentChatId) {
      const chat = getChat(currentChatId);
      if (chat) {
        const storeMessagesToKeep = chat.messages.slice(
          0,
          userMessageIndex + 1
        );
        useChatStore.setState((state) => ({
          chats: state.chats.map((c) =>
            c.id === currentChatId
              ? {
                  ...c,
                  messages: storeMessagesToKeep,
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      }
    }
    // Set up model change tracking
    setModelChangeInProgress(true);
    setOriginalSelectedModel(selectedModel);
    setReplaceAssistantMessageId(messageId); // Track which message to replace
    setSelectedModel(newModel);
    // Use append, but handle duplicate user message in onFinish
    const lastUserMessage = messages[userMessageIndex];
    append({
      role: "user",
      content: lastUserMessage.content,
    });
  };

  const handleImageChange = (files: FileList | null) => {
    setImageFiles(files);
  };

  // First, create a memoized transformed messages array
  const transformedMessages = useMemo(
    () =>
      messages.map((m: { id: string; role: string; content: any }) => {
        let content:
          | string
          | Array<{ type: string; text?: string; image?: string }> = m.content;
        if (
          typeof content === "string" &&
          content.startsWith("[") &&
          content.includes("type")
        ) {
          try {
            const arr = JSON.parse(content);
            if (Array.isArray(arr) && arr.every((part: any) => part.type)) {
              content = arr;
            }
          } catch {}
        }
        return {
          id: m.id,
          role: m.role as "user" | "assistant",
          content:
            m.role === "assistant" &&
            useWebSearch &&
            typeof content === "string"
              ? cleanRawGeminiOutput(content)
              : content,
        };
      }),
    [messages, useWebSearch, cleanRawGeminiOutput]
  );

  // Then use the transformed messages in messageListProps
  const messageListProps = useMemo(
    () => ({
      messages: transformedMessages,
      isLoading,
      messageToSourcesMap,
      messageToReasoningMap,
      reasoningUpdateTimestamps,
      sources,
      useThinking,
      selectedModel,
      messageToModelMap,
      onRetry: handleRetry,
      onEdit: handleEdit,
      onBranchOff: handleBranchOff,
      onModelChange: handleModelChange,
      editingMessageId,
      editingContent,
      setEditingContent,
    }),
    [
      transformedMessages,
      isLoading,
      messageToSourcesMap,
      messageToReasoningMap,
      reasoningUpdateTimestamps,
      sources,
      useThinking,
      selectedModel,
      messageToModelMap,
      handleRetry,
      handleEdit,
      handleBranchOff,
      handleModelChange,
      editingMessageId,
      editingContent,
      setEditingContent,
    ]
  );

  const chatInputProps = useMemo(
    () => ({
      input,
      handleInputChange,
      handleSubmit,
      isLoading,
      error: error || null,
      apiKey,
      useWebSearch,
      setUseWebSearch,
      useThinking,
      setUseThinking,
      selectedModel,
      setSelectedModel,
      onImageChange: handleImageChange,
      imageFiles,
      disabled: !canWrite,
    }),
    [
      input,
      handleInputChange,
      handleSubmit,
      isLoading,
      error,
      apiKey,
      useWebSearch,
      setUseWebSearch,
      useThinking,
      setUseThinking,
      selectedModel,
      setSelectedModel,
      handleImageChange,
      imageFiles,
      canWrite,
    ]
  );

  // If not initialized, show loading state
  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center w-full ">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="h-[99vh] flex flex-col">
      {/* Header - ChatTitle */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length > 0 ? (
          <>
            {/* Messages Container */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto px-4 relative"
              onScroll={handleScroll}
            >
              <div className="w-full max-w-4xl mx-auto py-4 ">
                <MessageList {...messageListProps} />
              </div>
            </div>

            {/* Input at Bottom */}
            <div className="  flex-shrink-0 p-4 bg-card/70 backdrop-blur-lg max-w-4xl mx-auto w-full bottom-5 rounded-2xl mb-2  border ">
              <ChatInput {...chatInputProps} />
              {!canWrite && (
                <div className="text-center mt-2 text-sm text-amber-500">
                  You don't have permission to send messages in this chat.
                </div>
              )}
            </div>
          </>
        ) : (
          // When no messages: Input centered in the middle
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-4xl">
              {/* Welcome Section */}
              <ChatTitle />

              {/* Centered Input */}
              <div className="border p-4 bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg relative">
                <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />

                <ChatInput {...chatInputProps} />
                {!canWrite && (
                  <div className="text-center mt-2 text-sm text-amber-500">
                    You don't have permission to send messages in this chat.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button (when messages exist) */}
      {messages.length > 0 && !autoScrollEnabled && (
        <div className="fixed bottom-5 right-5 z-50">
          <ScrollToBottomButton containerRef={containerRef} />
        </div>
      )}
    </div>
  );
}
