"use client";

import { useEffect, useRef } from "react";
import { Message } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TextShimmerWave } from "../ui/text-shimmer-wave";

interface MessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export default function Messages({ messages, isLoading }: MessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Start a conversation</h2>
          <p className="text-muted-foreground">
            Send a message to start chatting with the AI assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 items-start",
              message.role === "user" ? "justify-end" : "justify-start w-full"
            )}
          >
            <div
              className={cn(
                "rounded-lg p-4",
                message.role === "user"
                  ? "bg-card max-w-[80%]"
                  : "w-full max-w-full"
              )}
            >
              {message.role === "user" ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              ) : (
                <div className="prose prose-invert max-w-none prose-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    components={{
                      // Enhanced paragraph styling
                      p: ({ children }) => (
                        <p className="mb-4 leading-7 text-foreground/90 [&:not(:first-child)]:mt-4">
                          {children}
                        </p>
                      ),

                      // Better heading hierarchy
                      h1: ({ children }) => (
                        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight mb-4 mt-6 first:mt-0 text-foreground">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="scroll-m-20 text-xl font-semibold tracking-tight mb-3 mt-6 first:mt-0 text-foreground">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="scroll-m-20 text-lg font-semibold tracking-tight mb-3 mt-4 first:mt-0 text-foreground">
                          {children}
                        </h3>
                      ),

                      // Enhanced list styling
                      ul: ({ children }) => (
                        <ul className="my-4 ml-6 list-disc space-y-2 text-foreground/90">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="my-4 ml-6 list-decimal space-y-2 text-foreground/90">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-7 [&>p]:mb-2">{children}</li>
                      ),

                      // Better blockquote styling
                      blockquote: ({ children }) => (
                        <blockquote className="mt-4 border-l-4 border-border bg-muted/50 pl-4 py-2 italic text-muted-foreground rounded-r-lg">
                          {children}
                        </blockquote>
                      ),

                      // Enhanced table styling
                      table: ({ children }) => (
                        <div className="my-4 w-full overflow-auto">
                          <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted/50">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-border px-4 py-2 text-foreground/90">
                          {children}
                        </td>
                      ),

                      // Enhanced code styling
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                          <div className="my-4 rounded-lg overflow-hidden border border-border">
                            <div className="bg-muted/30 px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">
                              {match[1]}
                            </div>
                            <SyntaxHighlighter
                              // @ts-ignore - type mismatch in the library
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!bg-transparent !m-0"
                              customStyle={{
                                background: "transparent",
                                padding: "1rem",
                                margin: 0,
                                fontSize: "0.875rem",
                                lineHeight: "1.5",
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code
                            className={cn(
                              "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium text-foreground",
                              className
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },

                      // Enhanced horizontal rule
                      hr: () => <hr className="my-6 border-border" />,

                      // Better link styling
                      a: ({ children, href, ...props }) => (
                        <a
                          href={href}
                          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        >
                          {children}
                        </a>
                      ),

                      // Enhanced emphasis
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-foreground/90">
                          {children}
                        </em>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-start">
            <TextShimmerWave className="font-mono text-sm">
              Generating response...
            </TextShimmerWave>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
