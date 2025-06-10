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
import { useUser } from "@/lib/hooks/useUser";
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

type Chat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

type GroupedChats = {
  [key: string]: Chat[];
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [loading, setLoading] = useState(false);
  const { user, isLoading } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Function to fetch chats - moved to its own function for reuse
  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingChats(true);
      const response = await fetch("/api/chats");
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      const data = await response.json();
      setChats(data.chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user]);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Refetch chats when location changes (e.g., when a new chat is created)
  useEffect(() => {
    // If we're in a chat route and we have a user, fetch the chats
    if (location.pathname.includes("/chat") && user) {
      fetchChats();
    }
  }, [location.pathname, user, fetchChats]);

  const handleNewChat = () => {
    navigate("/chat");
  };

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    // Stop propagation to prevent navigation
    e.preventDefault();
    e.stopPropagation();

    // Set the chat to delete and open the dialog
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) return;

    try {
      const response = await fetch(`/api/chat/${chatToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      // Update chats list by removing the deleted chat
      setChats(chats.filter((chat) => chat.id !== chatToDelete));

      // If we're currently viewing the deleted chat, navigate to home
      if (location.pathname.includes(`/chat/${chatToDelete}`)) {
        navigate("/chat");
      }

      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  // Filter chats based on search query
  const filteredChats = searchQuery
    ? chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  // Group chats by their activity date (using updatedAt)
  const groupedChats = useMemo(() => {
    const groups: GroupedChats = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      Older: [],
    };

    filteredChats.forEach((chat) => {
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
  }, [filteredChats]);

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
            <Button
              onClick={handleNewChat}
              className="w-full flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Chat</span>
            </Button>
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
            {isLoadingChats ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 py-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : filteredChats.length > 0 ? (
              // Chat list grouped by date
              Object.entries(groupedChats).map(([groupName, groupChats]) =>
                groupChats.length > 0 ? (
                  <div key={groupName} className="mb-4">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 pl-2">
                      {groupName}
                    </h3>
                    {groupChats.map((chat) => (
                      <SidebarMenuItem
                        key={chat.id}
                        className="relative group/item"
                      >
                        <NavLink to={`/chat/${chat.id}`} className="w-full">
                          <SidebarMenuButton className="w-full justify-start pr-8">
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
                    ))}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat and all its messages. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
