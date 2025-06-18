"use client";

import {
  ArrowUpIcon,
  ImageIcon,
  SearchIcon,
  BrainCircuitIcon,
  Sparkles,
  FileUpIcon,
  Code,
  Music,
  Video,
} from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import useAutoResizeTextarea from "@/hooks/useAutoResizeTextArea";
import { UseChatHelpers, useCompletion } from "@ai-sdk/react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import KeyPrompt from "@/frontend/components/KeyPrompt";
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { StopIcon } from "../../components/ui/icons";
import { toast } from "sonner";
import { useMessageSummary } from "../hooks/useMessageSummary";
import { useDataService } from "@/frontend/hooks/useDataService";
import { SearchSource } from "@/lib/data-service";
import { ChatTitle } from "@/components/chattitle";
import { ShineBorder } from "@/components/ui/shine-border";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModelStore } from "@/frontend/stores/ModelStore";
import { getModelConfig } from "@/lib/models";

interface ChatInputProps {
  threadId: string;
  input: UseChatHelpers["input"];
  status: UseChatHelpers["status"];
  setInput: UseChatHelpers["setInput"];
  append: UseChatHelpers["append"];
  stop: UseChatHelpers["stop"];
  activeTools: {
    webSearch: boolean;
    imageAnalysis: boolean;
    thinking: boolean;
    imageGeneration: boolean;
    fileUpload: boolean;
    codeExecution: boolean;
    audioGeneration: boolean;
    videoGeneration: boolean;
  };
  handleSubmit?: (e?: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  hasMessages: boolean;
  setHasMessages?: (hasMessages: boolean) => void;
  setActiveTools?: (tools: {
    webSearch: boolean;
    imageAnalysis: boolean;
    thinking: boolean;
    imageGeneration: boolean;
    fileUpload: boolean;
    codeExecution: boolean;
    audioGeneration: boolean;
    videoGeneration: boolean;
  }) => void;
}

interface StopButtonProps {
  stop: UseChatHelpers["stop"];
}

interface SendButtonProps {
  onSubmit: () => void;
  disabled: boolean;
}

// Custom type for image parts since UIMessage doesn't directly support image type
interface ImagePart {
  type: "text";
  text: string;
}

// Extended UIMessage interface to include sorces
interface ExtendedUIMessage extends UIMessage {
  sources?: any[];
}

const createUserMessage = (
  id: string,
  text: string,
  imageUrl?: string
): ExtendedUIMessage => {
  if (imageUrl) {
    const formattedText = text.trim()
      ? `${text.trim()}\n\n![Image](${imageUrl})`
      : `![Image](${imageUrl})`;

    return {
      id,
      parts: [
        {
          type: "text",
          text: formattedText,
        },
      ],
      role: "user",
      content: formattedText,
      createdAt: new Date(),
      sources: [],
    };
  }

  return {
    id,
    parts: [{ type: "text", text }],
    role: "user",
    content: text,
    createdAt: new Date(),
    sources: [],
  };
};

function PureChatInput({
  threadId,
  input,
  status,
  setInput,
  append,
  stop,
  activeTools,
  handleSubmit,
  handleInputChange,
  hasMessages,
  setActiveTools,
}: ChatInputProps) {
  const canChat = useAPIKeyStore((state) => state.hasRequiredKeys());
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dataService } = useDataService();
  const { selectedModel } = useModelStore();
  const modelConfig = getModelConfig(selectedModel);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 200,
  });

  const navigate = useNavigate();
  const { id } = useParams();

  // Update active tools based on selected model capabilities
  useEffect(() => {
    if (setActiveTools) {
      setActiveTools({
        webSearch: !!modelConfig.supportsWebSearch && activeTools.webSearch,
        imageAnalysis:
          !!modelConfig.supportsVision && activeTools.imageAnalysis,
        thinking: !!modelConfig.supportsThinking && activeTools.thinking,
        imageGeneration:
          !!modelConfig.supportsImageGeneration && activeTools.imageGeneration,
        fileUpload: !!modelConfig.supportsFileUpload && activeTools.fileUpload,
        codeExecution: false,
        audioGeneration: false,
        videoGeneration: false,
      });
    }
  }, [selectedModel, modelConfig]);

  const isDisabled = useMemo(
    () =>
      (!input.trim() && !imageUrl) ||
      status === "streaming" ||
      status === "submitted",
    [input, imageUrl, status]
  );

  const { complete } = useMessageSummary();

  const handleSubmitInternal = useCallback(async () => {
    const currentInput = textareaRef.current?.value || input;

    if (
      (!currentInput.trim() && !imageUrl) ||
      status === "streaming" ||
      status === "submitted"
    )
      return;

    const messageId = uuidv4();

    if (!id) {
      navigate(`/chat/${threadId}`);
      await dataService.createThread(threadId);
      complete(currentInput.trim(), {
        body: { threadId, messageId, isTitle: true },
      });
    } else {
      complete(currentInput.trim(), { body: { messageId, threadId } });
    }

    // Create message with image if available
    const userMessage = createUserMessage(
      messageId,
      currentInput.trim(),
      imageUrl
    );
    await dataService.createMessage(threadId, userMessage);

    append(userMessage);
    setInput("");
    setImageUrl("");
    setShowImagePreview(false);
    adjustHeight(true);
  }, [
    input,
    imageUrl,
    status,
    setInput,
    adjustHeight,
    append,
    id,
    textareaRef,
    threadId,
    complete,
    dataService,
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string;

        try {
          if (imageData.length > 500000) {
            toast.warning(
              "Large image detected. Resizing to reduce token usage."
            );
            resizeImage(file, 800, (resizedImage) => {
              setImageUrl(resizedImage);
              setShowImagePreview(true);
            });
          } else {
            setImageUrl(imageData);
            setShowImagePreview(true);
          }
        } catch (error) {
          console.error("Error processing image:", error);
          toast.error("Failed to process image. Please try again.");
        }
      }
    };
    reader.onerror = () => {
      toast.error("Error reading image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const resizeImage = (
    file: File,
    maxWidth: number,
    callback: (resizedImage: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const resizedImage = canvas.toDataURL("image/jpeg", 0.7);
        callback(resizedImage);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageUrl("");
    setShowImagePreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!canChat) {
    return <KeyPrompt />;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitInternal();
    }
  };

  const handleInputChangeInternal = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInput(e.target.value);
    adjustHeight();
  };

  const toggleTool = (tool: keyof typeof activeTools) => {
    if (setActiveTools) {
      setActiveTools({
        ...activeTools,
        [tool]: !activeTools[tool],
      });
    }
  };

  return (
    <div className={`fixed w-full max-w-3xl bottom-4`}>
      <div className="bg-card relative rounded-lg p-2 pb-0 w-full">
        {!id && <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />}
        <div className="relative">
          <div className="flex flex-col">
            {showImagePreview && imageUrl && (
              <div className="relative mb-2 p-2">
                <div className="relative w-32 h-32">
                  <img
                    src={imageUrl}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-y-auto max-h-[300px]">
              <Textarea
                id="chat-input"
                value={input}
                placeholder={getPlaceholder(activeTools)}
                className={cn(
                  "w-full px-4 py-3 border-none shadow-none dark:bg-transparent",
                  "placeholder:text-muted-foreground resize-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30",
                  "scrollbar-thumb-rounded-full",
                  "min-h-[72px]"
                )}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onChange={handleInputChangeInternal}
                aria-label="Chat message input"
                aria-describedby="chat-input-description"
              />
              <span id="chat-input-description" className="sr-only">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>

            <div className="h-14 flex items-center px-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    {/* Web Search toggle - only show if model supports it */}
                    {modelConfig.supportsWebSearch && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className={cn(
                              "h-8 w-8",
                              activeTools.webSearch &&
                                "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 hover:text-blue-600"
                            )}
                            onClick={() => toggleTool("webSearch")}
                            aria-label={
                              activeTools.webSearch
                                ? "Disable web search"
                                : "Enable web search"
                            }
                          >
                            <SearchIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {activeTools.webSearch
                            ? "Disable web search"
                            : "Enable web search"}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Thinking toggle - only show if model supports it */}
                    {modelConfig.supportsThinking && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className={cn(
                              "h-8 w-8",
                              activeTools.thinking &&
                                "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 hover:text-purple-600"
                            )}
                            onClick={() => toggleTool("thinking")}
                            aria-label={
                              activeTools.thinking
                                ? "Disable step-by-step thinking"
                                : "Enable step-by-step thinking"
                            }
                          >
                            <BrainCircuitIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {activeTools.thinking
                            ? "Disable step-by-step thinking"
                            : "Enable step-by-step thinking"}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Image Analysis toggle - only show if model supports vision */}
                    {modelConfig.supportsVision && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className="h-8 w-8 opacity-50 cursor-not-allowed"
                            disabled
                            aria-label="Image analysis - Coming soon"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Coming soon: Image analysis
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Image Generation toggle - only show if model supports it */}
                    {modelConfig.supportsImageGeneration && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className="h-8 w-8 opacity-50 cursor-not-allowed"
                            disabled
                            aria-label="Image generation - Coming soon"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Coming soon: Image generation
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* File Upload toggle - only show if model supports it */}
                    {modelConfig.supportsFileUpload && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className="h-8 w-8 opacity-50 cursor-not-allowed"
                            disabled
                            aria-label="File upload - Coming soon"
                          >
                            <FileUpIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Coming soon: File upload
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Code Execution toggle - only show if model supports it */}
                    {modelConfig.supportsCodeExecution && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className="h-8 w-8 opacity-50 cursor-not-allowed"
                            disabled
                            aria-label="Code execution - Coming soon"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Coming soon: Code execution
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Audio Generation toggle - only show if model supports it */}
                    {modelConfig.supportsAudioGeneration && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className="h-8 w-8 opacity-50 cursor-not-allowed"
                            disabled
                            aria-label="Audio generation - Coming soon"
                          >
                            <Music className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Coming soon: Audio generation
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Video Generation toggle - only show if model supports it */}
                    {modelConfig.supportsVideoGeneration && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size="icon"
                            className="h-8 w-8 opacity-50 cursor-not-allowed"
                            disabled
                            aria-label="Video generation - Coming soon"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Coming soon: Video generation
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>

                  {/* Image upload button - only show if image analysis is active */}
                  {activeTools.imageAnalysis && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-50 cursor-not-allowed"
                          disabled
                          aria-label="Image upload - Coming soon"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Coming soon: Image upload
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <ChatModelDropdown />
                  {status === "submitted" || status === "streaming" ? (
                    <StopButton stop={stop} />
                  ) : (
                    <SendButton
                      onSubmit={handleSubmitInternal}
                      disabled={isDisabled}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get placeholder text based on active tools
function getPlaceholder(activeTools: {
  webSearch: boolean;
  imageAnalysis: boolean;
  thinking: boolean;
  imageGeneration: boolean;
  fileUpload: boolean;
  codeExecution: boolean;
  audioGeneration: boolean;
  videoGeneration: boolean;
}) {
  const activeToolCount = Object.values(activeTools).filter(Boolean).length;

  if (activeToolCount === 0) {
    return "What can I do for you?";
  }

  const tools = [];
  if (activeTools.webSearch) tools.push("web search");
  if (activeTools.imageAnalysis) tools.push("image analysis");
  if (activeTools.thinking) tools.push("step-by-step thinking");
  if (activeTools.imageGeneration) tools.push("image generation");
  if (activeTools.fileUpload) tools.push("file upload");
  if (activeTools.codeExecution) tools.push("code execution");
  if (activeTools.audioGeneration) tools.push("audio generation");
  if (activeTools.videoGeneration) tools.push("video generation");

  return `Ask me anything using ${tools.join(", ")}...`;
}

const ChatInput = memo(PureChatInput, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.hasMessages !== nextProps.hasMessages) return false;
  if (prevProps.activeTools.webSearch !== nextProps.activeTools.webSearch)
    return false;
  if (
    prevProps.activeTools.imageAnalysis !== nextProps.activeTools.imageAnalysis
  )
    return false;
  if (prevProps.activeTools.thinking !== nextProps.activeTools.thinking)
    return false;
  if (
    prevProps.activeTools.imageGeneration !==
    nextProps.activeTools.imageGeneration
  )
    return false;
  if (prevProps.activeTools.fileUpload !== nextProps.activeTools.fileUpload)
    return false;
  if (
    prevProps.activeTools.codeExecution !== nextProps.activeTools.codeExecution
  )
    return false;
  if (
    prevProps.activeTools.audioGeneration !==
    nextProps.activeTools.audioGeneration
  )
    return false;
  if (
    prevProps.activeTools.videoGeneration !==
    nextProps.activeTools.videoGeneration
  )
    return false;
  return true;
});

// ChatModelDropdown component moved to its own file
import ChatModelDropdown from "./ChatModelDropdown";

function PureStopButton({ stop }: StopButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-md hover:bg-primary/10"
      onClick={stop}
      aria-label="Stop generating"
    >
      <StopIcon />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

const PureSendButton = ({ onSubmit, disabled }: SendButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-md hover:bg-primary/10"
      onClick={onSubmit}
      disabled={disabled}
      aria-label="Send message"
    >
      <ArrowUpIcon className="w-4 h-4" />
    </Button>
  );
};

const SendButton = memo(PureSendButton);

export default ChatInput;
