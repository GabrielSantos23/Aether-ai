"use client";

import * as React from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUser } from "@/lib/hooks/useUser";
import { CommandDialogContext } from "@/components/sidebar/sidebar-buttons";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { Provider } from "@/frontend/stores/APIKeyStore";
import { findModelConfig } from "@/lib/models";

type Chat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [provider, setProvider] = React.useState<Provider>("google");
  const [model, setModel] = React.useState<string>("");

  // Set up the chat for potential new message creation
  const { setInput, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      provider,
      model,
    },
    onResponse: (response) => {
      // Get chat ID from response headers for new chats
      const newChatId = response.headers.get("x-chat-id");
      if (newChatId) {
        // Navigate to the new chat
        navigate(`/chat/${newChatId}`, { replace: true });
        setOpen(false);
      }
    },
  });

  // Set default model on component mount
  React.useEffect(() => {
    const defaultModel = "Gemini 2.5 Flash";
    const modelConfig = findModelConfig(defaultModel);
    if (modelConfig) {
      setModel(modelConfig.modelId);
      setProvider(modelConfig.provider);
    }
  }, []);

  // Fetch chats when the command dialog is opened
  React.useEffect(() => {
    const fetchChats = async () => {
      if (!user || !open) return;

      try {
        setIsLoading(true);
        const response = await fetch("/api/chats");
        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }
        const data = await response.json();

        // Sort by updatedAt, most recent first
        const sortedChats = data.chats.sort(
          (a: Chat, b: Chat) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // Limit to 5 most recent chats
        setChats(sortedChats.slice(0, 5));
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user, open]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const handleCreateNewChat = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchValue.trim()) {
      // Create a new chat with the search text as the first message
      setInput(searchValue.trim());
      handleSubmit(e);
    } else {
      // Just navigate to new chat without initial message
      navigate("/chat");
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateNewChat(e as unknown as React.FormEvent);
    }
  };

  // Filter chats based on search query
  const filteredChats = searchValue
    ? chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchValue.toLowerCase())
      )
    : chats;

  return (
    <CommandDialogContext.Provider value={{ setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} className="">
        <form onSubmit={handleCreateNewChat}>
          <CommandInput
            placeholder="Search or start a new chat..."
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
          />

          <CommandList>
            <CommandGroup heading="Recent Chats">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading chats...
                  </span>
                </div>
              ) : filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <CommandItem
                    key={chat.id}
                    onSelect={() =>
                      runCommand(() => navigate(`/chat/${chat.id}`))
                    }
                  >
                    <div className="flex justify-between items-center w-full text-sm">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="truncate max-w-[70%]">{chat.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(chat.updatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </CommandItem>
                ))
              ) : searchValue ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No matching chats found
                </div>
              ) : user ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No recent chats
                </div>
              ) : null}
            </CommandGroup>
            <CommandEmpty className="mt-0 mb-4">
              <div className="flex flex-col items-end justify-end w-full mt-0">
                <p className="text-sm text-muted-foreground px-2 text-right">
                  ↵ to start a new chat
                </p>
              </div>
            </CommandEmpty>

            <CommandSeparator />

            {searchValue && (
              <div className="p-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 p-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <MessageSquare className="h-4 w-4" />
                  Start new chat with: "{searchValue}"
                </button>
              </div>
            )}
          </CommandList>
        </form>
      </CommandDialog>
    </CommandDialogContext.Provider>
  );
}
