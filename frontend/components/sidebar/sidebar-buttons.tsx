import {
  Check,
  Copy,
  Globe,
  Lock,
  LockOpen,
  Plus,
  Search,
  SettingsIcon,
  Share2,
  UserPlus,
  PanelLeftIcon,
  MessageSquareMore,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  SidebarTrigger as OriginalSidebarTrigger,
  useSidebar,
  useSidebarWithSide,
} from "../../../components/ui/sidebar";
import ThemeToggler from "@/components/theme/toggler";
import { motion, AnimatePresence, LayoutGroup, easeInOut } from "framer-motion";
import React, { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
// import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";
import { useChatNavigator } from "@/frontend/hooks/useChatNavigator";
import ChatNavigator from "../ChatNavigator";
// import { useChatStore } from "@/stores/ChatStore";

export const CommandDialogContext = React.createContext<{
  setOpen: (open: boolean) => void;
}>({
  setOpen: () => {},
});

export const useCommandDialog = () => {
  return React.useContext(CommandDialogContext);
};

// Custom SidebarTrigger with smaller icon
function SmallSidebarTrigger({
  side,
  className,
  ...props
}: {
  side?: "left" | "right";
  className?: string;
  [key: string]: any;
}) {
  const contextSide = side || "left";
  const { toggleSidebar } = useSidebarWithSide(contextSide);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`!size-5 ${className || ""}`}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeftIcon
        className={
          contextSide === "right" ? "rotate-180 !w-5 !h-5" : "!w-5 !h-5"
        }
      />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export function SidebarButtons() {
  const { open, isMobile, openMobile } = useSidebar();
  const { setOpen: setCommandOpen } = useCommandDialog();
  const isSidebarClosed = isMobile ? !openMobile : !open;

  const containerVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: {
      width: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easeInOut,
        staggerChildren: 0.1,
      },
    },
    exit: {
      width: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: easeInOut,
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      x: -10,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div
      className={`fixed top-[1.40rem] left-5 z-50 flex items-center h-9 ${
        isSidebarClosed ? "bg-card rounded-md border" : ""
      }`}
    >
      <SmallSidebarTrigger className=" ml-2 " />
      <AnimatePresence>
        {isSidebarClosed && (
          <motion.div
            className="flex gap-1 overflow-hidden ml-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={itemVariants}>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCommandOpen(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarButtonsRight({ threadId }: { threadId: string }) {
  const { open, isMobile, openMobile } = useSidebar();
  const rightSidebar = useSidebarWithSide("right");
  const isSidebarClosed = isMobile ? !openMobile : !open;
  const isRightSidebarOpen = rightSidebar.open;
  const [isPublic, setIsPublic] = useState(false);
  const [chatUrl, setChatUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { id: chatId } = useParams<{ id: string }>();
  // const { data: session } = useAuth();
  // const userId = session?.user?.id;
  // const { getChat, updateChatVisibility } = useChatStore();
  // const currentChat = chatId ? getChat(chatId) : null;
  const { handleToggleNavigator, isNavigatorVisible } = useChatNavigator();

  // Function to scroll to a specific message
  const scrollToMessage = (messageId: string) => {
    console.log("Attempting to scroll to message:", messageId);
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      console.log(
        "Found message element, scrolling into view:",
        messageElement
      );
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // Highlight the message to make it obvious which one was selected
      const originalBorder = messageElement.style.border;
      const originalBoxShadow = messageElement.style.boxShadow;

      messageElement.style.border = "2px solid var(--primary)";
      messageElement.style.boxShadow = "0 0 8px var(--primary)";

      setTimeout(() => {
        messageElement.style.border = originalBorder;
        messageElement.style.boxShadow = originalBoxShadow;
      }, 2000);
    } else {
      console.warn("Message element not found for ID:", `message-${messageId}`);
      // Try to find the element by just the messageId as a fallback
      const fallbackElement = document.getElementById(messageId);
      if (fallbackElement) {
        console.log(
          "Found fallback element, scrolling into view:",
          fallbackElement
        );
        fallbackElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        const originalBorder = fallbackElement.style.border;
        const originalBoxShadow = fallbackElement.style.boxShadow;

        fallbackElement.style.border = "2px solid var(--primary)";
        fallbackElement.style.boxShadow = "0 0 8px var(--primary)";

        setTimeout(() => {
          fallbackElement.style.border = originalBorder;
          fallbackElement.style.boxShadow = originalBoxShadow;
        }, 2000);
      } else {
        console.error("No message element found with either ID format");
      }
    }
  };

  // Function to close the navigator
  const closeNavigator = () => {
    if (handleToggleNavigator && isNavigatorVisible) {
      handleToggleNavigator();
    }
  };

  useEffect(() => {
    setIsPublic(false);
    setIsCreator(false);
    setChatUrl("");

    if (!chatId) return;

    const fetchChatStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chats/${chatId}/public-status`);
        if (response.ok) {
          const data = await response.json();
          setIsPublic(data.isPublic);
          setIsCreator(data.isCreator);

          if (data.isPublic) {
            const baseUrl = window.location.origin;
            setChatUrl(`${baseUrl}/chat/${chatId}`);
          }
        }
      } catch (error) {
        console.error("Error fetching chat status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatStatus();
  }, [chatId]);

  const handleTogglePublic = async () => {
    if (!chatId || !isCreator) return;

    try {
      setIsLoading(true);
      const newPublicState = !isPublic;

      const response = await fetch(`/api/chats/${chatId}/toggle-public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: newPublicState }),
      });

      if (response.ok) {
        // Update local state
        setIsPublic(newPublicState);

        // Update chat store
        // updateChatVisibility(chatId, newPublicState);

        if (newPublicState) {
          const baseUrl = window.location.origin;
          setChatUrl(`${baseUrl}/chat/${chatId}`);
          toast.success("Chat is now public and can be shared");
        } else {
          setChatUrl("");
          toast.success("Chat is now private");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update chat visibility");
      }
    } catch (error) {
      console.error("Error toggling chat visibility:", error);
      toast.error("Failed to update chat visibility");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(chatUrl)
      .then(() => {
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        try {
          const textArea = document.createElement("textarea");
          textArea.value = chatUrl;
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setCopied(true);
          toast.success("Link copied to clipboard");
          setTimeout(() => setCopied(false), 2000);
        } catch (execErr) {
          console.error("Fallback copy failed: ", execErr);
          toast.error("Failed to copy link");
        }
      });
  };

  const buttonVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.2,
        ease: easeInOut,
      },
    },
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className="fixed top-[1.40rem] right-5 z-20">
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!isRightSidebarOpen ? (
            <motion.div
              key="normal-buttons"
              className="relative flex items-center justify-end"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layoutId="right-sidebar-buttons"
            >
              <motion.div
                className={`flex items-center relative z-10 gap-2 w-full h-full px-2 bg-card rounded-md border`}
                layoutId="button-container"
              >
                <motion.div layoutId="theme-toggler">
                  <ThemeToggler />
                </motion.div>
                <motion.div layoutId="settings-icon">
                  <NavLink to="/settings">
                    <SettingsIcon className="w-5 h-5" />
                  </NavLink>
                </motion.div>
                <motion.div layoutId="message-navigator">
                  <Button
                    onClick={() => {
                      rightSidebar.toggleSidebar();
                      handleToggleNavigator();
                    }}
                    variant="ghost"
                    size="icon"
                    aria-label={
                      isNavigatorVisible
                        ? "Hide message navigator"
                        : "Show message navigator"
                    }
                    title="Message Navigator"
                  >
                    <MessageSquareMore className="h-5 w-5" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <></>
          )}
        </AnimatePresence>
        <div className="absolute top-0 right-32 bg-card rounded-md border">
          <Popover>
            <PopoverTrigger>
              <Button variant="ghost" className="bg-card" disabled={isLoading}>
                {isPublic ? (
                  <LockOpen className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                <span className="sr-only">Share Chat</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 bg-card">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Share Chat</h4>
                  <p className="text-sm text-muted-foreground">
                    {isPublic
                      ? "Anyone with the link can view this chat."
                      : "This chat is private."}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor="link" className="sr-only">
                      Link
                    </Label>
                    <Input
                      id="link"
                      value={chatUrl}
                      readOnly
                      className="h-9 bg-card border"
                      disabled={!isPublic}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="px-3 bg-background border hover:bg-background"
                    onClick={handleCopy}
                    disabled={!isPublic}
                  >
                    <span className="sr-only">Copy</span>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                </div>

                <div className="grid gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isPublic ? (
                        <Globe className="h-4 w-4 text-green-400" />
                      ) : (
                        <Lock className="h-4 w-4 text-yellow-400" />
                      )}
                      <Label htmlFor="public-access">
                        {isPublic ? "Public Access" : "Private Access"}
                      </Label>
                    </div>
                    <Switch
                      id="public-access"
                      checked={isPublic}
                      onCheckedChange={handleTogglePublic}
                      className={isPublic ? "bg-green-600" : "bg-gray-600"}
                      disabled={!isCreator || isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {!isCreator
                      ? "Only the creator can change chat visibility."
                      : isPublic
                      ? "This chat is visible to anyone with the link."
                      : "Only invited members can access this chat."}
                  </p>
                </div>

                {!isCreator && (
                  <div className="pt-2">
                    <p className="text-sm text-amber-500">
                      You are viewing a shared chat. You cannot modify its
                      visibility.
                    </p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </LayoutGroup>

      <ChatNavigator
        threadId={threadId}
        scrollToMessage={scrollToMessage}
        isVisible={isNavigatorVisible}
        onClose={closeNavigator}
      />
    </div>
  );
}
