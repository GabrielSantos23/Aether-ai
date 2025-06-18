"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "../../components/ui/button";
import { cn } from "@/lib/utils";
import {
  Check,
  Copy,
  RefreshCcw,
  SquarePen,
  GitBranch,
  Loader2,
} from "lucide-react";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { useDataService } from "@/frontend/hooks/useDataService";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface MessageControlsProps {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  content: string;
  setMode?: Dispatch<SetStateAction<"view" | "edit">>;
  reload: UseChatHelpers["reload"];
  stop: UseChatHelpers["stop"];
}

export default function MessageControls({
  threadId,
  message,
  setMessages,
  content,
  setMode,
  reload,
  stop,
}: MessageControlsProps) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isBranching, setIsBranching] = useState(false);
  const hasRequiredKeys = useAPIKeyStore((state) => state.hasRequiredKeys());
  const { dataService } = useDataService();
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleRegenerate = async () => {
    if (isRegenerating) return;

    try {
      setIsRegenerating(true);

      // stop the current request
      stop();

      // Ensure we have a valid createdAt value
      let messageCreatedAt = message.createdAt;

      // If createdAt is not available or invalid, use current time
      if (!messageCreatedAt) {
        console.warn("Message has no createdAt timestamp, using current time");
        messageCreatedAt = new Date();
      }

      if (message.role === "user") {
        await dataService.deleteTrailingMessages(
          threadId,
          messageCreatedAt,
          false
        );

        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === message.id);

          if (index !== -1) {
            return [...messages.slice(0, index + 1)];
          }

          return messages;
        });
      } else {
        await dataService.deleteTrailingMessages(threadId, messageCreatedAt);

        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === message.id);

          if (index !== -1) {
            return [...messages.slice(0, index)];
          }

          return messages;
        });
      }

      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        reload();
        setIsRegenerating(false);
      }, 100);
    } catch (error) {
      console.error("Error during regeneration:", error);
      setIsRegenerating(false);
    }
  };

  const handleBranch = async () => {
    if (isBranching) return;

    try {
      setIsBranching(true);
      console.log("Branching from message:", message);

      // Get messages to branch with - first try from the current UI state
      let messagesForBranch: any[] = [];

      // Use the current UI messages from the setMessages function
      setMessages((currentMessages) => {
        // Find the index of the clicked message
        const messageIndex = currentMessages.findIndex(
          (m) => m.id === message.id
        );

        if (messageIndex !== -1) {
          // Only include messages up to and including the clicked message
          messagesForBranch = currentMessages.slice(0, messageIndex + 1);
          console.log(
            `Found message at index ${messageIndex}, including ${messagesForBranch.length} messages in branch`
          );
        }
        return currentMessages; // Don't actually change the messages
      });

      // If we couldn't find the message in UI state, try fetching from server
      if (messagesForBranch.length === 0) {
        console.log(
          "Message not found in UI state, trying to fetch from server..."
        );
        try {
          const allMessages = await dataService.getMessagesByThreadId(threadId);
          console.log("Current message ID:", message.id);
          console.log("All messages from server:", allMessages.length);

          // Try to find the message in the thread
          const messageIndex = allMessages.findIndex(
            (m: any) => m.id === message.id
          );

          if (messageIndex !== -1) {
            // Only include messages up to and including the clicked message
            messagesForBranch = allMessages.slice(0, messageIndex + 1);
            console.log(
              `Found message at index ${messageIndex}, including ${messagesForBranch.length} messages in branch`
            );
          } else {
            // If not found by ID, try to find by content and role as a fallback
            console.log(
              "Message not found by ID, trying to find by content..."
            );
            const contentIndex = allMessages.findIndex(
              (m: any) =>
                m.role === message.role && m.content === message.content
            );

            if (contentIndex !== -1) {
              messagesForBranch = allMessages.slice(0, contentIndex + 1);
              console.log(
                `Found message by content at index ${contentIndex}, including ${messagesForBranch.length} messages in branch`
              );
            }
          }
        } catch (fetchError) {
          console.error("Error fetching messages:", fetchError);
          // Continue with empty messages array - we'll check length below
        }
      }

      // If we still don't have messages, show an error
      if (messagesForBranch.length === 0) {
        console.error("Could not find message in thread");
        toast.error("Could not create branch - message not found");
        setIsBranching(false);
        return;
      }

      // Log the messages that will be included in the branch
      console.log(
        "Messages to include in branch:",
        messagesForBranch.map((m) => ({
          id: m.id,
          role: m.role,
          content:
            m.content?.substring(0, 50) + (m.content?.length > 50 ? "..." : ""),
        }))
      );

      // Create a new thread as a branch
      let parentThreadTitle = "Chat";
      try {
        const threads = await dataService.getThreads();
        const parentThread = threads.find((t: any) => t.id === threadId);
        if (parentThread && parentThread.title) {
          parentThreadTitle = parentThread.title;
        }
      } catch (threadError) {
        console.warn("Could not fetch parent thread title:", threadError);
        // Continue with default title
      }

      // Use the parent title without adding "(branch)" suffix
      const branchTitle = parentThreadTitle;
      const newThreadId = uuidv4(); // Generate a UUID for the new thread

      // Create the new thread with the required ID parameter and set isBranch flag
      try {
        // Create the thread with basic info and set isBranch flag
        await dataService.createThread(newThreadId, branchTitle, true);
        console.log("New thread created with ID:", newThreadId);

        // Store branch metadata using our new method
        await dataService.updateThreadMetadata(newThreadId, {
          isBranch: true,
          parentThreadId: threadId,
          branchedFromMessageId: message.id,
        });
      } catch (threadError) {
        console.error("Failed to create thread:", threadError);
        toast.error("Could not create branch - thread creation failed");
        setIsBranching(false);
        return;
      }

      // Copy messages to the new thread
      let messagesCopied = 0;
      try {
        for (const msg of messagesForBranch) {
          try {
            // Create a message with required parts property
            const messageId = uuidv4(); // Generate a new ID for each message
            await dataService.createMessage(newThreadId, {
              id: messageId,
              content: msg.content || "",
              role: msg.role || "user",
              createdAt: msg.createdAt || new Date(),
              parts: [{ type: "text", text: msg.content || "" }],
            });
            messagesCopied++;
          } catch (msgError) {
            console.error("Error copying message:", msgError);
            // Continue with other messages
          }
        }

        if (messagesCopied === 0) {
          throw new Error("No messages were copied to the new thread");
        }

        // Navigate to the new thread
        toast.success(`Created new branch with ${messagesCopied} messages`);
        navigate(`/chat/${newThreadId}`);
      } catch (error) {
        console.error("Error copying messages:", error);
        toast.error("Failed to copy messages to branch");
        setIsBranching(false);
      }
    } catch (error) {
      console.error("Error creating branch:", error);
      toast.error("Failed to create branch");
    } finally {
      setIsBranching(false);
    }
  };

  return (
    <div
      className={cn(
        "opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex gap-1",
        {
          "absolute mt-5 right-2": message.role === "user",
        }
      )}
    >
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
      {setMode && hasRequiredKeys && (
        <Button variant="ghost" size="icon" onClick={() => setMode("edit")}>
          <SquarePen className="w-4 h-4" />
        </Button>
      )}
      {hasRequiredKeys && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            <RefreshCcw
              className={cn("w-4 h-4", { "animate-spin": isRegenerating })}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBranch}
            disabled={isBranching}
            title="Create a new branch from this point"
          >
            {isBranching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4" />
            )}
          </Button>
        </>
      )}
    </div>
  );
}
