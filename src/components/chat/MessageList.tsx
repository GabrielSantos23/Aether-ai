"use client";

import { useRef, useEffect } from "react";
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
  content: string;
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
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onBranchOff?: (messageId: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  messageToSourcesMap,
  messageToReasoningMap,
  reasoningUpdateTimestamps,
  sources,
  useThinking,
  selectedModel,
  onRetry,
  onEdit,
  onBranchOff,
}: MessageListProps) {
  const rightSidebar = useSidebarWithSide("right");
  const { setActiveSources } = useSources();

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 ">
      {messages.length >= 0 &&
        messages.map((m) => (
          <div
            key={m.id}
            data-message-id={m.id}
            className={`${
              m.role === "user"
                ? "flex flex-col items-end mb-6"
                : "flex flex-col items-start w-full mb-6"
            } group`}
          >
            {/* Message container */}
            <div
              className={
                m.role === "user"
                  ? "bg-card p-4 rounded-2xl rounded-br-md shadow-lg max-w-md"
                  : "w-full rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border"
              }
            >
              {m.role === "assistant" &&
                messageToReasoningMap[m.id] &&
                useThinking && (
                  <div
                    key={`thinking-${m.id}-${
                      reasoningUpdateTimestamps[`_lastUpdate_${m.id}`] || 0
                    }`}
                    className="border-b  p-4 "
                  >
                    <div className="flex items-center mb-3">
                      <h4 className="text-sm font-semibold ">
                        Thinking Process
                      </h4>
                    </div>
                    <div className=" rounded-md p-3 border max-h-96 overflow-auto">
                      <div className="text-xs font-mono whitespace-pre-wrap">
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
                                  className={`${className} px-1 py-0.5 rounded text-xs`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {messageToReasoningMap[m.id]}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

              {/* Main message content */}
              <div className={`${m.role === "assistant" ? "p-4" : ""}`}>
                <div
                  className={`prose prose-sm max-w-none ${
                    m.role === "user"
                      ? "prose-invert"
                      : "prose-gray dark:prose-invert"
                  } prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700`}
                >
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
                          <div className="my-4">
                            <div className="flex items-center justify-between bg-card px-4 py-2 rounded-t-lg">
                              <span className="text-xs font-medium uppercase tracking-wide">
                                {match[1]}
                              </span>
                              <button
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    String(children)
                                  )
                                }
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!mt-0 !rounded-t-none"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-4  border-b border-gray-200 dark:border-gray-700 pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold mt-5 mb-3 ">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2 ">
                          {children}
                        </h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic ">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-1 my-3">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="space-y-1 my-3">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2"></span>
                          <span>{children}</span>
                        </li>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border rounded-lg  overflow-hidden">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-card px-4 py-2 text-left font-semibold border rounded-t-md">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-2  border rounded-md">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Position actions outside and below the message */}
            <div className={m.role === "user" ? "mt-1" : "mt-1 w-full"}>
              <MessageActions
                role={m.role}
                content={m.content}
                messageId={m.id}
                model={m.role === "assistant" ? selectedModel : undefined}
                onRetry={() => onRetry?.(m.id)}
                onEdit={(content) => onEdit?.(m.id, content)}
                onBranchOff={() => onBranchOff?.(m.id)}
              />
            </div>

            {/* Sources display for AI messages */}
            {m.role === "assistant" &&
              messageToSourcesMap[m.id] &&
              messageToSourcesMap[m.id].length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-x-2">
                    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
                      {messageToSourcesMap[m.id]
                        .filter((source: Source) => source.sourceType === "url")
                        .slice(0, 3)
                        .map((source: Source, index: number) => {
                          const { faviconUrl, displayTitle, domain } =
                            getSourceDisplayInfoSync(source);

                          return (
                            <Avatar
                              key={`${source.id}-${index}`}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
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
                              <AvatarFallback>
                                {(domain?.charAt(0) || "S") +
                                  (domain?.charAt(1) || "")}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                    </div>
                    <div>
                      <span
                        className="text-sm font-medium cursor-pointer hover:underline"
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
                  className="flex justify-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full  flex items-center justify-center shadow-lg animate-pulse">
                    <svg
                      className="w-5 h-5 text-white"
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
                  <div className="max-w-4xl  border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 dark:border-gray-700 p-4 ">
                      <div className="flex items-center mb-3">
                        <h4 className="text-sm font-semibold ">
                          Thinking Process
                        </h4>
                      </div>
                      <div className="rounded-lg p-3 border max-h-96 overflow-auto">
                        <div className="text-xs font-mono whitespace-pre-wrap">
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
                                    className={`${className} px-1 py-0.5 rounded text-xs`}
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {ongoingThinking}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2  rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2  rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2  rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          AI is thinking...
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

      {/* Standard loading indicator */}
      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" &&
        !messageToReasoningMap[
          `thinking-${messages[messages.length - 1].id}`
        ] && (
          <div className="flex justify-start gap-4">
            <div className="border rounded--2xl shadow-sm p-4">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">
                  AI Assistant is typing...
                </span>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
