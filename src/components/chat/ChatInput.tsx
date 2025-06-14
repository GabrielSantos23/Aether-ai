"use client";

import {
  FormEvent,
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { ArrowUp, Brain, Globe, Paperclip } from "lucide-react";
import {
  getAllModelNames,
  findModelConfig,
  getWebSearchCompatibleModels,
  getThinkingCompatibleModels,
} from "@/lib/models";
import {
  Select,
  SelectContent,
  SelectValue,
  SelectTrigger,
  SelectItem,
} from "../ui/select";
import { ChatTitle } from "./title/chattitle";
import { ShineBorder } from "../ui/shine-border";
import { Label } from "../ui/label";
import TextareaAutosize from "react-textarea-autosize";

interface ChatInputProps {
  input: string;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: Error | null;
  apiKey: string;
  useWebSearch: boolean;
  setUseWebSearch: Dispatch<SetStateAction<boolean>>;
  useThinking: boolean;
  setUseThinking: Dispatch<SetStateAction<boolean>>;
  selectedModel: string;
  setSelectedModel: Dispatch<SetStateAction<string>>;
  onImageChange?: (files: FileList | null) => void;
  imageFiles?: FileList | null;
  disabled?: boolean;
}

// Memoized model selector component to prevent re-renders
const ModelSelector = React.memo(
  ({
    selectedModel,
    setSelectedModel,
    isLoading,
  }: {
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    isLoading: boolean;
  }) => {
    const allModelNames = useMemo(() => getAllModelNames(), []);

    return (
      <Select
        value={selectedModel}
        onValueChange={setSelectedModel}
        disabled={isLoading}
      >
        <SelectTrigger
          id="model-select"
          className="hover:bg-background dark:bg-transparent border border-border rounded-md px-2 py-1 text-xs focus:outline-none"
        >
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {allModelNames.map((modelName) => (
            <SelectItem key={modelName} value={modelName}>
              {modelName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

// Memoized image preview component
const ImagePreviews = React.memo(({ previews }: { previews: string[] }) => {
  if (previews.length === 0) return null;

  return (
    <div className="mb-2 flex gap-2">
      {previews.map((url, idx) => (
        <img
          key={idx}
          src={url}
          alt={`preview-${idx}`}
          className="max-w-[120px] max-h-[120px] rounded border"
        />
      ))}
    </div>
  );
});

function ChatInputComponent({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  apiKey,
  useWebSearch,
  setUseWebSearch,
  useThinking,
  setUseThinking,
  selectedModel,
  setSelectedModel,
  onImageChange,
  imageFiles,
  disabled = false,
}: ChatInputProps) {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Memoize these values to prevent recalculations
  const modelConfig = useMemo(
    () => findModelConfig(selectedModel),
    [selectedModel]
  );
  const supportsWebSearch = modelConfig?.supportsWebSearch || false;
  const supportsThinking = modelConfig?.supportsThinking || false;

  // Set isMounted on initial render
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (selectedModel === "Deepseek R1 0528") {
      setUseThinking(true);
    } else if (!supportsThinking) {
      setUseThinking(false);
    }

    if (!supportsWebSearch) {
      setUseWebSearch(false);
    }
  }, [
    isMounted,
    selectedModel,
    setUseThinking,
    setUseWebSearch,
    supportsWebSearch,
    supportsThinking,
  ]);

  // Optimize textarea height adjustment with a debounce mechanism
  useEffect(() => {
    if (!isMounted) return;

    const textarea = textareaRef.current;
    if (textarea) {
      // Use requestAnimationFrame for smoother rendering
      requestAnimationFrame(() => {
        textarea.style.height = "auto";
        const newHeight = Math.max(100, Math.min(300, textarea.scrollHeight));
        textarea.style.height = `${newHeight}px`;
      });
    }
  }, [input, isMounted]);

  useEffect(() => {
    if (!isMounted || !error) return;

    toast.error(
      error.message || "An error occurred during chat. Please try again."
    );
  }, [error, isMounted]);

  // Generate image previews when imageFiles changes
  useEffect(() => {
    if (imageFiles && imageFiles.length > 0) {
      const urls = Array.from(imageFiles).map((file) =>
        URL.createObjectURL(file)
      );
      setImagePreviews(urls);
      // Cleanup: revoke object URLs when files change or component unmounts
      return () => {
        urls.forEach((url) => URL.revokeObjectURL(url));
      };
    } else {
      setImagePreviews([]);
    }
  }, [imageFiles]);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onImageChange) onImageChange(e.target.files);
    },
    [onImageChange]
  );

  const handleWebSearchChange = useCallback(() => {
    if (supportsWebSearch) {
      setUseWebSearch(!useWebSearch);
    }
  }, [supportsWebSearch, useWebSearch, setUseWebSearch]);

  const handleThinkingChange = useCallback(() => {
    if (supportsThinking) {
      setUseThinking(!useThinking);
    }
  }, [supportsThinking, useThinking, setUseThinking]);

  const navigateToSettings = () => {
    navigate("/settings");
  };

  // Check if input should be disabled (either due to loading, no API key, or no permission)
  const isInputDisabled = isLoading || !apiKey || disabled;

  if (!isMounted) {
    return (
      <div className="flex items-start gap-4 max-w-4xl mx-auto flex-col">
        <div className="w-full h-[100px] bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className="flex items-start gap-4 max-w-4xl mx-auto flex-col"
        encType="multipart/form-data"
      >
        <TextareaAutosize
          ref={textareaRef}
          className={`flex-1 p-3 w-full rounded-lg focus:outline-none min-h-[20px] max-h-[300px] resize-none overflow-y-auto focus:border-none focus:ring-0 ${
            disabled ? "bg-muted text-muted-foreground" : ""
          }`}
          value={input}
          placeholder={
            disabled
              ? "You don't have permission to send messages..."
              : apiKey
              ? "Ask me anything..."
              : "Set API key in settings first..."
          }
          onChange={handleInputChange}
          disabled={isInputDisabled}
          minRows={1}
          maxRows={10}
        />

        <ImagePreviews previews={imagePreviews} />

        <div className="flex flex-col gap-2 w-full items-center">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex items-center gap-2 hover:bg-background border"
                onClick={handleFileClick}
                disabled={isInputDisabled}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple={false}
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isInputDisabled}
              />
              <Label
                htmlFor="web-search"
                className={`flex items-center gap-3 rounded-lg border p-3 hover:bg-background has-[[data-state=checked]]:border-primary/20 has-[[data-state=checked]]:bg-background ${
                  isInputDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <Checkbox
                  checked={useWebSearch}
                  onCheckedChange={handleWebSearchChange}
                  id="web-search"
                  className="sr-only"
                  disabled={!supportsWebSearch || isInputDisabled}
                />
                <span
                  className={`text-xs ${
                    useWebSearch ? "text-yellow-500" : "text-muted-foreground"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                </span>
                <span className="text-xs">Web Search</span>
              </Label>

              <Label
                className={`hover:bg-background flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary/20 has-[[aria-checked=true]]:bg-background dark:has-[[aria-checked=true]]:border-primary/20 dark:has-[[aria-checked=true]]:bg-background ${
                  isInputDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                id="reasoning"
              >
                <Checkbox
                  checked={useThinking}
                  onCheckedChange={handleThinkingChange}
                  id="reasoning"
                  disabled={
                    !supportsThinking ||
                    isInputDisabled ||
                    selectedModel === "Deepseek R1 0528"
                  }
                  className="sr-only"
                />

                <span
                  className={`text-xs ${
                    useThinking ? "text-yellow-500" : "text-muted-foreground"
                  }`}
                >
                  <Brain className="w-4 h-4" />
                </span>
                <span>Reasoning</span>
              </Label>
            </div>
            <div className="flex items-center gap-2 ">
              <div>
                <ModelSelector
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  isLoading={isLoading || disabled}
                />
              </div>
              <Button
                type="submit"
                className="px-6 py-3 bg-primary rounded-full font-semibold hover:bg-primary/90 disabled:bg-primary/30 disabled:cursor-not-allowed transition-all"
                disabled={isInputDisabled || !input}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export const ChatInput = React.memo(ChatInputComponent);
