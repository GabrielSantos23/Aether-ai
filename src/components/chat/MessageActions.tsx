"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CopyIcon,
  EditIcon,
  RefreshCw,
  GitBranchPlusIcon,
  CheckIcon,
  ChevronDownIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllModelNames } from "@/lib/models";

interface MessageActionsProps {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  model?: string;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
  onBranchOff?: () => void;
  onModelChange?: (messageId: string, newModel: string) => void;
}

export function MessageActions({
  role,
  content,
  messageId,
  model,
  onRetry,
  onEdit,
  onBranchOff,
  onModelChange,
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5 mr-1" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5 mr-1" />
              )}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="mr-2 px-2 py-1 bg-muted rounded-md text-xs flex items-center gap-1 cursor-pointer hover:bg-muted/80">
              {model}
              <ChevronDownIcon className="h-3 w-3" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-56">
            {getAllModelNames().map((modelName) => (
              <DropdownMenuItem
                key={modelName}
                className={
                  modelName === model ? "font-semibold bg-accent/30" : ""
                }
                onClick={() => {
                  if (modelName !== model && onModelChange) {
                    onModelChange(messageId, modelName);
                  }
                }}
              >
                {modelName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
