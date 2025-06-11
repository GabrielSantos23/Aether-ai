"use client";

import { useState } from "react";
import { useAPIKeyStore, Provider } from "@/frontend/stores/APIKeyStore";

export function APIKeySettings() {
  const [showKeys, setShowKeys] = useState<Record<Provider, boolean>>({
    openrouter: false,
    google: false,
    openai: false,
  });

  const { getKey, setKey, clearKey } = useAPIKeyStore();

  const toggleShowKey = (provider: Provider) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handleSaveKey = (provider: Provider, value: string) => {
    setKey(provider, value);
  };

  const handleClearKey = (provider: Provider) => {
    clearKey(provider);
  };

  const providerLabels: Record<Provider, string> = {
    openrouter: "OpenRouter",
    google: "Google Gemini",
    openai: "OpenAI",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">API Keys</h2>
      <p className="text-muted-foreground">
        Your API keys are stored locally in your browser and never sent to our
        servers.
      </p>

      {(Object.keys(providerLabels) as Provider[]).map((provider) => (
        <div key={provider} className="space-y-2">
          <label
            htmlFor={`${provider}-key`}
            className="block text-sm font-medium"
          >
            {providerLabels[provider]} API Key
          </label>
          <div className="flex gap-2">
            <input
              id={`${provider}-key`}
              type={showKeys[provider] ? "text" : "password"}
              value={getKey(provider)}
              onChange={(e) => handleSaveKey(provider, e.target.value)}
              placeholder={`Enter your ${providerLabels[provider]} API key`}
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => toggleShowKey(provider)}
              type="button"
              className="px-3 py-2 bg-secondary rounded hover:bg-secondary/90"
            >
              {showKeys[provider] ? "Hide" : "Show"}
            </button>
            <button
              onClick={() => handleClearKey(provider)}
              type="button"
              className="px-3 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Clear
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {getKey(provider)
              ? `${providerLabels[provider]} API key is set`
              : `No ${providerLabels[provider]} API key is set`}
          </p>
        </div>
      ))}
    </div>
  );
}
