"use client";

import { useState, useEffect } from "react";
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
  const { keys, setKey, hasKey } = useAPIKeyStore();

  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({
    openrouter: "",
    google: "",
    openai: "",
  });

  const [showKeys, setShowKeys] = useState<Record<Provider, boolean>>({
    openrouter: false,
    google: false,
    openai: false,
  });

  const [saveStatus, setSaveStatus] = useState<
    Record<Provider, "idle" | "success" | "error">
  >({
    openrouter: "idle",
    google: "idle",
    openai: "idle",
  });

  // Load existing keys on component mount
  useEffect(() => {
    setApiKeys({
      openrouter: keys.openrouter || "",
      google: keys.google || "",
      openai: keys.openai || "",
    });
  }, [keys]);

  const handleInputChange = (provider: Provider, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));

    // Reset save status when input changes
    setSaveStatus((prev) => ({
      ...prev,
      [provider]: "idle",
    }));
  };

  const toggleShowKey = (provider: Provider) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const saveKey = (provider: Provider) => {
    try {
      setKey(provider, apiKeys[provider]);
      setSaveStatus((prev) => ({
        ...prev,
        [provider]: "success",
      }));

      // Reset success status after 2 seconds
      setTimeout(() => {
        setSaveStatus((prev) => ({
          ...prev,
          [provider]: "idle",
        }));
      }, 2000);
    } catch (error) {
      setSaveStatus((prev) => ({
        ...prev,
        [provider]: "error",
      }));
    }
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
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">API Keys</h2>

        {Object.entries(providerInfo).map(([provider, info]) => (
          <Card key={provider} className="mb-4">
            <CardHeader>
              <CardTitle>{info.name}</CardTitle>
              <CardDescription>{info.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    type={showKeys[provider as Provider] ? "text" : "password"}
                    value={apiKeys[provider as Provider]}
                    onChange={(e) =>
                      handleInputChange(provider as Provider, e.target.value)
                    }
                    placeholder={info.placeholder}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(provider as Provider)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys[provider as Provider] ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={() => saveKey(provider as Provider)}
                  disabled={
                    !apiKeys[provider as Provider] ||
                    apiKeys[provider as Provider] === keys[provider as Provider]
                  }
                  className="min-w-20"
                >
                  {saveStatus[provider as Provider] === "success" ? (
                    <CheckIcon className="h-4 w-4 mr-2" />
                  ) : null}
                  {saveStatus[provider as Provider] === "success"
                    ? "Saved"
                    : "Save"}
                </Button>
              </div>
              {hasKey(provider as Provider) && (
                <p className="text-sm text-green-600 mt-2">API key is set</p>
              )}
            </CardContent>
            <CardFooter>
              <a
                href={info.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Get your {info.name} API key
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
