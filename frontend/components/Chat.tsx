"use client";

import { useChat } from "@ai-sdk/react";
import Messages from "./Messages";
import ChatInput from "./ChatInput";
import ChatNavigator from "./ChatNavigator";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { useModelStore } from "@/frontend/stores/ModelStore";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  MessageSquareMore,
  Search,
  BrainCircuit,
  Image as ImageIcon,
} from "lucide-react";
import { useChatNavigator } from "@/frontend/hooks/useChatNavigator";
import { useState, useMemo, useEffect, useCallback } from "react";
import { getModelConfig } from "@/lib/models";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { SearchSource } from "@/lib/data-service";
import { Message } from "@ai-sdk/ui-utils";
import { useDataService } from "@/frontend/hooks/useDataService";
import { ChatTitle } from "@/components/chattitle";

// Extend UIMessage to include sources and reasoning
interface ExtendedUIMessage extends UIMessage {
  sources?: SearchSource[];
  _reasoning?: string;
}

interface ChatProps {
  threadId: string;
  initialMessages: ExtendedUIMessage[];
}

// Define types for the data stream
interface SourceData {
  sourceType: string;
  id?: string;
  title?: string;
  url?: string;
  snippet?: string;
}

interface StreamChunk {
  type?: string;
  value?: {
    sourceType?: string;
    id?: string;
    title?: string;
    url?: string;
    snippet?: string;
  };
}

// Define types for web search results
interface WebSearchResult {
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
}

interface WebSearchMetadata {
  query: string;
  results: WebSearchResult[];
  totalResults?: number;
}

export default function Chat({ threadId, initialMessages }: ChatProps) {
  const { getKey } = useAPIKeyStore();
  const selectedModel = useModelStore((state) => state.selectedModel);
  const modelConfig = useModelStore((state) => state.getModelConfig());
  const { dataService, isAuthenticated } = useDataService();

  // Check if the selected model supports tools
  const supportsTools = modelConfig.supportsTools;

  // Track active tools
  const [activeTools, setActiveTools] = useState({
    webSearch: false,
    imageAnalysis: false,
    thinking: false,
    imageGeneration: false,
  });

  // Store search sources
  const [searchSources, setSearchSources] = useState<SearchSource[]>([]);

  // Track the current assistant message ID
  const [currentAssistantMessageId, setCurrentAssistantMessageId] = useState<
    string | null
  >(null);

  // Save sources to the database when they change
  const saveSourcesToDatabase = useCallback(async () => {
    if (currentAssistantMessageId && searchSources.length > 0) {
      console.log(
        "Saving sources to message:",
        currentAssistantMessageId,
        searchSources
      );
      try {
        await dataService.updateMessageSources(
          currentAssistantMessageId,
          searchSources
        );
        console.log("Sources saved successfully");
      } catch (error) {
        console.error("Error saving sources:", error);
      }
    }
  }, [currentAssistantMessageId, searchSources, dataService]);

  // Call saveSourcesToDatabase whenever sources or message ID changes
  useEffect(() => {
    saveSourcesToDatabase();
  }, [saveSourcesToDatabase]);

  // Load sources for existing messages when initializing
  useEffect(() => {
    const loadSourcesForMessages = async () => {
      try {
        // First check if any initialMessages have sources
        const initialMessagesWithSources = initialMessages
          .filter(
            (msg) =>
              msg.role === "assistant" && msg.sources && msg.sources.length > 0
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt || new Date()).getTime() -
              new Date(a.createdAt || new Date()).getTime()
          );

        if (initialMessagesWithSources.length > 0) {
          const latestMessage = initialMessagesWithSources[0];
          console.log("Found initial message with sources:", latestMessage);

          if (latestMessage.sources && latestMessage.sources.length > 0) {
            setSearchSources(latestMessage.sources);
            setCurrentAssistantMessageId(latestMessage.id);
            return; // Skip DB loading if we already found sources in initialMessages
          }
        }

        // If no sources in initialMessages, try loading from DB
        const dbMessages = await dataService.getMessagesByThreadId(threadId);
        console.log("Loaded messages from DB:", dbMessages);

        // Find the latest assistant message with sources
        const assistantMessagesWithSources = dbMessages
          .filter(
            (msg: any) =>
              msg.role === "assistant" && msg.sources && msg.sources.length > 0
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt || new Date()).getTime() -
              new Date(a.createdAt || new Date()).getTime()
          );

        if (assistantMessagesWithSources.length > 0) {
          const latestMessage = assistantMessagesWithSources[0];
          console.log("Found message with sources:", latestMessage);

          if (latestMessage.sources && latestMessage.sources.length > 0) {
            // Convert the sources to the expected format
            const formattedSources: SearchSource[] = latestMessage.sources.map(
              (source: any) => ({
                id: source.id,
                title: source.title || undefined,
                url: source.url,
                snippet: source.snippet || undefined,
              })
            );

            setSearchSources(formattedSources);
            setCurrentAssistantMessageId(latestMessage.id);
          }
        } else {
          // Find the latest assistant message even without sources
          const latestAssistantMessage = dbMessages
            .filter((msg: any) => msg.role === "assistant")
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt || new Date()).getTime() -
                new Date(a.createdAt || new Date()).getTime()
            )[0];

          if (latestAssistantMessage) {
            setCurrentAssistantMessageId(latestAssistantMessage.id);
          }
        }
      } catch (error) {
        console.error("Error loading sources from database:", error);
      }
    };

    loadSourcesForMessages();
  }, [threadId, initialMessages, dataService]);

  const {
    isNavigatorVisible,
    handleToggleNavigator,
    closeNavigator,
    registerRef,
    scrollToMessage,
  } = useChatNavigator();

  // Create API body with active tools
  const apiBody = useMemo(() => {
    const body: Record<string, any> = {
      model: selectedModel,
    };

    // Only include active tools in the API request
    const enabledTools: string[] = [];
    if (activeTools.webSearch) enabledTools.push("webSearch");
    if (activeTools.thinking) enabledTools.push("thinking");
    if (activeTools.imageAnalysis) enabledTools.push("analyzeImage");
    if (activeTools.imageGeneration) enabledTools.push("imageGeneration");

    if (enabledTools.length > 0) {
      body.enabledTools = enabledTools;
    }

    // Special handling for image generation model
    if (selectedModel === "Gemini 2.0 Flash Image Generation") {
      // For this model, we only want image generation enabled
      body.enabledTools = ["imageGeneration"];
    }

    console.log("API Body:", body);

    return body;
  }, [selectedModel, activeTools]);

  // Extract search metadata from message
  const extractSearchMetadataFromMessage = useCallback((message: Message) => {
    console.log("Checking for tool invocations in message:", message);

    // Check for tool invocations and web search results
    if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
      console.log("Found tool invocations:", message.toolInvocations);

      // Process each tool invocation
      message.toolInvocations.forEach((invocation) => {
        // Only process completed tool invocations with results
        if (invocation.state === "result") {
          // Check if this is a web search tool
          const toolName = invocation.toolName;

          if (toolName === "webSearch" || toolName === "web_search_preview") {
            console.log("Found web search result:", invocation);

            let newSources: SearchSource[] = [];
            let output: any = invocation.result;

            // Handle custom webSearch tool result format
            if (output && output.results && Array.isArray(output.results)) {
              newSources = output.results.map((result: any) => ({
                id:
                  result.id ||
                  `search-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}`,
                title: result.title || "No title",
                url: result.url || result.link || "",
                snippet: result.snippet || result.description || "",
              }));
            }
            // Handle OpenAI web_search_preview result format
            else if (
              output &&
              output.citations &&
              Array.isArray(output.citations)
            ) {
              newSources = output.citations.map((citation: any) => ({
                id:
                  citation.id ||
                  `search-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}`,
                title: citation.title || "No title",
                url: citation.url || "",
                snippet: citation.text || "",
              }));
            }

            if (newSources.length > 0) {
              console.log("Extracted search sources:", newSources);

              // Add new sources to state
              setSearchSources((prev) => {
                // Avoid duplicates
                const combinedSources = [...prev];

                newSources.forEach((newSource) => {
                  const exists = combinedSources.some(
                    (existingSource) => existingSource.url === newSource.url
                  );

                  if (!exists) {
                    combinedSources.push(newSource);
                  }
                });

                return combinedSources;
              });
            }
          }
        }
      });
    }
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    append,
    reload,
    stop,
    setInput,
    setMessages,
    status,
    data,
  } = useChat({
    id: threadId,
    initialMessages,
    experimental_throttle: 50,
    onFinish: async (message) => {
      const messageId = uuidv4();

      // Check if we have reasoning content in the current state
      let currentReasoning = "";
      if (currentAssistantMessageId) {
        // Find the current message in the messages array
        const currentMessage = messages.find(
          (msg) => msg.id === currentAssistantMessageId
        );
        if (currentMessage && (currentMessage as any)._reasoning) {
          currentReasoning = (currentMessage as any)._reasoning;
          console.log("Found reasoning content to preserve:", currentReasoning);
        }
      }

      // Extract search metadata from the finished message
      extractSearchMetadataFromMessage(message);

      // Extract sources from message parts
      if (message.parts && message.parts.length > 0) {
        const sourceParts = message.parts.filter(
          (part) => part.type === "source"
        );
        if (sourceParts.length > 0) {
          console.log("Found source parts in message:", sourceParts);

          // Convert source parts to SearchSource objects
          const newSources = sourceParts
            .map((part) => {
              if (part.type === "source") {
                return {
                  id:
                    part.source.id ||
                    `source-${Date.now()}-${Math.random()
                      .toString(36)
                      .substring(2, 9)}`,
                  title:
                    part.source.title ||
                    (part.source.url
                      ? new URL(part.source.url).hostname
                      : "Unknown Source"),
                  url: part.source.url || "",
                  snippet: "", // Just use empty string as snippet since it's not available in the source
                };
              }
              return null;
            })
            .filter(Boolean) as SearchSource[];

          // Add new sources to the current sources
          if (newSources.length > 0) {
            setSearchSources((prev) => {
              const combinedSources = [...prev];
              newSources.forEach((newSource) => {
                const exists = combinedSources.some(
                  (existingSource) => existingSource.url === newSource.url
                );
                if (!exists) {
                  combinedSources.push(newSource);
                }
              });
              return combinedSources;
            });
          }
        }
      }

      // Process any generated image files
      // Access files from the response data if available
      const responseFiles = (message as any).files || [];
      if (responseFiles.length > 0) {
        console.log("Generated image files:", responseFiles);

        // For each image file, create a markdown image link and append it to the message content
        let contentWithImages = message.content || "";

        for (const file of responseFiles) {
          if (file.mimeType.startsWith("image/")) {
            // Convert the file to a data URL
            const reader = new FileReader();
            const fileBlob = new Blob([file.data], { type: file.mimeType });

            // Use a promise to handle the async file reading
            const dataUrl = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(fileBlob);
            });

            // Append the image to the content
            contentWithImages += `\n\n![Generated Image](${dataUrl})`;
          }
        }

        // Update the message content with the images
        message.content = contentWithImages;
      }

      const aiMessage: ExtendedUIMessage = {
        id: messageId,
        parts: message.parts || [],
        role: "assistant",
        content: message.content || "",
        createdAt: new Date(),
        sources: searchSources, // Include current sources
        _reasoning: currentReasoning, // Preserve reasoning content
      };

      try {
        console.log("Message finished, saving with sources:", searchSources);
        console.log("Message reasoning content:", currentReasoning);
        console.log("Is authenticated:", isAuthenticated);

        // Set the current message ID first so any sources that come in are associated with it
        setCurrentAssistantMessageId(messageId);

        // Save the message with current sources
        await dataService.createMessage(threadId, aiMessage, searchSources);

        // Ensure sources are saved separately as well with a delay to ensure the message is created first
        if (searchSources.length > 0) {
          // Add a delay to ensure the message is created in the database
          setTimeout(async () => {
            try {
              await dataService.updateMessageSources(messageId, searchSources);
              console.log(
                "Sources saved with finished message (with delay):",
                messageId
              );
            } catch (sourceError) {
              console.error("Error saving sources with delay:", sourceError);
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error saving message:", error);
      }
    },
    headers: {
      [modelConfig.headerKey]: getKey(modelConfig.provider) || "",
    },
    body: apiBody,
    onError: (error) => {
      console.error("Chat error:", error);

      // Check for specific image generation errors
      if (error.message) {
        if (error.message.includes("Developer instruction is not enabled")) {
          toast.error("Image generation error", {
            description:
              "The image generation model doesn't support system instructions. Try again with a simple prompt.",
            duration: 5000,
          });
        } else if (
          error.message.includes("response modalities") ||
          error.message.includes("combination of response modalities")
        ) {
          toast.error("Image generation error", {
            description:
              "There was an issue with the image generation configuration. Try using a simpler prompt like 'Generate an image of a cat'.",
            duration: 5000,
          });
        } else {
          toast.error("An error occurred during the chat. Please try again.");
        }
      } else {
        toast.error("An error occurred during the chat. Please try again.");
      }
    },
  });

  // Handle custom submit to clear search sources for new queries
  const handleSubmit = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      // Clear previous search results for new query if web search is enabled
      if (activeTools.webSearch) {
        setSearchSources([]);
      }

      // Special handling for image generation model
      if (selectedModel === "Gemini 2.0 Flash Image Generation") {
        // Check if the input is a good prompt for image generation
        const currentInput = input.trim();

        if (
          !currentInput.toLowerCase().includes("image") &&
          !currentInput.toLowerCase().includes("picture") &&
          !currentInput.toLowerCase().includes("photo") &&
          !currentInput.toLowerCase().includes("generate") &&
          !currentInput.toLowerCase().includes("create")
        ) {
          // If the prompt doesn't seem to be asking for an image, suggest a better format
          toast.info("Image Generation Tip", {
            description:
              "Try starting your prompt with 'Create an image of...' or 'Generate a picture of...' for best results.",
            duration: 4000,
          });
        }
      }

      originalHandleSubmit(e);
    },
    [originalHandleSubmit, activeTools.webSearch, selectedModel, input]
  );

  // Function to update message reasoning with delay
  const updateReasoningWithDelay = useCallback(
    (messageId: string, reasoningContent: string) => {
      console.log(`Adding reasoning to message ${messageId} with delay`);

      // Add a small delay to ensure the message is created first
      setTimeout(() => {
        dataService
          .updateMessageReasoning(messageId, reasoningContent)
          .then(() => console.log("Reasoning saved to database with delay"))
          .catch((err) =>
            console.error("Error saving reasoning with delay:", err)
          );
      }, 500);
    },
    [dataService]
  );

  // Helper function to add a source if it's not already in the list
  const addSourceIfNew = useCallback(
    (source: SearchSource) => {
      if (!source.url) {
        console.warn("Attempted to add source without URL:", source);
        return;
      }

      setSearchSources((prevSources) => {
        // Avoid duplicates by checking IDs or URLs
        const exists = prevSources.some(
          (s) => (source.id && s.id === source.id) || s.url === source.url
        );

        if (!exists) {
          console.log("Adding new source:", source);
          const newSources = [...prevSources, source];

          // If we have a current message ID, update the sources in the database
          if (currentAssistantMessageId) {
            console.log(
              "Updating sources for message:",
              currentAssistantMessageId
            );

            // Add a small delay to ensure the message is created first
            setTimeout(() => {
              dataService
                .updateMessageSources(currentAssistantMessageId, newSources)
                .then(() =>
                  console.log("Sources updated successfully with delay")
                )
                .catch((err) =>
                  console.error("Failed to update sources in database:", err)
                );
            }, 500);
          }

          return newSources;
        }
        return prevSources;
      });
    },
    [currentAssistantMessageId, dataService]
  );

  // Watch for data changes and extract sources and reasoning
  useEffect(() => {
    if (data && data.length > 0) {
      console.log("Raw streaming data:", data);

      // Process the streaming data to find sources and reasoning
      data.forEach((chunk) => {
        if (!chunk || typeof chunk !== "object") return;

        console.log("Processing chunk:", chunk);

        // Check for reasoning data
        const anyChunk = chunk as any;

        // Handle direct reasoning type chunks
        if (anyChunk.type === "reasoning") {
          console.log("Direct reasoning chunk found:", anyChunk);

          // Extract the reasoning content
          let reasoningContent = "";
          if (anyChunk.textDelta) {
            reasoningContent = anyChunk.textDelta;
          } else if (anyChunk.text) {
            reasoningContent = anyChunk.text;
          }

          if (reasoningContent && currentAssistantMessageId) {
            console.log(
              `Adding direct reasoning to message ${currentAssistantMessageId}:`,
              reasoningContent
            );

            // Update the message with reasoning
            setMessages((prevMessages) => {
              return prevMessages.map((msg) => {
                if (msg.id === currentAssistantMessageId) {
                  // Append to existing reasoning if any
                  const extendedMsg = msg as ExtendedUIMessage;
                  const updatedReasoning = extendedMsg._reasoning
                    ? extendedMsg._reasoning + reasoningContent
                    : reasoningContent;

                  // Save to database
                  updateReasoningWithDelay(
                    currentAssistantMessageId,
                    updatedReasoning
                  );

                  return {
                    ...msg,
                    _reasoning: updatedReasoning,
                  };
                }
                return msg;
              });
            });
          }
        }

        // Check for reasoning in the reasoning property
        if (anyChunk._reasoning) {
          console.log("Reasoning found in stream:", anyChunk._reasoning);

          // If we have a current message ID, update the message with reasoning
          if (currentAssistantMessageId) {
            // Update the current message with reasoning
            setMessages((prevMessages) => {
              return prevMessages.map((msg) => {
                if (msg.id === currentAssistantMessageId) {
                  console.log(
                    `Adding reasoning to message ${msg.id}:`,
                    anyChunk._reasoning
                  );

                  // Save reasoning to database
                  updateReasoningWithDelay(
                    currentAssistantMessageId,
                    anyChunk._reasoning
                  );

                  return {
                    ...msg,
                    _reasoning: anyChunk._reasoning,
                  };
                }
                return msg;
              });
            });
          }
        }

        // Also check for reasoning in data property
        if (anyChunk.data && anyChunk.data.reasoning) {
          console.log(
            "Reasoning found in data property:",
            anyChunk.data.reasoning
          );

          // If we have a current message ID, update the message with reasoning
          if (currentAssistantMessageId) {
            // Update the current message with reasoning
            setMessages((prevMessages) => {
              return prevMessages.map((msg) => {
                if (msg.id === currentAssistantMessageId) {
                  console.log(
                    `Adding reasoning from data to message ${msg.id}:`,
                    anyChunk.data.reasoning
                  );

                  // Save reasoning to database
                  updateReasoningWithDelay(
                    currentAssistantMessageId,
                    anyChunk.data.reasoning
                  );

                  return {
                    ...msg,
                    _reasoning: anyChunk.data.reasoning,
                  };
                }
                return msg;
              });
            });
          }
        }

        // Check for source parts in the message
        if (anyChunk.type === "source" && anyChunk.source) {
          console.log("Source part found in message:", anyChunk.source);

          const source: SearchSource = {
            id:
              anyChunk.source.id ||
              `source-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,
            title:
              anyChunk.source.title ||
              (anyChunk.source.url
                ? new URL(anyChunk.source.url).hostname
                : "Unknown Source"),
            url: anyChunk.source.url || "",
            snippet: anyChunk.source.snippet || "",
          };

          addSourceIfNew(source);
        }

        // Check for source type chunks
        const streamChunk = chunk as StreamChunk;
        if (
          streamChunk.type === "source" &&
          streamChunk.value &&
          streamChunk.value.sourceType === "url"
        ) {
          console.log(
            "Source found in stream (type=source):",
            streamChunk.value
          );
          const source: SearchSource = {
            id: streamChunk.value.id,
            title: streamChunk.value.title || "Unknown Title",
            url: streamChunk.value.url || "",
          };

          addSourceIfNew(source);
        }

        // Check for custom data with sources array
        if (anyChunk.sources && Array.isArray(anyChunk.sources)) {
          console.log("Sources array found in stream:", anyChunk.sources);
          anyChunk.sources.forEach((source: any) => {
            if (source && typeof source === "object" && source.url) {
              const newSource: SearchSource = {
                id: source.id,
                title: source.title || "Unknown Title",
                url: source.url,
                snippet: source.snippet,
              };
              addSourceIfNew(newSource);
            }
          });
        }

        // Check for direct data property with sources
        if (
          anyChunk.data &&
          anyChunk.data.sources &&
          Array.isArray(anyChunk.data.sources)
        ) {
          console.log("Sources found in data property:", anyChunk.data.sources);
          anyChunk.data.sources.forEach((source: any) => {
            if (source && typeof source === "object" && source.url) {
              const newSource: SearchSource = {
                id: source.id,
                title: source.title || "Unknown Title",
                url: source.url,
                snippet: source.snippet,
              };
              addSourceIfNew(newSource);
            }
          });
        }
      });
    }
  }, [
    data,
    currentAssistantMessageId,
    addSourceIfNew,
    setMessages,
    extractSearchMetadataFromMessage,
    updateReasoningWithDelay,
  ]);

  // Generate a temporary message ID when streaming starts
  useEffect(() => {
    if (status === "streaming" && !currentAssistantMessageId) {
      const tempId = `temp-${uuidv4()}`;
      console.log("Creating temporary message ID for streaming:", tempId);
      setCurrentAssistantMessageId(tempId);
    }
  }, [status, currentAssistantMessageId]);

  // Toggle tool activation
  const toggleTool = (
    tool: "webSearch" | "imageAnalysis" | "thinking" | "imageGeneration"
  ) => {
    // Check if the model supports the specific tool
    if (tool === "imageGeneration") {
      if (modelConfig.supportsImageGeneration) {
        setActiveTools((prev) => ({
          ...prev,
          [tool]: !prev[tool],
        }));
      } else {
        // Show a toast warning if the model doesn't support image generation
        toast.warning(
          `${selectedModel} doesn't support image generation capabilities.`,
          {
            description:
              "Try switching to a model like Gemini 2.5 Pro that supports image generation.",
          }
        );
      }
    } else if (supportsTools) {
      // For other tools, check if the model supports tools in general
      setActiveTools((prev) => ({
        ...prev,
        [tool]: !prev[tool],
      }));
    } else {
      // Show a toast warning if the model doesn't support tools
      toast.warning(
        `${selectedModel} doesn't support ${
          tool === "webSearch"
            ? "web search"
            : tool === "imageAnalysis"
            ? "image analysis"
            : "thinking"
        } capabilities.`,
        {
          description:
            "Try switching to a model like GPT-4o or Gemini 2.5 Pro that supports tools.",
        }
      );
    }
  };

  // Clear sources when starting a new conversation
  useEffect(() => {
    if (messages.length === 0) {
      setSearchSources([]);
      setCurrentAssistantMessageId(null);
    }
  }, [messages.length]);

  // Clear sources when web search is disabled
  useEffect(() => {
    if (!activeTools.webSearch) {
      setSearchSources([]);

      // Also clear sources in the database for the current message if any
      if (currentAssistantMessageId) {
        dataService
          .updateMessageSources(currentAssistantMessageId, [])
          .catch((error) => console.error("Error clearing sources:", error));
      }
    }
  }, [activeTools.webSearch, currentAssistantMessageId]);

  // Watch for model changes to show tips for image generation
  useEffect(() => {
    if (selectedModel === "Gemini 2.0 Flash Image Generation") {
      // Auto-enable image generation when this model is selected
      setActiveTools((prev) => ({
        ...prev,
        imageGeneration: true,
        // Disable other tools that might conflict
        webSearch: false,
        thinking: false,
      }));
    }
  }, [selectedModel]);

  return (
    <div className="relative w-full">
      <main
        className={`flex flex-col w-full max-w-3xl pt-10 pb-44 mx-auto transition-all duration-300 ease-in-out`}
      >
        <Messages
          threadId={threadId}
          messages={messages}
          status={status}
          setMessages={setMessages}
          reload={reload}
          error={error}
          registerRef={registerRef}
          stop={stop}
          searchSources={searchSources}
        />
        <ChatInput
          threadId={threadId}
          input={input}
          status={status}
          append={append}
          setInput={setInput}
          stop={stop}
          activeTools={activeTools}
          handleSubmit={handleSubmit}
          handleInputChange={handleInputChange}
          hasMessages={messages.length > 0}
          setHasMessages={() => {}}
          setActiveTools={setActiveTools}
        />
      </main>

      {/* Tool toggles */}
      {/* <div className="fixed right-16 top-4 z-20 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  onClick={() => toggleTool("webSearch")}
                  variant={activeTools.webSearch ? "default" : "outline"}
                  size="icon"
                  className="relative"
                  aria-label={
                    activeTools.webSearch
                      ? "Disable web search"
                      : "Enable web search"
                  }
                  title="Web Search"
                  disabled={!supportsTools}
                >
                  <Search className="h-5 w-5" />
                  {activeTools.webSearch && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            {!supportsTools && (
              <TooltipContent>
                <p>Web search not supported by {selectedModel}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  onClick={() => toggleTool("imageAnalysis")}
                  variant={activeTools.imageAnalysis ? "default" : "outline"}
                  size="icon"
                  className="relative"
                  aria-label={
                    activeTools.imageAnalysis
                      ? "Disable image analysis"
                      : "Enable image analysis"
                  }
                  title="Image Analysis"
                  disabled={!supportsTools}
                >
                  <ImageIcon className="h-5 w-5" />
                  {activeTools.imageAnalysis && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            {!supportsTools && (
              <TooltipContent>
                <p>Image analysis not supported by {selectedModel}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  onClick={() => toggleTool("thinking")}
                  variant={activeTools.thinking ? "default" : "outline"}
                  size="icon"
                  className="relative"
                  aria-label={
                    activeTools.thinking
                      ? "Disable thinking"
                      : "Enable thinking"
                  }
                  title="Step-by-step Thinking"
                  disabled={!supportsTools}
                >
                  <BrainCircuit className="h-5 w-5" />
                  {activeTools.thinking && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            {!supportsTools && (
              <TooltipContent>
                <p>Thinking tool not supported by {selectedModel}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  onClick={() => toggleTool("imageGeneration")}
                  variant={activeTools.imageGeneration ? "default" : "outline"}
                  size="icon"
                  className="relative"
                  aria-label={
                    activeTools.imageGeneration
                      ? "Disable image generation"
                      : "Enable image generation"
                  }
                  title="Image Generation"
                  disabled={!modelConfig.supportsImageGeneration}
                >
                  <ImageIcon className="h-5 w-5" />
                  {activeTools.imageGeneration && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            {!modelConfig.supportsImageGeneration && (
              <TooltipContent>
                <p>Image generation not supported by {selectedModel}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <Button
          onClick={handleToggleNavigator}
          variant="outline"
          size="icon"
          aria-label={
            isNavigatorVisible
              ? "Hide message navigator"
              : "Show message navigator"
          }
          title="Message Navigator"
        >
          <MessageSquareMore className="h-5 w-5" />
        </Button>
      </div> */}
    </div>
  );
}
