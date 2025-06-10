"use client";

import { FormEvent, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAPIKeyStore, Provider } from "@/frontend/stores/APIKeyStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Search, ChevronDown, Paperclip } from "lucide-react";
import { getAllModelNames, findModelConfig } from "@/lib/models";
import { toast } from "sonner";

interface InputComponentProps {
  onSubmit: (e: FormEvent<HTMLFormElement>, options?: { body?: any }) => void;
  isLoading: boolean;
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  provider: Provider;
  setProvider: (provider: Provider) => void;
  model: string;
  setModel: (model: string) => void;
}

export default function InputComponent({
  onSubmit,
  isLoading,
  input,
  handleInputChange,
  provider,
  setProvider,
  model,
  setModel,
}: InputComponentProps) {
  const { id: chatId } = useParams();
  const apiKeyStore = useAPIKeyStore();
  const modelNames = getAllModelNames();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const defaultModel = "Gemini 2.5 Flash";
    if (!model && modelNames.includes(defaultModel)) {
      const modelConfig = findModelConfig(defaultModel);
      if (modelConfig) {
        setModel(modelConfig.modelId);
        setProvider(modelConfig.provider);
      }
    }
  }, [model, setModel, setProvider, modelNames]);

  // Auto-resize textarea effect
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Set new height based on scrollHeight (with min and max constraints)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 24), 200);
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  const handleModelChange = (selectedModelName: string) => {
    const modelConfig = findModelConfig(selectedModelName);
    if (modelConfig) {
      setModel(modelConfig.modelId);
      setProvider(modelConfig.provider);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    const apiKey = apiKeyStore.getKey(provider);

    if (!apiKey) {
      toast.error("Please set an API key for Google in settings");
      return;
    }
    onSubmit(e, {
      body: {
        chatId,
        provider,
        model,
        apiKey,
      },
    });

    // Reset textarea height after submission
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
  };

  const getCurrentModelName = () => {
    for (const modelName of modelNames) {
      const config = findModelConfig(modelName);
      if (config && config.modelId === model && config.provider === provider) {
        return modelName;
      }
    }
    return "";
  };

  const currentModelName = getCurrentModelName();

  return (
    <div className="w-full flex justify-center items-end p-4 ">
      <div className="w-full max-w-4xl fixed bottom-2">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative bg-card rounded-t-2xl border border-border border-b-0 focus-within:border-border transition-colors">
            {/* Input Area */}
            <div className="flex items-start p-4">
              <textarea
                ref={textareaRef}
                placeholder="Type your message here..."
                className="flex-1 bg-transparent dark:bg-transparent border-none resize-none focus:ring-0 focus:outline-none min-h-[24px] max-h-[200px] p-0 overflow-y-auto"
                value={input}
                onChange={handleTextareaChange}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form && input.trim())
                      form.dispatchEvent(
                        new Event("submit", { cancelable: true, bubbles: true })
                      );
                  }
                }}
              />
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between px-4 pb-3 pt-0">
              <div className="flex items-center gap-3">
                {/* Model Selector */}
                <div className="relative">
                  <select
                    className="bg-transparent text-zinc-300 text-sm border-none focus:ring-0 focus:outline-none appearance-none pr-6 cursor-pointer hover:text-zinc-100 transition-colors"
                    value={currentModelName}
                    onChange={(e) => handleModelChange(e.target.value)}
                  >
                    <option value="" disabled className="bg-zinc-800">
                      Select a model
                    </option>
                    {modelNames.map((modelName) => (
                      <option
                        key={modelName}
                        value={modelName}
                        className="bg-zinc-800"
                      >
                        {modelName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                </div>

                {/* Search Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
                >
                  <Search className="h-4 w-4" />
                </Button>

                {/* Attachment Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={
                  isLoading || !input.trim() || !apiKeyStore.hasKey(provider)
                }
                className="h-8 w-8 p-0 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-600 disabled:text-zinc-400 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {!apiKeyStore.hasKey(provider) && (
            <div className="text-xs text-red-400 mt-2 px-1">
              No API key set for {provider}. Please add it in settings.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
