"use client";

import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Home,
  BookOpen,
  Lightbulb,
  LogIn,
  Search,
  Plus,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUser } from "@/lib/hooks/useUser";
import { CommandDialogContext } from "@/components/sidebar/sidebar-buttons";

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const navigate = useNavigate();
  const { user } = useUser();

  // Sample recent chats
  const recentChats = [
    { id: "1", title: "How to use React hooks", date: "2 hours ago" },
    { id: "2", title: "NextJS routing help", date: "Yesterday" },
    { id: "3", title: "Tailwind CSS setup", date: "3 days ago" },
  ];

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

  const handleCreateNewChat = () => {
    if (searchValue.trim()) {
      // Navigate to a new chat with the search text as the first message
      navigate(`/chat/new?message=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateNewChat();
    }
  };

  return (
    <CommandDialogContext.Provider value={{ setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} className="">
        <CommandInput
          placeholder="Search or start a new chat..."
          value={searchValue}
          onValueChange={setSearchValue}
          onKeyDown={handleKeyDown}
        />

        <CommandList>
          <CommandGroup heading="Recent Chats">
            {recentChats.map((chat) => (
              <CommandItem
                key={chat.id}
                onSelect={() => runCommand(() => navigate(`/chat/${chat.id}`))}
              >
                <div className="flex justify-between items-center w-full text-sm">
                  <p>{chat.title}</p>
                  <p className="text-xs text-muted-foreground">{chat.date}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandEmpty className="mt-0 mb-4">
            <div className="flex flex-col items-end justify-end w-full mt-0">
              <p className="text-sm text-muted-foreground px-2 text-right">
                ↵ to start a new chat
              </p>
            </div>
          </CommandEmpty>

          <CommandSeparator />
        </CommandList>
      </CommandDialog>
    </CommandDialogContext.Provider>
  );
}
