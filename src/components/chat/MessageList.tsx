"use client";

import React, { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { getSourceDisplayInfoSync } from "../getFaviconUrl";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { SidebarTrigger } from "../ui/sidebar";
import { useSidebarWithSide } from "../ui/sidebar";
import { useSources } from "../sidebar";
import { MessageActions } from "./MessageActions";

export interface Source {
  id: string;
  sourceType: string;
  title?: string;
  url?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image?: string }>;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  messageToSourcesMap: Record<string, Source[]>;
  messageToReasoningMap: Record<string, string>;
  reasoningUpdateTimestamps: Record<string, number>;
  sources: Source[];
  useThinking: boolean;
  selectedModel?: string;
  messageToModelMap?: Record<string, string>;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onBranchOff?: (messageId: string) => void;
  onModelChange?: (messageId: string, newModel: string) => void;
  editingMessageId?: string | null;
  editingContent?: string;
  setEditingContent?: React.Dispatch<React.SetStateAction<string>>;
}

const MessageListComponent = ({
  messages,
  isLoading,
  messageToSourcesMap,
  messageToReasoningMap,
  reasoningUpdateTimestamps,
  sources,
  useThinking,
  selectedModel,
  messageToModelMap = {},
  onRetry,
  onEdit,
  onBranchOff,
  onModelChange,
  editingMessageId,
  editingContent,
  setEditingContent,
}: MessageListProps) => {
  const rightSidebar = useSidebarWithSide("right");
  const { setActiveSources } = useSources();

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8">
      {messages.length >= 0 &&
        messages.map((m) => (
          <div
            key={m.id}
            data-message-id={m.id}
            className={`${
              m.role === "user"
                ? "flex flex-col items-end mb-8"
                : "flex flex-col items-start w-full mb-8"
            } group`}
          >
            {/* Message container */}
            <div
              className={
                m.role === "user"
                  ? "bg-card text-primary-foreground px-6 py-4 rounded-2xl rounded-br-md shadow-lg max-w-2xl"
                  : "w-full bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-border"
              }
            >
              {/* Thinking Process Section */}
              {m.role === "assistant" &&
                messageToReasoningMap[m.id] &&
                useThinking && (
                  <div
                    key={`thinking-${m.id}-${
                      reasoningUpdateTimestamps[`_lastUpdate_${m.id}`] || 0
                    }`}
                    className="border-b border-border bg-muted/30"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">
                            Thinking Process
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Claude's reasoning steps
                          </p>
                        </div>
                      </div>
                      <div className="bg-background rounded-xl p-4 border border-border max-h-80 overflow-auto">
                        <div className="text-sm leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            components={{
                              code({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                              }: any) {
                                const match = /language-(\w+)/.exec(
                                  className || ""
                                );
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code
                                    className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              p: ({ children }) => (
                                <p className="mb-3 text-foreground leading-relaxed">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-foreground">
                                  {children}
                                </strong>
                              ),
                            }}
                          >
                            {messageToReasoningMap[m.id]}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Main message content - multimodal support */}
              {Array.isArray(m.content) ? (
                <div className="p-6">
                  {m.content.map((part, idx) => {
                    if (part.type === "text") {
                      return (
                        <div key={idx} className="mb-2">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                          >
                            {part.text || ""}
                          </ReactMarkdown>
                        </div>
                      );
                    } else if (part.type === "image" && part.image) {
                      return (
                        <div key={idx} className="mb-4">
                          <img
                            src={part.image}
                            alt="uploaded"
                            className="max-w-sm max-h-80 rounded-lg border border-border shadow-sm"
                          />
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                </div>
              ) : m.role === "user" &&
                editingMessageId === m.id &&
                setEditingContent ? (
                <div className="flex flex-col">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg mb-3 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    autoFocus
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit?.(m.id, editingContent || "")}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        if (editingMessageId) {
                          if (setEditingContent) {
                            setEditingContent("");
                          }
                          onEdit?.(editingMessageId, "cancel");
                        }
                      }}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={m.role === "assistant" ? "p-6" : undefined}>
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-p:leading-7 prose-li:text-foreground prose-strong:text-foreground prose-code:text-accent-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:text-primary hover:prose-a:text-primary/80 prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      components={{
                        code({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <div className="my-6 rounded-lg overflow-hidden border border-border">
                              <div className="flex items-center justify-between bg-muted px-4 py-3 border-b border-border">
                                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  {match[1]}
                                </span>
                                <button
                                  onClick={() =>
                                    navigator.clipboard.writeText(
                                      String(children)
                                    )
                                  }
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-background"
                                >
                                  Copy
                                </button>
                              </div>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="!mt-0 !mb-0"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code
                              className="bg-muted text-accent-foreground px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground border-b border-border pb-3">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold mt-6 mb-3 text-foreground">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-semibold mt-5 mb-2 text-foreground">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-4 text-foreground leading-7">
                            {children}
                          </p>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 py-3 my-4 italic bg-muted/50 rounded-r-lg">
                            {children}
                          </blockquote>
                        ),
                        ul: ({ children }) => (
                          <ul className="space-y-2 my-4 ml-4">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="space-y-2 my-4 ml-4 list-decimal">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-foreground leading-relaxed">
                            {children}
                          </li>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-6 rounded-lg border border-border">
                            <table className="min-w-full">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-muted">{children}</thead>
                        ),
                        th: ({ children }) => (
                          <th className="px-4 py-3 text-left font-semibold text-foreground border-b border-border">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-4 py-3 text-foreground border-b border-border last:border-b-0">
                            {children}
                          </td>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">
                            {children}
                          </strong>
                        ),
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-colors"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {typeof m.content === "string" ? m.content : ""}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Position actions outside and below the message */}
            {(!editingMessageId || editingMessageId !== m.id) && (
              <div className={m.role === "user" ? "mt-2" : "mt-2 w-full"}>
                <MessageActions
                  role={m.role}
                  content={
                    typeof m.content === "string"
                      ? m.content
                      : Array.isArray(m.content)
                      ? m.content
                          .map((part) => {
                            if (part.type === "text") return part.text || "";
                            if (part.type === "image") return "[Image]";
                            return "";
                          })
                          .join(" ")
                      : ""
                  }
                  messageId={m.id}
                  model={
                    m.role === "assistant"
                      ? messageToModelMap && messageToModelMap[m.id]
                        ? messageToModelMap[m.id]
                        : selectedModel
                      : undefined
                  }
                  onRetry={() => onRetry?.(m.id)}
                  onEdit={(content) => onEdit?.(m.id, content)}
                  onBranchOff={() => onBranchOff?.(m.id)}
                  onModelChange={onModelChange}
                />
              </div>
            )}

            {/* Sources display for AI messages */}
            {m.role === "assistant" &&
              messageToSourcesMap[m.id] &&
              messageToSourcesMap[m.id].length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {messageToSourcesMap[m.id]
                        .filter((source: Source) => source.sourceType === "url")
                        .slice(0, 3)
                        .map((source: Source, index: number) => {
                          const { faviconUrl, displayTitle, domain } =
                            getSourceDisplayInfoSync(source);

                          return (
                            <Avatar
                              key={`${source.id}-${index}`}
                              className="cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-background"
                              onClick={() => {
                                const messageSources =
                                  messageToSourcesMap[m.id] || [];
                                setActiveSources(messageSources);
                                rightSidebar.setOpen(true);
                              }}
                            >
                              <AvatarImage
                                src={faviconUrl || ""}
                                alt={domain || "Source"}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                {(domain?.charAt(0) || "S") +
                                  (domain?.charAt(1) || "")}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                    </div>
                    <div>
                      <span
                        className="text-sm font-medium cursor-pointer hover:underline text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          const messageSources =
                            messageToSourcesMap[m.id] || [];
                          setActiveSources(messageSources);
                          rightSidebar.setOpen(true);
                        }}
                      >
                        {messageToSourcesMap[m.id].length} Sources
                      </span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        ))}

      {/* Enhanced Thinking Process Loading */}
      {isLoading &&
        useThinking &&
        (() => {
          const lastUserMessage = messages
            .filter((m) => m.role === "user")
            .pop();

          if (lastUserMessage) {
            const thinkingId = `thinking-${lastUserMessage.id}`;
            const ongoingThinking = messageToReasoningMap[thinkingId];

            if (ongoingThinking) {
              return (
                <div
                  key={`ongoing-thinking-${thinkingId}-${
                    messageToReasoningMap[`_lastUpdate_${thinkingId}`] || 0
                  }`}
                  className="flex justify-start"
                >
                  <div className="w-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="border-b border-border bg-muted/30">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                            <svg
                              className="w-4 h-4 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">
                              Thinking Process
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Claude is reasoning through your request
                            </p>
                          </div>
                        </div>
                        <div className="bg-background rounded-xl p-4 border border-border max-h-80 overflow-auto">
                          <div className="text-sm leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              components={{
                                code({
                                  node,
                                  inline,
                                  className,
                                  children,
                                  ...props
                                }: any) {
                                  const match = /language-(\w+)/.exec(
                                    className || ""
                                  );
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code
                                      className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                p: ({ children }) => (
                                  <p className="mb-3 text-foreground leading-relaxed">
                                    {children}
                                  </p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-foreground">
                                    {children}
                                  </strong>
                                ),
                              }}
                            >
                              {ongoingThinking}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Generating response...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          }
          return null;
        })()}

      {/* Enhanced Standard Loading Indicator */}
      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" &&
        !messageToReasoningMap[
          `thinking-${messages[messages.length - 1].id}`
        ] && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Claude is responding...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export const MessageList = React.memo(MessageListComponent);
