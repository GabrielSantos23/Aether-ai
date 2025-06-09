import {
  ChevronDownIcon,
  CheckIcon,
  Paperclip,
  GlobeIcon,
  BrainIcon,
  ImageIcon,
  FileTextIcon,
  CodeIcon,
  XIcon,
  CornerDownLeftIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { useState, useRef, useEffect } from "react";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { AIModelManager } from "@/lib/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

export default function InputComponent() {
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "Gemini 2.5 Flash",
  ]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { hasKey } = useAPIKeyStore();

  const tools = [
    {
      id: "web-search",
      name: "Web Search",
      icon: <GlobeIcon className="w-4 h-4 mr-2" />,
    },
    {
      id: "thinking",
      name: "Thinking",
      icon: <BrainIcon className="w-4 h-4 mr-2" />,
    },
    {
      id: "image-generation",
      name: "Image Generation",
      icon: <ImageIcon className="w-4 h-4 mr-2" />,
    },
    {
      id: "document-analysis",
      name: "Document Analysis",
      icon: <FileTextIcon className="w-4 h-4 mr-2" />,
    },
    {
      id: "code-generation",
      name: "Code Generation",
      icon: <CodeIcon className="w-4 h-4 mr-2" />,
    },
  ];

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";

      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);

  const isModelDisabled = (model: string) => {
    const config = AIModelManager.getConfig(model);
    return config ? !hasKey(config.provider) : false;
  };

  const handleSelectModel = (model: string) => {
    const config = AIModelManager.getConfig(model);
    if (config && hasKey(config.provider)) {
      setSelectedModels((prev) => {
        if (prev.includes(model)) {
          return prev.filter((m) => m !== model);
        }

        if (prev.length < 2) {
          return [...prev, model];
        }

        return [prev[1], model];
      });
    }
  };

  const handleSelectTool = (toolId: string) => {
    if (selectedTool === toolId) {
      setSelectedTool(null);
    } else {
      setSelectedTool(toolId);
    }
  };

  const handleRemoveTool = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTool(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("Submit:", inputValue);
    }
  };

  const modelDisplayText =
    selectedModels.length === 0
      ? "Select AI model"
      : selectedModels.join(" + ");

  const anyModelDisabled = selectedModels.some((model) =>
    isModelDisabled(model)
  );

  const getToolName = (toolId: string | null) => {
    if (!toolId) return "";
    return tools.find((tool) => tool.id === toolId)?.name || toolId;
  };

  const getToolIcon = (toolId: string | null) => {
    if (!toolId) return null;
    return tools.find((tool) => tool.id === toolId)?.icon || null;
  };

  return (
    <div className="fixed bottom-0 max-w-4xl mx-auto w-full bg-card/70 rounded-t-lg border border-b-0 shadow-lg backdrop-blur-lg ">
      <div className="w-full  flex items-start justify-center pt-3  px-4">
        <div className="relative w-full">
          <textarea
            ref={textAreaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything or drag and drop a file"
            className="w-full resize-none bg-transparent border-none focus:ring-0 focus:outline-none min-h-[40px] max-h-[300px] text-lg pr-10"
            style={{
              overflow: inputValue.split("\n").length > 5 ? "auto" : "hidden",
            }}
            rows={1}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 p-1.5 rounded-full"
            disabled={!inputValue.trim()}
          >
            <CornerDownLeftIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="px-4 flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="rounded-full ">
                <Button
                  variant="outline"
                  className={anyModelDisabled ? "text-muted-foreground" : ""}
                >
                  <span>{modelDisplayText}</span>
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {AIModelManager.availableModels.map((model) => {
                  const isDisabled = isModelDisabled(model);
                  const isSelected = selectedModels.includes(model);

                  return (
                    <DropdownMenuItem
                      key={model}
                      disabled={isDisabled}
                      className={`
                        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                        ${isSelected ? "bg-accent" : ""}
                      `}
                      onClick={() => handleSelectModel(model)}
                    >
                      <span>{model}</span>
                      {isSelected && <CheckIcon className="ml-auto w-4 h-4" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="rounded-full">
              <Button variant="outline" className="flex items-center gap-1">
                {selectedTool ? (
                  <>
                    {getToolIcon(selectedTool)}
                    <span>{getToolName(selectedTool)}</span>
                  </>
                ) : (
                  <span>Tools</span>
                )}
                <ChevronDownIcon className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {tools.map((tool) => {
                const isSelected = selectedTool === tool.id;

                return (
                  <DropdownMenuItem
                    key={tool.id}
                    className={isSelected ? "bg-accent" : ""}
                    onClick={() => handleSelectTool(tool.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        {tool.icon}
                        <span>{tool.name}</span>
                      </div>
                      {isSelected && (
                        <>
                          <div className="flex items-center">
                            <CheckIcon className="w-4 h-4 mr-1" />
                            <button
                              className="hover:bg-muted rounded-full p-0.5"
                              onClick={handleRemoveTool}
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button variant="ghost" className="rounded-full">
          <Paperclip className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
