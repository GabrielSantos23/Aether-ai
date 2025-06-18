import { Provider } from "@/frontend/stores/APIKeyStore";

export const AI_MODELS = [
  "Claude Opus 4",
  "Claude Sonnet 4",
  "Claude Sonnet 3.5",
  "Claude Haiku 3.5",

  "Deepseek R1 0528",
  "Deepseek V3",
  "Deepseek V2.5",
  "Deepseek Coder V2",

  "Llama 4 Maverick",
  "Llama 3.3 70B",
  "Llama 3.2 90B Vision",
  "Llama 3.2 11B Vision",
  "Llama 3.2 3B",
  "Llama 3.2 1B",

  "Gemini 2.0 Flash Image Generation",
  "Gemini 2.0 Flash",
  "Gemini 2.5 Pro",
  "Gemini 2.5 Flash",

  "GPT-4o",
  "GPT-4.1-mini",
] as const;

export type AIModel = (typeof AI_MODELS)[number];

export type ModelConfig = {
  modelId: string;
  provider: Provider;
  headerKey: string;
  supportsImageGeneration?: boolean;
  supportsVision?: boolean;
  supportsThinking?: boolean;
  supportsWebSearch?: boolean;
  supportsFileUpload?: boolean;
};

export const MODEL_CONFIGS = {
  "Claude Opus 4": {
    modelId: "claude-opus-4-20250514",
    provider: "anthropic",
    headerKey: "X-Anthropic-API-Key",
    supportsVision: true,
    supportsFileUpload: true,
    supportsThinking: true,
  },
  "Claude Sonnet 4": {
    modelId: "claude-sonnet-4-20250514",
    provider: "anthropic",
    headerKey: "X-Anthropic-API-Key",
    supportsVision: true,
    supportsFileUpload: true,
    supportsThinking: true,
  },
  "Claude Sonnet 3.5": {
    modelId: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    headerKey: "X-Anthropic-API-Key",
    supportsVision: true,
    supportsFileUpload: true,
    supportsThinking: true,
  },
  "Claude Haiku 3.5": {
    modelId: "claude-3-5-haiku-20241022",
    provider: "anthropic",
    headerKey: "X-Anthropic-API-Key",
    supportsVision: true,
    supportsFileUpload: true,
    supportsThinking: true,
  },

  "Deepseek R1 0528": {
    modelId: "deepseek/deepseek-r1-0528:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    supportsThinking: true,
  },
  "Deepseek V3": {
    modelId: "deepseek/deepseek-chat-v3-0324:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
  },
  "Deepseek V2.5": {
    modelId: "deepseek/deepseek-chat",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
  },
  "Deepseek Coder V2": {
    modelId: "deepseek/deepseek-coder",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
  },

  "Llama 4 Maverick": {
    modelId: "meta-llama/llama-4-maverick:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
  },
  "Llama 3.3 70B": {
    modelId: "meta-llama/llama-3.3-70b-instruct",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
  },
  "Llama 3.2 90B Vision": {
    modelId: "meta-llama/llama-3.2-90b-vision-instruct",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    supportsVision: true,
  },
  "Llama 3.2 11B Vision": {
    modelId: "meta-llama/llama-3.2-11b-vision-instruct",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    supportsVision: true,
  },
  "Llama 3.2 3B": {
    modelId: "meta-llama/llama-3.2-3b-instruct",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
  },
  "Llama 3.2 1B": {
    modelId: "meta-llama/llama-3.2-1b-instruct",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
  },

  "Gemini 2.0 Flash": {
    modelId: "gemini-2.0-flash",
    provider: "google",
    headerKey: "X-Google-API-Key",
    supportsImageGeneration: true,
    supportsVision: true,
    supportsFileUpload: true,
    supportsThinking: true,
    supportsWebSearch: true,
  },
  "Gemini 2.5 Pro": {
    modelId: "gemini-2.5-pro-preview-05-06",
    provider: "google",
    headerKey: "X-Google-API-Key",
    supportsVision: true,
    supportsFileUpload: true,
    supportsThinking: true,
    supportsWebSearch: true,
  },
  "Gemini 2.5 Flash": {
    modelId: "gemini-2.5-flash-preview-04-17",
    provider: "google",
    headerKey: "X-Google-API-Key",
    supportsImageGeneration: true,
    supportsVision: true,
    supportsFileUpload: true,
    supportsThinking: true,
    supportsWebSearch: true,
  },
  "Gemini 2.0 Flash Image Generation": {
    modelId: "gemini-2.0-flash-preview-image-generation",
    provider: "google",
    headerKey: "X-Google-API-Key",
    supportsImageGeneration: true,
  },

  "GPT-4o": {
    modelId: "gpt-4o",
    provider: "openai",
    headerKey: "X-OpenAI-API-Key",
    supportsVision: true,
    supportsFileUpload: true,
  },
  "GPT-4.1-mini": {
    modelId: "gpt-4.1-mini",
    provider: "openai",
    headerKey: "X-OpenAI-API-Key",
    supportsVision: true,
    supportsFileUpload: true,
  },
} as const satisfies Record<AIModel, ModelConfig>;

export const getModelConfig = (modelName: AIModel): ModelConfig => {
  return MODEL_CONFIGS[modelName];
};
