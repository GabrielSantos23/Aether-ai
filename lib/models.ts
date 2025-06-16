import { Provider } from "@/frontend/stores/APIKeyStore";

export const AI_MODELS = [
  "Deepseek R1 0528",
  "Deepseek V3",
  "Gemini 2.0 Flash Image Generation",
  "Gemini 2.0 Flash",
  "Gemini 2.5 Pro",
  "Gemini 2.5 Flash",
  "GPT-4o",
  "GPT-4.1-mini",
  "Llama 4 Maverick",
] as const;

export type AIModel = (typeof AI_MODELS)[number];

export type ModelConfig = {
  modelId: string;
  provider: Provider;
  headerKey: string;
  supportsTools: boolean;
  supportsImageGeneration?: boolean;
};

export const MODEL_CONFIGS = {
  "Deepseek R1 0528": {
    modelId: "deepseek/deepseek-r1-0528:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    supportsTools: false,
  },
  "Deepseek V3": {
    modelId: "deepseek/deepseek-chat-v3-0324:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    supportsTools: false,
  },
  "Gemini 2.0 Flash": {
    modelId: "gemini-2.0-flash",
    provider: "google",
    headerKey: "X-Google-API-Key",
    supportsTools: true,
    supportsImageGeneration: true,
  },
  "Gemini 2.5 Pro": {
    modelId: "gemini-2.5-pro-preview-05-06",
    provider: "google",
    headerKey: "X-Google-API-Key",
    supportsTools: true,
    supportsImageGeneration: true,
  },
  "Gemini 2.5 Flash": {
    modelId: "gemini-2.5-flash-preview-04-17",
    provider: "google",
    headerKey: "X-Google-API-Key",
    supportsTools: true,
    supportsImageGeneration: true,
  },
  "Gemini 2.0 Flash Image Generation": {
    modelId: "gemini-2.0-flash-preview-image-generation",
    provider: "google",
    headerKey: "X-Google-API-Key",
    supportsTools: true,
    supportsImageGeneration: true,
  },
  "GPT-4o": {
    modelId: "gpt-4o",
    provider: "openai",
    headerKey: "X-OpenAI-API-Key",
    supportsTools: true,
  },
  "GPT-4.1-mini": {
    modelId: "gpt-4.1-mini",
    provider: "openai",
    headerKey: "X-OpenAI-API-Key",
    supportsTools: true,
  },
  "Llama 4 Maverick": {
    modelId: "meta-llama/llama-4-maverick:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    supportsTools: true,
  },
} as const satisfies Record<AIModel, ModelConfig>;

export const getModelConfig = (modelName: AIModel): ModelConfig => {
  return MODEL_CONFIGS[modelName];
};
