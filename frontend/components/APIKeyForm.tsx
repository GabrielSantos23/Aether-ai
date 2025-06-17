import React, { useCallback, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError, useForm, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAPIKeyStore } from "@/frontend/stores/APIKeyStore";
import { Badge } from "../../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formSchema = z.object({
  google: z.string().trim().min(1, {
    message: "Google API key is required for Title Generation",
  }),
  openrouter: z.string().trim().optional(),
  openai: z.string().trim().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ModelInfo = {
  name: string;
  url: string;
};

const modelUrls: Record<string, Record<string, string>> = {
  google: {
    "Gemini 2.5 Flash": "https://ai.google.dev/models/gemini",
    "Gemini 2.5 Pro": "https://ai.google.dev/models/gemini",
  },
  openrouter: {
    "DeepSeek R1 0538":
      "https://openrouter.ai/models/deepseek/deepseek-r1-0538",
    "DeepSeek-V3": "https://openrouter.ai/models/deepseek/deepseek-v3",
  },
  openai: {
    "GPT-4o": "https://platform.openai.com/docs/models/gpt-4o",
    "GPT-4.1-mini": "https://platform.openai.com/docs/models/gpt-4-1-mini",
  },
};

export default function APIKeyForm({ inModal = false }: { inModal?: boolean }) {
  if (inModal) {
    return <Form />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Key className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          Add Your API Keys To Start Chatting
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Keys are stored locally in your browser.
      </p>
      <Form />
    </div>
  );
}

const Form = () => {
  const { keys, setKeys } = useAPIKeyStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: keys,
  });

  useEffect(() => {
    reset(keys);
  }, [keys, reset]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      setKeys(values);
      toast.success("API keys saved successfully");
    },
    [setKeys]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ApiKeyField
        id="google"
        label="Google API Key"
        models={[
          {
            name: "Gemini 2.5 Flash",
            url: modelUrls.google["Gemini 2.5 Flash"],
          },
          { name: "Gemini 2.5 Pro", url: modelUrls.google["Gemini 2.5 Pro"] },
        ]}
        linkUrl="https://aistudio.google.com/apikey"
        placeholder="AIza..."
        register={register}
        error={errors.google}
        required
      />

      <ApiKeyField
        id="openrouter"
        label="OpenRouter API Key"
        models={[
          {
            name: "DeepSeek R1 0538",
            url: modelUrls.openrouter["DeepSeek R1 0538"],
          },
          { name: "DeepSeek-V3", url: modelUrls.openrouter["DeepSeek-V3"] },
        ]}
        linkUrl="https://openrouter.ai/settings/keys"
        placeholder="sk-or-..."
        register={register}
        error={errors.openrouter}
      />

      <ApiKeyField
        id="openai"
        label="OpenAI API Key"
        models={[
          { name: "GPT-4o", url: modelUrls.openai["GPT-4o"] },
          { name: "GPT-4.1-mini", url: modelUrls.openai["GPT-4.1-mini"] },
        ]}
        linkUrl="https://platform.openai.com/settings/organization/api-keys"
        placeholder="sk-..."
        register={register}
        error={errors.openai}
      />

      <Button type="submit" className="w-full" disabled={!isDirty}>
        Save API Keys
      </Button>
    </form>
  );
};

interface ApiKeyFieldProps {
  id: string;
  label: string;
  linkUrl: string;
  models: ModelInfo[];
  placeholder: string;
  error?: FieldError | undefined;
  required?: boolean;
  register: UseFormRegister<FormValues>;
}

const ApiKeyField = ({
  id,
  label,
  linkUrl,
  placeholder,
  models,
  error,
  required,
  register,
}: ApiKeyFieldProps) => (
  <div className="flex flex-col gap-2">
    <label
      htmlFor={id}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex gap-1"
    >
      <span>{label}</span>
      {required && <span className="text-muted-foreground"> (Required)</span>}
    </label>
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {models.map((model) => (
          <Tooltip key={model.name}>
            <TooltipTrigger asChild>
              <a
                href={model.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  {model.name}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Badge>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>View {model.name} documentation</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>

    <div className="relative">
      <Input
        id={id}
        placeholder={placeholder}
        {...register(id as keyof FormValues)}
        className={`${error ? "border-red-500" : ""} font-mono text-sm pr-20`}
        type="password"
      />
      <a
        href={linkUrl}
        target="_blank"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-600 whitespace-nowrap"
      >
        Get Key
      </a>
    </div>

    {error && (
      <p className="text-[0.8rem] font-medium text-red-500">{error.message}</p>
    )}
  </div>
);
