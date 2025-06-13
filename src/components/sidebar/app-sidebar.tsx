"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site.config";
import {
  SearchIcon,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  PlusIcon,
  MessageSquareIcon,
  XIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { signIn, signOut } from "@/lib/auth-client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  parseISO,
} from "date-fns";
import { useChatStore, Chat } from "@/frontend/stores/ChatStore";

type GroupedChats = {
  [key: string]: Chat[];
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [loading, setLoading] = useState(false);
  const { user, isLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  // Get chats from the store
  const {
    chats,
    deleteChat,
    deleteAllChats,
    createChat,
    setActiveChat,
    getChildChats,
  } = useChatStore();

  const handleNewChat = () => {
    const chatId = createChat();
    navigate(`/chat/${chatId}`);
  };

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    // Stop propagation to prevent navigation
    e.preventDefault();
    e.stopPropagation();

    // Delete directly without confirmation
    try {
      deleteChat(chatId);

      // If we're currently viewing the deleted chat, navigate to home
      if (location.pathname.includes(`/chat/${chatId}`)) {
        navigate("/chat");
      }

      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = () => {
    deleteAllChats();
    navigate("/chat");
    toast.success("All chats deleted successfully");
    setDeleteAllDialogOpen(false);
  };

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;

    // Filter both parent and child chats based on search query
    const matchingChats = chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Also include parent chats of any matching child chats
    const matchingChildChats = matchingChats.filter((chat) => chat.parentId);
    const parentIds = matchingChildChats.map((chat) => chat.parentId);

    // Get unique parent IDs and find their chats
    const uniqueParentIds = [...new Set(parentIds)];
    const matchingParents = chats.filter((chat) =>
      uniqueParentIds.includes(chat.id)
    );

    // Combine all matching chats
    return [...matchingChats, ...matchingParents];
  }, [chats, searchQuery]);

  // Get only root chats (those without parents)
  const rootChats = useMemo(() => {
    return searchQuery
      ? filteredChats.filter((chat) => !chat.parentId)
      : filteredChats.filter((chat) => !chat.parentId);
  }, [filteredChats]);

  // Group chats by their activity date (using updatedAt)
  const groupedChats = useMemo(() => {
    const groups: GroupedChats = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      Older: [],
    };

    rootChats.forEach((chat) => {
      // Use updatedAt for the most recent activity
      const date = parseISO(chat.updatedAt);

      if (isToday(date)) {
        groups["Today"].push(chat);
      } else if (isYesterday(date)) {
        groups["Yesterday"].push(chat);
      } else if (isThisWeek(date)) {
        groups["This Week"].push(chat);
      } else if (isThisMonth(date)) {
        groups["This Month"].push(chat);
      } else {
        groups["Older"].push(chat);
      }
    });

    // Sort chats within each group by updatedAt, most recent first
    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });

    return groups;
  }, [rootChats]);

  // Check if a chat should show its children when searching
  const shouldShowChildren = (chat: Chat) => {
    if (!searchQuery) return true;

    // Get all children of this chat
    const children = chats.filter((c) => c.parentId === chat.id);

    // Check if any children match the search query
    return children.some((child) =>
      child.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Custom chat render function for search results
  const renderChatItem = (chat: Chat) => {
    const childChats = chats.filter((c) => c.parentId === chat.id);
    const visibleChildChats = searchQuery
      ? childChats.filter((c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : childChats;

    return (
      <div key={chat.id} className="group">
        <SidebarMenuItem className="relative group/item">
          <NavLink to={`/chat/${chat.id}`} className="w-full">
            <SidebarMenuButton
              className={`w-full justify-start pr-8 ${
                searchQuery &&
                chat.title.toLowerCase().includes(searchQuery.toLowerCase())
                  ? "bg-accent/30"
                  : ""
              }`}
            >
              <span className="truncate">{chat.title}</span>
            </SidebarMenuButton>
          </NavLink>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 hover:text-primary text-muted-foreground"
            onClick={(e) => handleDeleteClick(chat.id, e)}
            aria-label="Delete chat"
          >
            <XIcon className="w-4 h-4 " />
          </Button>
        </SidebarMenuItem>

        {/* Render child chats if any */}
        {visibleChildChats.length > 0 && (
          <div className="pl-4 ml-2 border-l border-secondary">
            {visibleChildChats.map((childChat) => (
              <SidebarMenuItem
                key={childChat.id}
                className="relative group/item"
              >
                <NavLink to={`/chat/${childChat.id}`} className="w-full">
                  <SidebarMenuButton
                    className={`w-full justify-start pr-8 text-sm ${
                      searchQuery &&
                      childChat.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                        ? "bg-accent/30"
                        : ""
                    }`}
                  >
                    <span className="truncate">{childChat.title}</span>
                  </SidebarMenuButton>
                </NavLink>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 hover:text-primary text-muted-foreground"
                  onClick={(e) => handleDeleteClick(childChat.id, e)}
                  aria-label="Delete chat"
                >
                  <XIcon className="w-3 h-3 " />
                </Button>
              </SidebarMenuItem>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Sidebar variant={"inset"} {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="  ">
                <div className="flex justify-between items-center ">
                  <a
                    href="#"
                    className="flex justify-between items-center gap-x-3 w-full"
                  >
                    <div className="grid flex-1 text-center w-full text-sm leading-tight">
                      <span className="truncate font-semibold text-lg">
                        {siteConfig.name}
                      </span>
                    </div>
                  </a>
                </div>
              </SidebarMenuButton>
              <div className="border-b w-full mt-2" />
            </SidebarMenuItem>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleNewChat}
                className="flex-1 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Chat</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDeleteAllClick}
                title="Delete all chats"
                disabled={filteredChats.length === 0}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </SidebarMenu>
          <div className="border-b w-full mt-2">
            <div className="relative flex items-center">
              <Input
                placeholder="Search your threads..."
                className="pl-10 bg-transparent dark:bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="px-2">
            {filteredChats.length > 0 ? (
              // Chat list grouped by date
              Object.entries(groupedChats).map(
                ([groupName, groupChats]: [string, Chat[]]) =>
                  groupChats.length > 0 ? (
                    <div key={groupName} className="mb-4">
                      <h3 className="text-xs font-medium text-muted-foreground mb-2 pl-2">
                        {groupName}
                      </h3>
                      {groupChats.map((chat: Chat) => renderChatItem(chat))}
                    </div>
                  ) : null
              )
            ) : searchQuery ? (
              // No search results
              <div className="text-center py-4 text-muted-foreground">
                No chats found
              </div>
            ) : user ? (
              // No chats yet
              <div className="text-center py-4 text-muted-foreground">
                No chats yet. Start a new conversation!
              </div>
            ) : null}
          </SidebarMenu>
          <SidebarMenu className="mt-auto">
            <SidebarMenuItem>
              <NavLink to="/settings" className="w-full">
                <SidebarMenuButton>
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </NavLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mb-4">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <Avatar className="w-8 h-8">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <AvatarFallback>
                      {user.name
                        ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  await signOut();
                  setLoading(false);
                }}
              >
                <LogOutIcon className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <NavLink to="/auth" className="flex justify-center w-full">
              <Button
                variant="outline"
                className="w-full"
                disabled={loading || isLoading}
              >
                <LogInIcon className="w-4 h-4 mr-2" />
                <span>Login</span>
              </Button>
            </NavLink>
          )}
        </SidebarFooter>
      </Sidebar>

      <AlertDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your chats and their messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAllDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
