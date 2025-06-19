import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageSquare,
  FileText,
  Info,
  Star,
  Search,
  Code,
  Globe,
  Upload,
  Music,
  Video,
  BrainCircuit,
  ChevronLeft,
} from "lucide-react";
import { memo, useCallback, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { useModelStore } from "@/frontend/stores/ModelStore";
import {
  AI_MODELS,
  AIModel,
  getModelConfig,
  getModelDescription,
} from "@/lib/models";

// Import icon components
import {
  GoogleIcon,
  OpenAIIcon,
  AnthropicIcon,
  OpenRouterIcon,
  MetaIcon,
  DefaultIcon,
  DeepSeekIcon,
} from "@/frontend/components/ProviderIcons";

const getProviderFromModel = (modelName: AIModel): string => {
  const modelConfig = getModelConfig(modelName);
  return modelConfig.provider;
};

const getModelFeatures = (modelName: AIModel): string[] => {
  const modelConfig = getModelConfig(modelName);
  const features: string[] = [];

  if (modelConfig.supportsVision) {
    features.push("vision");
  }

  if (modelConfig.supportsImageGeneration) {
    features.push("image");
  }

  if (modelConfig.supportsWebSearch) {
    features.push("search");
  }

  if (modelConfig.supportsFileUpload) {
    features.push("upload");
  }

  if (modelConfig.supportsThinking) {
    features.push("thinking");
  }

  return features;
};

const getFeatureIcon = (feature: string) => {
  const iconClass = "w-3.5 h-3.5 text-muted-foreground";
  switch (feature) {
    case "vision":
      return <Eye className={iconClass} />;
    case "image":
      return <Video className={iconClass} />;
    case "search":
      return <Globe className={iconClass} />;
    case "upload":
      return <Upload className={iconClass} />;
    case "thinking":
      return <BrainCircuit className={iconClass} />;
    default:
      return null;
  }
};

const getFavoriteModels = (): AIModel[] => {
  return [
    "Claude Opus 4",
    "Claude Sonnet 4",
    "GPT-4o",
    "GPT-4.1-mini",
    "Gemini 2.5 Pro",
    "Gemini 2.5 Flash",
    "Deepseek R1 0528",
  ];
};

const getOtherModels = (): AIModel[] => {
  return AI_MODELS.filter((model) => !getFavoriteModels().includes(model));
};

const getProviderIcon = (provider: string) => {
  const iconClass = "w-4 h-4";
  switch (provider) {
    case "google":
      return <GoogleIcon className={iconClass} />;
    case "openai":
      return <OpenAIIcon className={iconClass} />;
    case "anthropic":
      return <AnthropicIcon className={iconClass} />;
    case "openrouter":
      return <OpenRouterIcon className={iconClass} />;
    case "meta":
      return <MetaIcon className={iconClass} />;
    case "deepseek":
      return <DeepSeekIcon className={iconClass} />;
    default:
      return <DefaultIcon className={iconClass} />;
  }
};

interface ModelCardProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: (model: AIModel) => void;
}

const ModelCard = ({ model, isSelected, onSelect }: ModelCardProps) => {
  const getKey = useAPIKeyStore((state) => state.getKey);
  const modelConfig = getModelConfig(model);
  const provider = modelConfig.provider;
  const apiKey = getKey(provider);
  const isEnabled = !!apiKey;
  const features = getModelFeatures(model);
  const description = getModelDescription(model);
  const displayName = model;

  const cardClass = `flex items-center justify-between px-3 w-full group py-2 rounded-lg cursor-pointer transition-colors border ${
    !isEnabled
      ? "opacity-50 cursor-not-allowed bg-card"
      : isSelected
      ? "bg-purple-500/20 border border-purple-500/50"
      : "bg-card hover:bg-accent/50"
  }`;

  return (
    <div className={cardClass} onClick={() => isEnabled && onSelect(model)}>
      <div className="flex items-center gap-3">
        {getProviderIcon(provider)}
        <div className="text-left">
          <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-2">
            {displayName}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-background text-primary border mb-5"
                >
                  <p className="max-w-xs text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {features.map((feature) => (
          <div key={feature}>{getFeatureIcon(feature)}</div>
        ))}
      </div>
    </div>
  );
};

const PureChatModelDropdown = () => {
  const { selectedModel, setModel } = useModelStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [thinkingOnly, setThinkingOnly] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "provider">("none");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const getKey = useAPIKeyStore((state) => state.getKey);

  const handleModelSelect = (model: AIModel) => {
    setModel(model);
    setIsOpen(false);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const favoriteModels = getFavoriteModels();
  const otherModels = getOtherModels();
  const allModels = [...favoriteModels, ...otherModels];
  const modelConfig = getModelConfig(selectedModel);

  // Filter models based on search query and thinking toggle
  let filteredModels = searchQuery
    ? allModels.filter((model) =>
        model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allModels;

  // Filter by thinking capability if toggle is on
  if (thinkingOnly) {
    filteredModels = filteredModels.filter((model) => {
      const features = getModelFeatures(model);
      return features.includes("thinking");
    });
  }

  // Group models by provider if selected
  const groupedModels =
    groupBy === "provider"
      ? filteredModels.reduce((acc, model) => {
          const provider = getProviderFromModel(model);
          if (!acc[provider]) {
            acc[provider] = [];
          }
          acc[provider].push(model);
          return acc;
        }, {} as Record<string, AIModel[]>)
      : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg text-sm transition-colors"
      >
        {getProviderIcon(modelConfig.provider)}
        <span>{selectedModel.replace(" ", " ")}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center relative mb-3">
              <input
                type="text"
                placeholder="Search models..."
                className="w-full pl-6 rounded-lg bg-card placeholder-text-muted-foreground focus:outline-none transition focus:ring-0 focus:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              {/* Thinking toggle */}
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Thinking</span>
                <button
                  onClick={() => setThinkingOnly(!thinkingOnly)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    thinkingOnly ? "bg-purple-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      thinkingOnly ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Group by dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Group by</span>
                <select
                  value={groupBy}
                  onChange={(e) =>
                    setGroupBy(e.target.value as "none" | "provider")
                  }
                  className="text-sm bg-card border border-border rounded px-2 py-1 text-muted-foreground focus:outline-none focus:ring-0"
                >
                  <option value="none">None</option>
                  <option value="provider">Provider</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {groupBy === "provider" && groupedModels
                ? // Grouped view
                  Object.entries(groupedModels).map(([provider, models]) => (
                    <div key={provider} className="mb-4">
                      <div className="flex items-center gap-2 mb-2 px-2">
                        {getProviderIcon(provider)}
                        <h4 className="text-sm font-medium text-muted-foreground capitalize">
                          {provider}
                        </h4>
                      </div>
                      {models.map((model) => (
                        <ModelCard
                          key={model}
                          model={model}
                          isSelected={selectedModel === model}
                          onSelect={handleModelSelect}
                        />
                      ))}
                    </div>
                  ))
                : // Regular list view
                  filteredModels.map((model) => (
                    <ModelCard
                      key={model}
                      model={model}
                      isSelected={selectedModel === model}
                      onSelect={handleModelSelect}
                    />
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatModelDropdown = memo(PureChatModelDropdown);

export { ChatModelDropdown, PureChatModelDropdown };
export default ChatModelDropdown;
