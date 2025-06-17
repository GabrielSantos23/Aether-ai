"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "../../components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, RefreshCcw, SquarePen, GitBranch } from "lucide-react";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { useDataService } from "@/frontend/hooks/useDataService";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { DBMessage } from "@/frontend/dexie/db";

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
      console.log(
        "Branching from message:",
        message.id,
        "Content:",
        message.content.substring(0, 50)
      );

      // Get all messages up to and including the current message
      const allMessages = await dataService.getMessagesByThreadId(threadId);
      console.log("All messages in thread:", allMessages.length);
      console.log(
        "Sample message IDs:",
        allMessages.slice(0, 3).map((m: DBMessage) => m.id)
      );

      // Try different methods to find the message
      let messageIndex = allMessages.findIndex(
        (m: DBMessage) => m.id === message.id
      );

      // If not found by ID, try matching by content
      if (messageIndex === -1 && message.content) {
        console.log("Message not found by ID, trying to match by content");
        messageIndex = allMessages.findIndex(
          (m: DBMessage) =>
            m.role === message.role &&
            m.content &&
            message.content &&
            m.content.substring(0, 40) === message.content.substring(0, 40)
        );
      }

      if (messageIndex === -1) {
        console.error("Could not find message in thread");
        toast.error("Could not create branch");
        setIsBranching(false);
        return;
      }

      console.log("Found message at index:", messageIndex);

      // Get messages up to this point
      const messagesForBranch = allMessages.slice(0, messageIndex + 1);

      // Create a new thread as a branch
      const parentThread = await dataService.getThread(threadId);
      const branchTitle = parentThread
        ? `${parentThread.title} (branch)`
        : "New Branch";

      // Generate a new ID for the branch thread
      const newThreadId = uuidv4();

      const newThread = await dataService.createThread({
        id: newThreadId,
        title: branchTitle,
        parentThreadId: threadId,
        branchedFromMessageId: message.id,
      });

      if (!newThread) {
        throw new Error("Failed to create new thread");
      }

      // Copy messages to the new thread
      for (const msg of messagesForBranch) {
        await dataService.createMessage(newThread.id, {
          id: msg.id,
          content: msg.content,
          role: msg.role,
          createdAt: msg.createdAt,
          parts: msg.parts || [],
          sources: msg.sources,
          reasoning: msg.reasoning,
        });
      }

      // Navigate to the new thread
      toast.success("Created new branch");
      navigate(`/chat/${newThread.id}`);
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
            <GitBranch
              className={cn("w-4 h-4", { "animate-spin": isBranching })}
            />
          </Button>
        </>
      )}
    </div>
  );
}
