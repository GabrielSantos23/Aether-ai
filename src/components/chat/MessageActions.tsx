"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyIcon, EditIcon, RefreshCw, GitBranchPlusIcon } from "lucide-react";

interface MessageActionsProps {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  model?: string;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
  onBranchOff?: () => void;
}

export function MessageActions({
  role,
  content,
  messageId,
  model,
  onRetry,
  onEdit,
  onBranchOff,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs text-muted-foreground">
      <TooltipProvider>
        {/* Copy button for both user and assistant */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              <CopyIcon className="h-3.5 w-3.5 mr-1" />
              {copied && <span className="text-xs text-primary">Copied!</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy</p>
          </TooltipContent>
        </Tooltip>

        {/* User-specific actions */}
        {role === "user" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onRetry?.()}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Retry message</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit?.(content)}
                >
                  <EditIcon className="h-3.5 w-3.5 mr-1" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit message</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Assistant-specific actions */}
        {role === "assistant" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onRetry?.()}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onBranchOff?.()}
                >
                  <GitBranchPlusIcon className="h-3.5 w-3.5 mr-1" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Branch off</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </TooltipProvider>
      {role === "assistant" && model && (
        <span className="mr-2 px-2 py-1 bg-muted rounded-md text-xs">
          {model}
        </span>
      )}
    </div>
  );
}
