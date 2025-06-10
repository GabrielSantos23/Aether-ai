"use client";

import { useState } from "react";
import { useAPIKeyStore, Provider } from "@/frontend/stores/APIKeyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckIcon, EyeIcon, EyeOffIcon } from "lucide-react";

export default function Settings() {
  const apiKeyStore = useAPIKeyStore();
  const [openaiKey, setOpenaiKey] = useState(apiKeyStore.getKey("openai"));
  const [googleKey, setGoogleKey] = useState(apiKeyStore.getKey("google"));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    apiKeyStore.setKey("openai", openaiKey);
    apiKeyStore.setKey("google", googleKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const providerInfo = {
    openrouter: {
      name: "OpenRouter",
      description: "Access to Deepseek models",
      placeholder: "Enter your OpenRouter API key",
      link: "https://openrouter.ai/keys",
    },
    google: {
      name: "Google AI",
      description: "Access to Gemini models",
      placeholder: "Enter your Google AI API key",
      link: "https://aistudio.google.com/apikey",
    },
    openai: {
      name: "OpenAI",
      description: "Access to GPT models",
      placeholder: "Enter your OpenAI API key",
      link: "https://platform.openai.com/api-keys",
    },
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">API Keys</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="sk-..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                OpenAI
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google AI API Key
            </label>
            <input
              type="password"
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="AIza..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{" "}
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save API Keys
            </button>

            {saved && (
              <span className="ml-3 text-green-600">
                API keys saved successfully!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">API Key Status</h2>

        <div className="space-y-2">
          <div className="flex items-center">
            <span className="w-24">OpenAI:</span>
            {apiKeyStore.hasKey("openai") ? (
              <span className="text-green-600">✓ Key set</span>
            ) : (
              <span className="text-red-600">✗ No key</span>
            )}
          </div>

          <div className="flex items-center">
            <span className="w-24">Google:</span>
            {apiKeyStore.hasKey("google") ? (
              <span className="text-green-600">✓ Key set</span>
            ) : (
              <span className="text-red-600">✗ No key</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
