import { Provider } from "@/frontend/stores/APIKeyStore";

// Alternative 1: Class-based approach
export class AIModelManager {
  private static readonly models = new Map<string, ModelConfig>([
    [
      "Deepseek R1 0528",
      {
        modelId: "deepseek/deepseek-r1-0528:free",
        provider: "openrouter" as Provider,
        headerKey: "X-OpenRouter-API-Key",
        supportsWebSearch: false,
        supportsThinking: true,
        viewImage: false,
      },
    ],
    [
      "Deepseek V3",
      {
        modelId: "deepseek/deepseek-chat-v3-0324:free",
        provider: "openrouter" as Provider,
        headerKey: "X-OpenRouter-API-Key",
        supportsWebSearch: false,
        supportsThinking: false,
        viewImage: false,
      },
    ],
    [
      "Llama 4 Maverick",
      {
        modelId: "meta-llama/llama-4-maverick:free",
        provider: "openrouter" as Provider,
        headerKey: "X-OpenRouter-API-Key",
        supportsWebSearch: false,
        supportsThinking: false,
        viewImage: true,
      },
    ],
    [
      "Gemini 2.5 Pro",
      {
        modelId: "gemini-2.5-pro-preview-05-06",
        provider: "google" as Provider,
        headerKey: "X-Google-API-Key",
        supportsWebSearch: true,
        supportsThinking: true,
        viewImage: true,
      },
    ],
    [
      "Gemini 2.5 Flash",
      {
        modelId: "gemini-2.5-flash-preview-04-17",
        provider: "google" as Provider,
        headerKey: "X-Google-API-Key",
        supportsWebSearch: true,
        supportsThinking: true,
        viewImage: true,
      },
    ],
    [
      "GPT-4o",
      {
        modelId: "gpt-4o",
        provider: "openai" as Provider,
        headerKey: "X-OpenAI-API-Key",
        supportsWebSearch: true,
        supportsThinking: false,
        viewImage: true,
      },
    ],
    [
      "GPT-4o-mini",
      {
        modelId: "gpt-4o-mini",
        provider: "openai" as Provider,
        headerKey: "X-OpenAI-API-Key",
        supportsWebSearch: true,
        supportsThinking: false,
        viewImage: true,
      },
    ],
    [
      "GPT-4.1-mini",
      {
        modelId: "gpt-4.1-mini",
        provider: "openai" as Provider,
        headerKey: "X-OpenAI-API-Key",
        supportsWebSearch: true,
        supportsThinking: false,
        viewImage: true,
      },
    ],
  ]);

  static get availableModels(): string[] {
    return Array.from(this.models.keys());
  }

  static getConfig(modelName: string): ModelConfig | undefined {
    return this.models.get(modelName);
  }

  static hasModel(modelName: string): boolean {
    return this.models.has(modelName);
  }
}

export type AIModel = string;
export type ModelConfig = {
  modelId: string;
  provider: Provider;
  headerKey: string;
  supportsWebSearch?: boolean;
  supportsThinking?: boolean;
  viewImage?: boolean;
};

// Alternative 2: Factory function approach
const createModelRegistry = () => {
  const registry = {
    "Deepseek R1 0528": () => ({
      modelId: "deepseek/deepseek-r1-0528:free",
      provider: "openrouter" as Provider,
      headerKey: "X-OpenRouter-API-Key",
      supportsWebSearch: false,
      supportsThinking: true,
      viewImage: false,
    }),
    "Deepseek V3": () => ({
      modelId: "deepseek/deepseek-chat-v3-0324:free",
      provider: "openrouter" as Provider,
      headerKey: "X-OpenRouter-API-Key",
      supportsWebSearch: false,
      supportsThinking: false,
      viewImage: false,
    }),
    "Llama 4 Maverick": () => ({
      modelId: "meta-llama/llama-4-maverick:free",
      provider: "openrouter" as Provider,
      headerKey: "X-OpenRouter-API-Key",
      supportsWebSearch: false,
      supportsThinking: false,
      viewImage: true,
    }),
    "Gemini 2.5 Pro": () => ({
      modelId: "gemini-2.5-pro-preview-05-06",
      provider: "google" as Provider,
      headerKey: "X-Google-API-Key",
      supportsWebSearch: true,
      supportsThinking: true,
      viewImage: true,
    }),
    "Gemini 2.5 Flash": () => ({
      modelId: "gemini-2.5-flash-preview-04-17",
      provider: "google" as Provider,
      headerKey: "X-Google-API-Key",
      supportsWebSearch: true,
      supportsThinking: true,
      viewImage: true,
    }),
    "GPT-4o": () => ({
      modelId: "gpt-4o",
      provider: "openai" as Provider,
      headerKey: "X-OpenAI-API-Key",
      supportsWebSearch: true,
      supportsThinking: false,
      viewImage: true,
    }),
    "GPT-4o-mini": () => ({
      modelId: "gpt-4o-mini",
      provider: "openai" as Provider,
      headerKey: "X-OpenAI-API-Key",
      supportsWebSearch: true,
      supportsThinking: false,
      viewImage: true,
    }),
    "GPT-4.1-mini": () => ({
      modelId: "gpt-4.1-mini",
      provider: "openai" as Provider,
      headerKey: "X-OpenAI-API-Key",
      supportsWebSearch: true,
      supportsThinking: false,
      viewImage: true,
    }),
  };

  return {
    models: Object.keys(registry),
    getConfig: (name: keyof typeof registry) => registry[name]?.(),
    isValidModel: (name: string): name is keyof typeof registry =>
      name in registry,
  };
};

export const ModelRegistry = createModelRegistry();

export const ModelBuilder = {
  openrouter: (
    modelId: string,
    supportsWebSearch: boolean = false,
    supportsThinking: boolean = false,
    viewImage: boolean = false
  ) => ({
    modelId,
    provider: "openrouter" as Provider,
    headerKey: "X-OpenRouter-API-Key",
    supportsWebSearch,
    supportsThinking,
    viewImage,
  }),
  google: (
    modelId: string,
    supportsWebSearch: boolean = false,
    supportsThinking: boolean = false,
    viewImage: boolean = false
  ) => ({
    modelId,
    provider: "google" as Provider,
    headerKey: "X-Google-API-Key",
    supportsWebSearch,
    supportsThinking,
    viewImage,
  }),
  openai: (
    modelId: string,
    supportsWebSearch: boolean = false,
    supportsThinking: boolean = false,
    viewImage: boolean = false
  ) => ({
    modelId,
    provider: "openai" as Provider,
    headerKey: "X-OpenAI-API-Key",
    supportsWebSearch,
    supportsThinking,
    viewImage,
  }),
} as const;

export const MODELS_CATALOG = {
  "Deepseek R1 0528": ModelBuilder.openrouter(
    "deepseek/deepseek-r1-0528:free",
    false,
    true,
    false
  ),
  "Deepseek V3": ModelBuilder.openrouter(
    "deepseek/deepseek-chat-v3-0324:free",
    false,
    false,
    false
  ),
  "Llama 4 Maverick": ModelBuilder.openrouter(
    "meta-llama/llama-4-maverick:free",
    true,
    false,
    false
  ),
  "Gemini 2.5 Pro": ModelBuilder.google(
    "gemini-2.5-pro-preview-05-06",
    true,
    true,
    false
  ),
  "Gemini 2.5 Flash": ModelBuilder.google(
    "gemini-2.5-flash-preview-04-17",
    true,
    true,
    false
  ),
  "GPT-4o": ModelBuilder.openai("gpt-4o", true, false, false),
  "GPT-4o-mini": ModelBuilder.openai("gpt-4o-mini", true, false, false),
  "GPT-4.1-mini": ModelBuilder.openai("gpt-4.1-mini", true, false, false),
} as const;

export const getModelFromCatalog = (name: keyof typeof MODELS_CATALOG) =>
  MODELS_CATALOG[name];

// Alternative 4: Using arrays and find operations
interface ModelDefinition {
  name: string;
  config: ModelConfig;
}

export const AI_MODEL_DEFINITIONS: readonly ModelDefinition[] = [
  {
    name: "Deepseek R1 0528",
    config: {
      modelId: "deepseek/deepseek-r1-0528:free",
      provider: "openrouter",
      headerKey: "X-OpenRouter-API-Key",
      supportsWebSearch: false,
      supportsThinking: true,
      viewImage: false,
    },
  },
  {
    name: "Deepseek V3",
    config: {
      modelId: "deepseek/deepseek-chat-v3-0324:free",
      provider: "openrouter",
      headerKey: "X-OpenRouter-API-Key",
      supportsWebSearch: false,
      supportsThinking: false,
      viewImage: false,
    },
  },
  {
    name: "Llama 4 Maverick",
    config: {
      modelId: "meta-llama/llama-4-maverick:free",
      provider: "openrouter",
      headerKey: "X-OpenRouter-API-Key",
      supportsWebSearch: false,
      supportsThinking: false,
      viewImage: true,
    },
  },
  {
    name: "Gemini 2.5 Pro",
    config: {
      modelId: "gemini-2.5-pro-preview-05-06",
      provider: "google",
      headerKey: "X-Google-API-Key",
      supportsWebSearch: true,
      supportsThinking: true,
      viewImage: true,
    },
  },
  {
    name: "Gemini 2.5 Flash",
    config: {
      modelId: "gemini-2.5-flash-preview-04-17",
      provider: "google",
      headerKey: "X-Google-API-Key",
      supportsWebSearch: true,
      supportsThinking: true,
      viewImage: true,
    },
  },
  {
    name: "GPT-4o",
    config: {
      modelId: "gpt-4o",
      provider: "openai",
      headerKey: "X-OpenAI-API-Key",
      supportsWebSearch: true,
      supportsThinking: false,
      viewImage: true,
    },
  },
  {
    name: "GPT-4o-mini",
    config: {
      modelId: "gpt-4o-mini",
      provider: "openai",
      headerKey: "X-OpenAI-API-Key",
      supportsWebSearch: true,
      supportsThinking: false,
      viewImage: true,
    },
  },
  {
    name: "GPT-4.1-mini",
    config: {
      modelId: "gpt-4.1-mini",
      provider: "openai",
      headerKey: "X-OpenAI-API-Key",
      supportsWebSearch: true,
      supportsThinking: false,
      viewImage: true,
    },
  },
] as const;

const modelConfigMap = new Map<string, ModelConfig>(
  AI_MODEL_DEFINITIONS.map((def) => [def.name, def.config])
);

export const findModelConfig = (modelName: string): ModelConfig | undefined => {
  return modelConfigMap.get(modelName);
};

export const getAllModelNames = (): string[] => {
  return AI_MODEL_DEFINITIONS.map((def) => def.name);
};

export const getWebSearchCompatibleModels = (): string[] => {
  return AI_MODEL_DEFINITIONS.filter((def) => def.config.supportsWebSearch).map(
    (def) => def.name
  );
};

export const getThinkingCompatibleModels = (): string[] => {
  return AI_MODEL_DEFINITIONS.filter((def) => def.config.supportsThinking).map(
    (def) => def.name
  );
};
