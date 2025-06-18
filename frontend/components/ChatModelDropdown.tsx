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
} from "lucide-react";
import { memo, useCallback, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { useModelStore } from "@/frontend/stores/ModelStore";
import { AI_MODELS, AIModel, getModelConfig } from "@/lib/models";

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

const getFavoriteModels = (): AIModel[] => {
  return [
    "Claude Opus 4",
    "Claude Sonnet 4",
    "GPT-4o",
    "GPT-4.1-mini",
    "Gemini 2.5 Pro",
    "Gemini 2.5 Flash",
    "Llama 4 Maverick",
  ];
};

const getOtherModels = (): AIModel[] => {
  return AI_MODELS.filter((model) => !getFavoriteModels().includes(model));
};

const getProviderIcon = (provider: string) => {
  const iconClass = "w-6 h-6";
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
  isListView?: boolean;
}

const ModelCard = ({
  model,
  isSelected,
  onSelect,
  isListView = false,
}: ModelCardProps) => {
  const getKey = useAPIKeyStore((state) => state.getKey);
  const modelConfig = getModelConfig(model);
  const provider = modelConfig.provider;
  const apiKey = getKey(provider);
  const isEnabled = !!apiKey;
  const features = getModelFeatures(model);

  const displayName = model.includes(" ") ? model.replace(" ", "\n") : model;

  const cardClass = isListView
    ? `flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors border ${
        !isEnabled
          ? "opacity-50 cursor-not-allowed bg-card"
          : isSelected
          ? "bg-pink-500/20 border border-pink-500/50"
          : "bg-card hover:bg-accent/50"
      }`
    : `relative p-3 rounded-xl cursor-pointer transition-all ${
        !isEnabled
          ? "opacity-50 cursor-not-allowed bg-card"
          : isSelected
          ? "bg-pink-500/20 border-2 border-pink-500/50"
          : "bg-card hover:bg-accent/50 border border-border"
      }`;

  return (
    <div className={cardClass} onClick={() => isEnabled && onSelect(model)}>
      <div
        className={
          isListView
            ? "flex items-center gap-3"
            : "flex flex-col items-center gap-2"
        }
      >
        {getProviderIcon(provider)}
        <div className={`text-center ${isListView ? "text-left" : ""}`}>
          <div className="text-sm font-medium whitespace-pre-line">
            {displayName}
          </div>
        </div>
      </div>

      <div className={`flex gap-1 ${isListView ? "ml-auto" : "mt-2"}`}>
        {features.includes("vision") && (
          <Eye className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("chat") && (
          <MessageSquare className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("docs") && (
          <FileText className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("code") && (
          <Code className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("search") && (
          <Globe className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("upload") && (
          <Upload className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("thinking") && (
          <BrainCircuit className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("audio") && (
          <Music className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("video") && (
          <Video className="w-4 h-4 text-gray-400" />
        )}
        {features.includes("image") && (
          <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
        )}
      </div>
    </div>
  );
};

const PureChatModelDropdown = () => {
  const { selectedModel, setModel } = useModelStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const getKey = useAPIKeyStore((state) => state.getKey);

  const handleModelSelect = (model: AIModel) => {
    setModel(model);
    setIsOpen(false);
    setShowAll(false);
    setSearchQuery("");
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Close dropdown when clicking outside
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
  const modelConfig = getModelConfig(selectedModel);

  // Filter models based on search query
  const filteredFavoriteModels = searchQuery
    ? favoriteModels.filter((model) =>
        model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : favoriteModels;

  const filteredOtherModels = searchQuery
    ? otherModels.filter((model) =>
        model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : otherModels;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg  text-sm transition-colors"
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
        <div
          className={`absolute bottom-full left-0 mb-2 ${
            showAll ? "w-[40rem]" : "w-96"
          } bg-card border  rounded-xl shadow-xl z-50 overflow-hidden`}
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center relative">
              <input
                type="text"
                placeholder="Search models..."
                className="w-full py-2 pl-6  rounded-lg bg-card placeholder-text-muted-foreground focus:outline-none transition focus:ring-0 focus:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div className="p-4">
            {!showAll ? (
              <div className="space-y-1">
                {filteredFavoriteModels.map((model) => (
                  <ModelCard
                    key={model}
                    model={model}
                    isSelected={selectedModel === model}
                    onSelect={handleModelSelect}
                    isListView={true}
                  />
                ))}
                {searchQuery &&
                  filteredOtherModels.map((model) => (
                    <ModelCard
                      key={model}
                      model={model}
                      isSelected={selectedModel === model}
                      onSelect={handleModelSelect}
                      isListView={true}
                    />
                  ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-pink-400" />
                    <h4 className="text-pink-400 text-sm font-medium">
                      Favorites
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {filteredFavoriteModels.map((model) => (
                      <ModelCard
                        key={model}
                        model={model}
                        isSelected={selectedModel === model}
                        onSelect={handleModelSelect}
                      />
                    ))}
                  </div>
                </div>

                {(!searchQuery || filteredOtherModels.length > 0) && (
                  <div>
                    <h4 className="text-muted-foreground text-sm font-medium mb-3">
                      Others
                    </h4>
                    <div className="grid grid-cols-5 gap-3">
                      {filteredOtherModels.map((model) => (
                        <ModelCard
                          key={model}
                          model={model}
                          isSelected={selectedModel === model}
                          onSelect={handleModelSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 pt-3 border-t ">
              <Button
                variant="ghost"
                onClick={toggleShowAll}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Favorites</span>
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Show all</span>
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </>
                )}
              </Button>
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
