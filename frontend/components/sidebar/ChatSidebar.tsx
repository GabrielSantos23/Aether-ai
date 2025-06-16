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
import { X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentProps, memo, useEffect, useState } from "react";
import { siteConfig } from "@/app/config/site.config";
import { useDataService } from "@/frontend/hooks/useDataService";
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

  // Fetch threads when component mounts, auth state changes, or dataService changes
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching threads, auth state:", {
          isAuthenticated,
          isAuthLoading,
        });
        const threadsData = await dataService.getThreads();
        console.log("Fetched threads:", threadsData);
        setThreads(threadsData);
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchThreads();
    }
  }, [dataService, isAuthenticated, isAuthLoading]);

  // Function to manually refresh threads
  const refreshThreads = async () => {
    try {
      setIsLoading(true);
      const threadsData = await dataService.getThreads();
      setThreads(threadsData);
    } catch (error) {
      console.error("Error refreshing threads:", error);
    } finally {
      setIsLoading(false);
    }
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
    <Sidebar variant={"inset"} {...props}>
      <div className="flex flex-col h-full p-2">
        <Header refreshThreads={refreshThreads} isLoading={isLoading} />
        <SidebarContent className="no-scrollbar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {threads?.map((thread) => {
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
                        <span className="truncate block">{thread.title}</span>
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
                            } else {
                              // Otherwise just refresh the thread list
                              refreshThreads();
                            }
                          }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <Footer />
      </div>
    </Sidebar>
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
      await refreshThreads();
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
          onClick={() => refreshThreads()}
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

  return (
    <SidebarFooter>
      <Link
        to={{
          pathname: "/settings",
          search: chatId ? `?from=${encodeURIComponent(chatId)}` : "",
        }}
        className={buttonVariants({ variant: "outline" })}
      >
        Settings
      </Link>
    </SidebarFooter>
  );
};

const Footer = memo(PureFooter);
