import { memo, useState, useEffect } from "react";
import MarkdownRenderer from "@/frontend/components/MemoizedMarkdown";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import equal from "fast-deep-equal";
import MessageControls from "./MessageControls";
import { UseChatHelpers } from "@ai-sdk/react";
import MessageEditor from "./MessageEditor";
import MessageReasoning from "./MessageReasoning";
import { Search, BrainCircuit, ExternalLink } from "lucide-react";

// Define a type for the search source
interface SearchSource {
  title?: string;
  url: string;
  snippet?: string;
  id?: string;
}

// Component to display search sources
const SearchSources = ({ sources }: { sources: SearchSource[] }) => {
  if (!sources || sources.length === 0) return null;

  // Check if we have a Tavily summary
  const tavilySummary = sources.find(
    (source) => source.title === "Tavily Search Summary"
  );
  // Filter out the Tavily summary from regular sources
  const regularSources = sources.filter(
    (source) => source.title !== "Tavily Search Summary"
  );

  return (
    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
      <h4 className="text-sm font-medium text-blue-500 mb-2 flex items-center gap-1">
        <Search className="h-3 w-3" />
        Sources ({regularSources.length})
      </h4>

      {/* Display Tavily summary if available */}
      {tavilySummary && (
        <div className="mb-3 pb-3 border-b border-blue-500/20">
          <h5 className="text-xs font-medium text-blue-500 mb-1">
            Search Summary
          </h5>
          <p className="text-xs text-muted-foreground">
            {tavilySummary.snippet}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {regularSources.map((source, index) => (
          <li key={index} className="text-xs">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {source.title || source.url}
            </a>
            {source.snippet && (
              <p className="mt-1 text-muted-foreground">{source.snippet}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

function PureMessage({
  threadId,
  message,
  setMessages,
  reload,
  isStreaming,
  registerRef,
  stop,
  searchSources = [],
}: {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isStreaming: boolean;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stop: UseChatHelpers["stop"];
  searchSources?: SearchSource[];
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [reasoningRendered, setReasoningRendered] = useState(false);

  useEffect(() => {
    if (message.role === "assistant" && searchSources.length > 0) {
    }
  }, [message.role, searchSources]);

  // Check if message has web search results
  const hasWebSearchResults = message.parts.some(
    (part) =>
      part.type === "text" &&
      typeof part.text === "string" &&
      part.text.includes("web_search_preview")
  );

  // Check if message has thinking steps
  const hasThinking = message.parts.some(
    (part) =>
      part.type === "reasoning" ||
      (part.type === "text" &&
        typeof part.text === "string" &&
        (part.text.includes("think tool") ||
          part.text.includes("step by step") ||
          part.text.includes("step-by-step") ||
          part.text.includes("thinking process")))
  );

  // Extract reasoning content from message parts
  let reasoningContent = "";
  let hasReasoningPart = false;

  // Check if any message part has type "reasoning"
  if (message.parts) {
    hasReasoningPart = message.parts.some((part) => part.type === "reasoning");
  }

  // Use a custom property instead of the deprecated reasoning property
  const customReasoning = (message as any)._reasoning;

  if (customReasoning) {
    reasoningContent = customReasoning;
  } else if (message.role === "assistant" && (message as any).reasoning) {
    // Try to access reasoning directly from the message object
    reasoningContent = (message as any).reasoning;
  } else if (
    typeof message.content === "string" &&
    (message.content.includes("Thinking Process") ||
      message.content.includes("step by step") ||
      message.content.includes("step-by-step"))
  ) {
    reasoningContent = message.content;
  } else {
    for (const part of message.parts) {
      if (part.type === "text" && typeof part.text === "string") {
        if (
          part.text.includes("Thinking Process") ||
          part.text.includes("step by step") ||
          part.text.includes("step-by-step")
        ) {
          reasoningContent = part.text;
          break;
        }
      }
    }
  }

  // Debug output for reasoning
  if (message.role === "assistant") {
    // Also check custom reasoning property on message
    if ((message as any)._reasoning) {
      if (!reasoningContent) {
        reasoningContent = (message as any)._reasoning;
      }
    }

    // Check for reasoning property
    if ((message as any).reasoning) {
      if (!reasoningContent) {
        reasoningContent = (message as any).reasoning;
      }
    }
  }

  // Show sources for assistant messages when sources are available
  const shouldShowSources =
    message.role === "assistant" &&
    (searchSources.length > 0 ||
      message.parts.some((part) => part.type === "source"));

  // Extract sources from message parts if available
  const allSources = [...searchSources];

  // Add sources from message parts if they exist
  if (message.role === "assistant") {
    message.parts.forEach((part) => {
      if (part.type === "source" && part.source) {
        const sourceExists = allSources.some(
          (existingSource) => existingSource.url === part.source.url
        );

        if (!sourceExists) {
          allSources.push({
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
            snippet: "",
          });
        }
      }
    });
  }

  return (
    <div
      role="article"
      className={cn(
        "flex flex-col",
        message.role === "user" ? "items-end" : "items-start"
      )}
    >
      {/* Tool indicators for assistant messages */}
      {message.role === "assistant" && (
        <div className="flex gap-2 mb-2">
          {hasWebSearchResults && (
            <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded-md flex items-center gap-1">
              <Search className="h-3 w-3" />
              <span>Web Search</span>
            </div>
          )}
          {(hasThinking || reasoningContent) && (
            <div className="text-xs px-2 py-1 bg-purple-500/20 text-purple-500 rounded-md flex items-center gap-1">
              <BrainCircuit className="h-3 w-3" />
              <span>Thinking</span>
            </div>
          )}
          {shouldShowSources && (
            <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded-md flex items-center gap-1">
              <Search className="h-3 w-3" />
              <span>Sources Available</span>
            </div>
          )}
        </div>
      )}

      {/* Only display reasoning from extracted content if there's no dedicated reasoning part */}
      {reasoningContent &&
        message.role === "assistant" &&
        !hasReasoningPart && (
          <MessageReasoning reasoning={reasoningContent} id={message.id} />
        )}

      {message.parts.map((part, index) => {
        const { type } = part;
        const key = `message-${message.id}-part-${index}`;

        if (type === "reasoning") {
          return (
            <MessageReasoning
              key={key}
              reasoning={part.reasoning}
              id={message.id}
            />
          );
        }

        if (type === "text") {
          const text = part.text;
          const hasImage =
            typeof text === "string" &&
            (text.includes("![") ||
              text.includes("data:image/") ||
              /https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i.test(text));

          return message.role === "user" ? (
            <div
              key={key}
              id={`message-${message.id}`}
              className="relative group px-4 py-3 rounded-xl bg-secondary border border-secondary-foreground/2 max-w-[80%]"
              ref={(el) => registerRef(message.id, el)}
            >
              {mode === "edit" && (
                <MessageEditor
                  threadId={threadId}
                  message={message}
                  content={part.text}
                  setMessages={setMessages}
                  reload={reload}
                  setMode={setMode}
                  stop={stop}
                />
              )}
              {mode === "view" && (
                <div className="markdown-content">
                  {hasImage ? (
                    <MarkdownRenderer content={part.text} id={message.id} />
                  ) : (
                    <p>{part.text}</p>
                  )}
                </div>
              )}

              {mode === "view" && (
                <MessageControls
                  threadId={threadId}
                  content={part.text}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                  stop={stop}
                />
              )}
            </div>
          ) : (
            <div
              key={key}
              id={`message-${message.id}`}
              className="group flex flex-col gap-2 w-full"
              ref={(el) => registerRef(message.id, el)}
            >
              <div className="markdown-content">
                <MarkdownRenderer content={part.text} id={message.id} />
              </div>
              {!isStreaming && (
                <MessageControls
                  threadId={threadId}
                  content={part.text}
                  message={message}
                  setMessages={setMessages}
                  reload={reload}
                  stop={stop}
                />
              )}

              {shouldShowSources && !isStreaming && (
                <SearchSources sources={allSources} />
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

const PreviewMessage = memo(PureMessage, (prevProps, nextProps) => {
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
  if (
    (prevProps.message as any)._reasoning !==
    (nextProps.message as any)._reasoning
  )
    return false;
  if (!equal(prevProps.searchSources, nextProps.searchSources)) return false;
  return true;
});

PreviewMessage.displayName = "PreviewMessage";

export default PreviewMessage;
