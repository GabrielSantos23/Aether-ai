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
      },
    ],
    [
      "Deepseek V3",
      {
        modelId: "deepseek/deepseek-chat-v3-0324:free",
        provider: "openrouter" as Provider,
        headerKey: "X-OpenRouter-API-Key",
      },
    ],
    [
      "Gemini 2.5 Pro",
      {
        modelId: "gemini-2.5-pro-preview-05-06",
        provider: "google" as Provider,
        headerKey: "X-Google-API-Key",
      },
    ],
    [
      "Gemini 2.5 Flash",
      {
        modelId: "gemini-2.5-flash-preview-04-17",
        provider: "google" as Provider,
        headerKey: "X-Google-API-Key",
      },
    ],
    [
      "GPT-4o",
      {
        modelId: "gpt-4o",
        provider: "openai" as Provider,
        headerKey: "X-OpenAI-API-Key",
      },
    ],
    [
      "GPT-4.1-mini",
      {
        modelId: "gpt-4.1-mini",
        provider: "openai" as Provider,
        headerKey: "X-OpenAI-API-Key",
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
};

// Alternative 2: Factory function approach
const createModelRegistry = () => {
  const registry = {
    "Deepseek R1 0528": () => ({
      modelId: "deepseek/deepseek-r1-0528:free",
      provider: "openrouter" as Provider,
      headerKey: "X-OpenRouter-API-Key",
    }),
    "Deepseek V3": () => ({
      modelId: "deepseek/deepseek-chat-v3-0324:free",
      provider: "openrouter" as Provider,
      headerKey: "X-OpenRouter-API-Key",
    }),
    "Gemini 2.5 Pro": () => ({
      modelId: "gemini-2.5-pro-preview-05-06",
      provider: "google" as Provider,
      headerKey: "X-Google-API-Key",
    }),
    "Gemini 2.5 Flash": () => ({
      modelId: "gemini-2.5-flash-preview-04-17",
      provider: "google" as Provider,
      headerKey: "X-Google-API-Key",
    }),
    "GPT-4o": () => ({
      modelId: "gpt-4o",
      provider: "openai" as Provider,
      headerKey: "X-OpenAI-API-Key",
    }),
    "GPT-4.1-mini": () => ({
      modelId: "gpt-4.1-mini",
      provider: "openai" as Provider,
      headerKey: "X-OpenAI-API-Key",
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

// Alternative 3: Enum-like object with builder pattern
export const ModelBuilder = {
  openrouter: (modelId: string) => ({
    modelId,
    provider: "openrouter" as Provider,
    headerKey: "X-OpenRouter-API-Key",
  }),
  google: (modelId: string) => ({
    modelId,
    provider: "google" as Provider,
    headerKey: "X-Google-API-Key",
  }),
  openai: (modelId: string) => ({
    modelId,
    provider: "openai" as Provider,
    headerKey: "X-OpenAI-API-Key",
  }),
} as const;

export const MODELS_CATALOG = {
  "Deepseek R1 0528": ModelBuilder.openrouter("deepseek/deepseek-r1-0528:free"),
  "Deepseek V3": ModelBuilder.openrouter("deepseek/deepseek-chat-v3-0324:free"),
  "Gemini 2.5 Pro": ModelBuilder.google("gemini-2.5-pro-preview-05-06"),
  "Gemini 2.5 Flash": ModelBuilder.google("gemini-2.5-flash-preview-04-17"),
  "GPT-4o": ModelBuilder.openai("gpt-4o"),
  "GPT-4.1-mini": ModelBuilder.openai("gpt-4.1-mini"),
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
    },
  },
  {
    name: "Deepseek V3",
    config: {
      modelId: "deepseek/deepseek-chat-v3-0324:free",
      provider: "openrouter",
      headerKey: "X-OpenRouter-API-Key",
    },
  },
  {
    name: "Gemini 2.5 Pro",
    config: {
      modelId: "gemini-2.5-pro-preview-05-06",
      provider: "google",
      headerKey: "X-Google-API-Key",
    },
  },
  {
    name: "Gemini 2.5 Flash",
    config: {
      modelId: "gemini-2.5-flash-preview-04-17",
      provider: "google",
      headerKey: "X-Google-API-Key",
    },
  },
  {
    name: "GPT-4o",
    config: {
      modelId: "gpt-4o",
      provider: "openai",
      headerKey: "X-OpenAI-API-Key",
    },
  },
  {
    name: "GPT-4.1-mini",
    config: {
      modelId: "gpt-4.1-mini",
      provider: "openai",
      headerKey: "X-OpenAI-API-Key",
    },
  },
] as const;

export const findModelConfig = (modelName: string): ModelConfig | undefined => {
  return AI_MODEL_DEFINITIONS.find((def) => def.name === modelName)?.config;
};

export const getAllModelNames = (): string[] => {
  return AI_MODEL_DEFINITIONS.map((def) => def.name);
};
