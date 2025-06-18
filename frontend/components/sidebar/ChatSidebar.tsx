"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button, buttonVariants } from "../../../components/ui/button";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate, useParams } from "react-router";
import { X, Trash2, Loader2, LogIn, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentProps, memo, useEffect, useState, useCallback } from "react";
import { siteConfig } from "@/app/config/site.config";
import { useDataService } from "@/frontend/hooks/useDataService";
import {
  threadEvents,
  THREAD_CREATED,
  THREAD_DELETED,
  THREAD_UPDATED,
} from "@/frontend/lib/events";
import { AuroraText } from "@/components/ui/aurora-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSettingsModal } from "@/frontend/contexts/SettingsModalContext";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/frontend/dexie/db";

export default function ChatSidebar(props: ComponentProps<typeof Sidebar>) {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    dataService,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useDataService();
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      const threadsData = await dataService.getThreads();
      setThreads(threadsData);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dataService, isAuthenticated, isAuthLoading]);

  // Fetch threads when component mounts, auth state changes, or dataService changes
  useEffect(() => {
    if (!isAuthLoading) {
      fetchThreads();
    }
  }, [fetchThreads, isAuthLoading]);

  // Use live query to get branch information
  const branchInfo = useLiveQuery(async () => {
    const branches = await db.threadBranches.toArray();
    // Create a map of threadId -> true for quick lookup
    return branches.reduce((acc, branch) => {
      acc[branch.threadId] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, []);

  // Listen for thread events
  useEffect(() => {
    // Handler for thread created event
    const handleThreadCreated = (newThread: any) => {
      setThreads((prevThreads) => {
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
        setThreads([]);
        return;
      }

      // Only update if the deleted thread is in our current list
      setThreads((prevThreads) => {
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
      setThreads((prevThreads) => {
        const threadIndex = prevThreads.findIndex(
          (thread) => thread.id === data.id
        );
        if (threadIndex === -1) return prevThreads; // Thread not in our list

        // Create a new array with the updated thread
        const updatedThreads = [...prevThreads];
        updatedThreads[threadIndex] = {
          ...updatedThreads[threadIndex],
          ...(data.title && { title: data.title }),
          updatedAt: new Date(),
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

  // Function to manually refresh threads - only used when absolutely necessary
  // This is now mainly kept for backward compatibility with the Header component
  const refreshThreads = async () => {
    await fetchThreads();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "o"
      ) {
        e.preventDefault();
        navigate("/chat");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Sidebar variant={"inset"} {...props}>
        <div className="flex flex-col h-full p-2">
          <Header refreshThreads={refreshThreads} isLoading={isLoading} />
          <SidebarContent className="no-scrollbar">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <Loader2
                        className="animate-spin text-muted-foreground"
                        size={20}
                        style={{
                          animationDuration: "300ms",
                          animationTimingFunction: "linear",
                        }}
                      />
                    </div>
                  ) : (
                    threads?.map((thread) => {
                      return (
                        <SidebarMenuItem key={thread.id}>
                          <div
                            className={cn(
                              "cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-[8px] overflow-hidden w-full hover:bg-secondary",
                              id === thread.id && "bg-secondary"
                            )}
                            onClick={() => {
                              if (id === thread.id) {
                                return;
                              }
                              navigate(`/chat/${thread.id}`);
                            }}
                          >
                            <span className="truncate block flex items-center">
                              {(thread.isBranch ||
                                (branchInfo && branchInfo[thread.id])) && (
                                <GitBranch className="w-3 h-3 mr-1 text-muted-foreground" />
                              )}
                              {thread.title}
                              {thread.isShared && (
                                <span className="ml-1 text-xs text-blue-500 dark:text-blue-400 inline-flex items-center">
                                  (shared)
                                </span>
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hidden group-hover/thread:flex ml-auto h-7 w-7"
                              onClick={async (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                await dataService.deleteThread(thread.id);

                                // If we're on this thread, navigate away
                                if (id === thread.id) {
                                  navigate(`/chat`);
                                }
                                // No need to call refreshThreads() as we're using events now
                              }}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </SidebarMenuItem>
                      );
                    })
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <Footer />
        </div>
      </Sidebar>
    </>
  );
}

function PureHeader({
  refreshThreads,
  isLoading,
}: {
  refreshThreads: () => Promise<void>;
  isLoading: boolean;
}) {
  const { dataService } = useDataService();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleDeleteAllThreads = async () => {
    try {
      await dataService.deleteAllThreads();
      // No need to call refreshThreads() as we're using events now
      setOpen(false);
      navigate("/chat");
      toast.success("All chats deleted successfully");
    } catch (error) {
      console.error("Error deleting all threads:", error);
      toast.error("Failed to delete all chats");
    }
  };

  return (
    <SidebarHeader className="flex justify-between items-center gap-2 relative">
      <h1 className="text-2xl font-bold">
        <AuroraText>{siteConfig.name}</AuroraText>
      </h1>
      <div className="flex gap-2 w-full">
        <Link
          to="/chat"
          className={buttonVariants({
            variant: "default",
            className: "flex-1",
          })}
          // No need to call refreshThreads here as the thread will be created when a message is sent
          // and our event system will handle updating the sidebar
        >
          New Chat
        </Link>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="Delete all chats">
              <Trash2 size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete All Chats</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete all chats? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAllThreads}>
                Delete All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarHeader>
  );
}

const Header = memo(PureHeader);

const PureFooter = () => {
  const { id: chatId } = useParams();
  const { openModal } = useSettingsModal();
  const { user } = useUser();
  return (
    <SidebarFooter>
      {user ? (
        <div
          className="flex items-center gap-2 w-full hover:bg-accent/50 transition-colors duration-200 rounded-md p-2 cursor-pointer"
          onClick={openModal}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm flex-col flex text-muted-foreground">
            <span className="font-bold">{user?.name}</span>
            <span className="text-xs">{user?.email}</span>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 w-full justify-start">
          <Link
            to="/auth"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-full text-left",
            })}
          >
            <LogIn size={16} className="mr-2" />
            Login
          </Link>
        </div>
      )}
    </SidebarFooter>
  );
};

const Footer = memo(PureFooter);
