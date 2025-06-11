"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";

interface Source {
  id: string;
  sourceType: string;
  title?: string;
  url?: string;
}

export function Chat() {
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [useThinking, setUseThinking] = useState<boolean>(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [messageToSourcesMap, setMessageToSourcesMap] = useState<
    Record<string, Source[]>
  >({});
  const [messageToReasoningMap, setMessageToReasoningMap] = useState<
    Record<string, string>
  >({});

  // Add a ref for the main container to handle scrolling
  const containerRef = useRef<HTMLDivElement>(null);

  // Get API key from the store
  const apiKey = useAPIKeyStore((state) => state.getKey("google"));

  // Use the custom onFinish handler with reasoning support
  const {
    messages,
    input,
    handleInputChange: originalHandleInputChange,
    handleSubmit,
    isLoading,
    error,
    data,
  } = useChat({
    body: {
      geminiApiKey: apiKey,
      useWebSearch: useWebSearch,
      useThinking: useThinking,
    },
    onResponse: (response) => {
      // Don't reset sources here, as they might come in later chunks
      console.log("Response received, waiting for sources...");
    },
    onFinish: async (message) => {
      if (message.role === "assistant") {
        console.log("Message finished, processing sources:", message.id);

        // Try to extract sources from the message content
        extractSourcesFromRawContent(message.content, message.id);

        // Also check if we have sources in the data object
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
  });

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
        // Extract sources from the data stream
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

            // Avoid duplicates
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

        // Handle reasoning data
        data.forEach((item: any) => {
          if (
            item &&
            typeof item === "object" &&
            item.type === "reasoning" &&
            item.text
          ) {
            setMessageToReasoningMap((prev) => ({
              ...prev,
              [assistantMessage.id]: item.text,
              [`_lastUpdate_${assistantMessage.id}`]: Date.now(),
            }));
          }
        });
      }
    }
  }, [data, messages]);

  // Simplify the extractSourcesFromStreamData function
  const extractSourcesFromStreamData = (messageId: string) => {
    // This function is now just a placeholder since sources are handled in the useEffect above
    console.log(`Finalizing sources for message ${messageId}`);
  };

  // Create a compatible handleInputChange function
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.target instanceof HTMLInputElement) {
      originalHandleInputChange(e as ChangeEvent<HTMLInputElement>);
    } else {
      originalHandleInputChange(e as ChangeEvent<HTMLTextAreaElement>);
    }
  };

  // Add a utility function to parse raw Gemini output format
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
        // These are part of the raw output format, we'll ignore them or process them
        if (line.startsWith('0:"')) {
          // Extract the text content
          try {
            const textContent = JSON.parse(line.substring(2));
            textLines.push(textContent);
          } catch (e) {
            // If parsing fails, just add the raw content
            textLines.push(line);
          }
        }
      } else {
        // Regular content
        textLines.push(line);
      }
    });

    // Parse sources
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

  // Function to extract sources from raw content
  const extractSourcesFromRawContent = (content: string, messageId: string) => {
    // Check if the content is in the raw Gemini output format
    if (content.includes('h:{"sourceType":"url"')) {
      console.log(`Found raw source data in message ${messageId}`);

      const { sources: extractedSources } = parseRawGeminiOutput(content);

      if (extractedSources.length > 0) {
        console.log(
          `Extracted ${extractedSources.length} sources for message ${messageId}`,
          extractedSources
        );

        // Update the message-to-sources map
        setMessageToSourcesMap((prev) => ({
          ...prev,
          [messageId]: extractedSources,
        }));

        // Also update the global sources array
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
      // Original implementation for other content formats
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
              // Check if this source is already in our array
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

          // Update the message-to-sources map
          setMessageToSourcesMap((prev) => ({
            ...prev,
            [messageId]: extractedSources,
          }));

          // Also update the global sources array
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

  // Add a function to clean the raw Gemini output format
  const cleanRawGeminiOutput = (content: string): string => {
    if (!content.includes('h:{"sourceType":"url"')) {
      // If it's not in the raw format, return as is
      return content;
    }

    // Parse the content and return only the text part
    const { text } = parseRawGeminiOutput(content);
    return text;
  };

  // Add utility function to process reasoning data
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
    }
  };

  // Function to extract sources from data
  const extractSourcesFromData = () => {
    if (!data) return;

    // Log the data structure to help debug
    console.log("Data received:", JSON.stringify(data));

    // Try different approaches to extract sources
    let extractedSources: Source[] = [];

    // Approach 1: Look for sources in the first item if data is an array
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (
        typeof firstItem === "object" &&
        firstItem &&
        "sources" in firstItem
      ) {
        const sourcesData = (firstItem as any).sources;
        if (Array.isArray(sourcesData)) {
          extractedSources = sourcesData as Source[];
        }
      }
    }

    if (
      extractedSources.length === 0 &&
      typeof data === "object" &&
      data &&
      "sources" in data
    ) {
      const sourcesData = (data as any).sources;
      if (Array.isArray(sourcesData)) {
        extractedSources = sourcesData as Source[];
      }
    }

    // Approach 3: Look for parts with type 'source'
    if (extractedSources.length === 0 && Array.isArray(data)) {
      for (const item of data) {
        if (
          typeof item === "object" &&
          item &&
          "type" in item &&
          item.type === "source"
        ) {
          if ("source" in item && typeof item.source === "object") {
            const sourceObj = item.source as unknown;
            // Validate that it has the required properties before adding it
            if (
              typeof sourceObj === "object" &&
              sourceObj !== null &&
              "id" in sourceObj &&
              "sourceType" in sourceObj
            ) {
              extractedSources.push(sourceObj as Source);
            }
          }
        }
      }
    }

    // If we found sources, update the state
    if (extractedSources.length > 0) {
      console.log("Sources found:", extractedSources);
      setSources((prevSources) => {
        // Merge with existing sources, avoiding duplicates
        const newSources = [...prevSources];
        for (const source of extractedSources) {
          if (!newSources.some((s) => s.id === source.id)) {
            newSources.push(source);
          }
        }
        return newSources;
      });
    }
  };

  // Add auto-scrolling effect when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-between w-full  overflow-y-auto"
    >
      <div className="w-full max-w-4xl flex-1 pb-52">
        <MessageList
          messages={messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))}
          isLoading={isLoading}
          messageToSourcesMap={messageToSourcesMap}
          messageToReasoningMap={messageToReasoningMap}
          sources={sources}
          useThinking={useThinking}
        />
      </div>
      <div className="fixed bottom-5 border p-4 bg-card/80 backdrop-blur-lg  w-full max-w-4xl rounded-2xl shadow-lg z-10">
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
        />
      </div>
    </div>
  );
}
