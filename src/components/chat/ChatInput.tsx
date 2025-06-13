"use client";

import {
  FormEvent,
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useRef,
  useEffect,
  useState,
} from "react";
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
}

export function ChatInput({
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
}: ChatInputProps) {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const webSearchCompatibleModels = getWebSearchCompatibleModels();
  const thinkingCompatibleModels = getThinkingCompatibleModels();

  const modelConfig = findModelConfig(selectedModel);
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

  useEffect(() => {
    if (!isMounted) return;

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.max(100, Math.min(300, textarea.scrollHeight));
      textarea.style.height = `${newHeight}px`;
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

  const navigateToSettings = () => {
    navigate("/settings");
  };

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
        <textarea
          ref={textareaRef}
          className="flex-1 p-3 w-full  rounded-lg focus:outline-none  min-h-[20px] max-h-[300px] resize-none overflow-y-auto focus:border-none focus:ring-0"
          value={input}
          placeholder={
            apiKey ? "Ask me anything..." : "Set API key in settings first..."
          }
          onChange={handleInputChange}
          disabled={isLoading || !apiKey}
          rows={1}
        />

        {imagePreviews.length > 0 && (
          <div className="mb-2 flex gap-2">
            {imagePreviews.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`preview-${idx}`}
                className="max-w-[120px] max-h-[120px] rounded border"
              />
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2 w-full items-center">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple={false}
                ref={fileInputRef}
                onChange={(e) => {
                  if (onImageChange) onImageChange(e.target.files);
                }}
                className="hidden"
                disabled={isLoading}
              />
              <Label
                htmlFor="web-search"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-background cursor-pointer has-[[data-state=checked]]:border-primary/20 has-[[data-state=checked]]:bg-background"
              >
                <Checkbox
                  checked={useWebSearch}
                  onCheckedChange={() => {
                    if (supportsWebSearch) {
                      setUseWebSearch(!useWebSearch);
                    }
                  }}
                  id="web-search"
                  className="sr-only"
                  disabled={!supportsWebSearch || isLoading}
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
                className="hover:bg-background flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary/20 has-[[aria-checked=true]]:bg-background dark:has-[[aria-checked=true]]:border-primary/20 dark:has-[[aria-checked=true]]:bg-background"
                id="reasoning"
              >
                <Checkbox
                  checked={useThinking}
                  onCheckedChange={() => {
                    if (supportsThinking) {
                      setUseThinking(!useThinking);
                    }
                  }}
                  id="reasoning"
                  disabled={
                    !supportsThinking ||
                    isLoading ||
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
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="model-select"
                    className=" bg-card border border-border rounded-md px-2 py-1 text-xs focus:outline-none"
                  >
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllModelNames().map((modelName) => (
                      <SelectItem key={modelName} value={modelName}>
                        {modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="px-6 py-3 bg-primary rounded-full font-semibold hover:bg-primary/90 disabled:bg-primary/30 disabled:cursor-not-allowed transition-all"
                disabled={isLoading || !apiKey || !input}
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
