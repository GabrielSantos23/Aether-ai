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
import { useUser } from "@/hooks/useUser";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  MessageSquare,
  GitBranch,
  Search,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Provider } from "@/frontend/stores/APIKeyStore";
import { CommandDialogContext } from "./sidebar/sidebar-buttons";
import { findModelConfig } from "@/lib/models";
import { v4 as uuidv4 } from "uuid";
import { useDataService } from "@/frontend/hooks/useDataService";
import { UIMessage } from "ai";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/frontend/dexie/db";
import {
  threadEvents,
  THREAD_CREATED,
  THREAD_DELETED,
  THREAD_UPDATED,
} from "@/frontend/lib/events";

type Chat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isBranch?: boolean;
};

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { dataService } = useDataService();

  // Use live query to get branch information
  const branchInfo = useLiveQuery(async () => {
    const branches = await db.threadBranches.toArray();
    // Create a map of threadId -> true for quick lookup
    return branches.reduce((acc, branch) => {
      acc[branch.threadId] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, []);

  // Function to fetch threads
  const fetchChats = React.useCallback(async () => {
    if (!open) return;

    try {
      setIsLoading(true);
      const threads = await dataService.getThreads();
      console.log("Fetched threads:", threads);
      setChats(threads);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dataService, open]);

  // Fetch chats when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchChats();
    }
  }, [open, fetchChats]);

  // Listen for thread events
  React.useEffect(() => {
    // Handler for thread created event
    const handleThreadCreated = (newThread: any) => {
      setChats((prevThreads) => {
        // Check if thread already exists
        const exists = prevThreads.some((thread) => thread.id === newThread.id);
        if (exists) return prevThreads;

        // Add new thread at the beginning of the list
        return [newThread, ...prevThreads];
      });
    };

    // Handler for thread deleted event
    const handleThreadDeleted = (threadId: string) => {
      // If 'all' was passed, clear all threads
      if (threadId === "all") {
        setChats([]);
        return;
      }

      // Only update if the deleted thread is in our current list
      setChats((prevThreads) => {
        const threadExists = prevThreads.some(
          (thread) => thread.id === threadId
        );
        if (!threadExists) return prevThreads; // Don't update state if thread isn't in our list

        // Remove the specific thread from the list
        return prevThreads.filter((thread) => thread.id !== threadId);
      });
    };

    // Handler for thread updated event
    const handleThreadUpdated = (data: { id: string; title?: string }) => {
      // Only update if the thread is in our current list
      setChats((prevThreads) => {
        const threadIndex = prevThreads.findIndex(
          (thread) => thread.id === data.id
        );
        if (threadIndex === -1) return prevThreads; // Thread not in our list

        // Create a new array with the updated thread
        const updatedThreads = [...prevThreads];
        updatedThreads[threadIndex] = {
          ...updatedThreads[threadIndex],
          ...(data.title && { title: data.title }),
          updatedAt: new Date().toISOString(),
        };

        return updatedThreads;
      });
    };

    // Register event listeners
    threadEvents.on(THREAD_CREATED, handleThreadCreated);
    threadEvents.on(THREAD_DELETED, handleThreadDeleted);
    threadEvents.on(THREAD_UPDATED, handleThreadUpdated);

    // Clean up event listeners when component unmounts
    return () => {
      threadEvents.off(THREAD_CREATED, handleThreadCreated);
      threadEvents.off(THREAD_DELETED, handleThreadDeleted);
      threadEvents.off(THREAD_UPDATED, handleThreadUpdated);
    };
  }, []);

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

  // Reset selected index when search value changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [searchValue]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Generate a new UUID for the thread
      const newThreadId = uuidv4();

      // Create a title based on search value or default
      const title = searchValue.trim() ? searchValue.trim() : "New Chat";

      // Create the thread using dataService
      await dataService.createThread(newThreadId, title);
      console.log("Created new thread with ID:", newThreadId);

      // If there's a search value, create the first message
      if (searchValue.trim()) {
        // Create a user message
        const messageId = uuidv4();
        const userMessage: UIMessage = {
          id: messageId,
          role: "user",
          content: searchValue.trim(),
          createdAt: new Date(),
          parts: [{ type: "text", text: searchValue.trim() }],
        };

        // Save the message
        await dataService.createMessage(newThreadId, userMessage);
        console.log("Created initial message for thread:", newThreadId);
      }

      // Navigate to the new thread
      navigate(`/chat/${newThreadId}`);

      // Close the command dialog
      setOpen(false);

      // Clear the search value
      setSearchValue("");
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const filteredChats = getFilteredChats();
    const totalItems = filteredChats.length + (searchValue.trim() ? 1 : 0); // +1 for "Create new chat" option

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prevIndex) =>
        prevIndex < totalItems - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();

      // If "Create new chat" is selected (last item when search value exists)
      if (searchValue.trim() && selectedIndex === filteredChats.length) {
        handleCreateNewChat(e as unknown as React.FormEvent);
      } else if (
        filteredChats.length > 0 &&
        selectedIndex >= 0 &&
        selectedIndex < filteredChats.length
      ) {
        // Navigate to selected chat
        const selectedChat = filteredChats[selectedIndex];
        runCommand(() => navigate(`/chat/${selectedChat.id}`));
      } else if (searchValue.trim()) {
        // Create new chat with search text
        handleCreateNewChat(e as unknown as React.FormEvent);
      }
    }
  };

  // Filter chats based on search query
  const getFilteredChats = () => {
    return searchValue
      ? chats.filter((chat) =>
          chat.title.toLowerCase().includes(searchValue.toLowerCase())
        )
      : chats.slice(0, 8); // Limit to 8 recent chats for better UX
  };

  const filteredChats = getFilteredChats();

  return (
    <CommandDialogContext.Provider value={{ setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} className="max-w-2xl">
        <div className="flex flex-col">
          {/* Enhanced Search Input */}
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
            <CommandInput
              placeholder="Search or press Enter to start new chat..."
              value={searchValue}
              onValueChange={setSearchValue}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm placeholder:text-muted-foreground"
            />
            {searchValue && (
              <div className="flex items-center text-xs text-muted-foreground ml-2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ↵
                </kbd>
              </div>
            )}
          </div>

          <CommandList className="max-h-[400px] overflow-y-auto">
            {/* Create New Chat Option */}
            {searchValue.trim() && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleCreateNewChat({} as React.FormEvent)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    selectedIndex === filteredChats.length
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 mr-3">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          Start new chat
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                          "{searchValue}"
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CommandItem>
              </CommandGroup>
            )}

            {/* Recent Chats Section */}
            {(filteredChats.length > 0 || !searchValue) && (
              <CommandGroup
                heading={
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {searchValue ? "Matching Chats" : "Recent Chats"}
                  </div>
                }
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Loading chats...
                    </span>
                  </div>
                ) : filteredChats.length > 0 ? (
                  filteredChats.map((chat, index) => (
                    <CommandItem
                      key={chat.id}
                      onSelect={() =>
                        runCommand(() => navigate(`/chat/${chat.id}`))
                      }
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted mr-3 shrink-0">
                            {chat.isBranch ||
                            (branchInfo && branchInfo[chat.id]) ? (
                              <GitBranch className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium truncate">
                              {chat.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(chat.updatedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                      </div>
                    </CommandItem>
                  ))
                ) : searchValue ? (
                  <div className="px-4 py-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No matching chats found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Press Enter to start a new chat
                    </p>
                  </div>
                ) : user ? (
                  <div className="px-4 py-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No recent chats
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start typing to create your first chat
                    </p>
                  </div>
                ) : null}
              </CommandGroup>
            )}

            {/* Keyboard Shortcuts */}
            <div className="border-t px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                      ↑↓
                    </kbd>
                    <span className="ml-1">navigate</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                      ↵
                    </kbd>
                    <span className="ml-1">select</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                      esc
                    </kbd>
                    <span className="ml-1">close</span>
                  </div>
                </div>
              </div>
            </div>
          </CommandList>
        </div>
      </CommandDialog>
    </CommandDialogContext.Provider>
  );
}
