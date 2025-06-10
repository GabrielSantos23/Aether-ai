import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";

/**
 * Makes a fetch request to the API with API keys from the store added to headers
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The fetch response
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  // Get API keys from the store
  const apiKeys = useAPIKeyStore.getState().keys;

  // Create headers with API keys
  const headers = new Headers(options.headers);

  // Add API keys to headers if they exist
  if (apiKeys.openrouter) {
    headers.set("X-OpenRouter-API-Key", apiKeys.openrouter);
  }
  if (apiKeys.google) {
    headers.set("X-Google-API-Key", apiKeys.google);
  }
  if (apiKeys.openai) {
    headers.set("X-OpenAI-API-Key", apiKeys.openai);
  }

  // Make the request with the updated headers
  return fetch(url, {
    ...options,
    headers,
  });
}
