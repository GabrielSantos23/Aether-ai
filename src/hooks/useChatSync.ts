import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useChatStore, Chat, Message } from "@/frontend/stores/ChatStore";
import { toast } from "sonner";

/**
 * Hook to synchronize chats between Zustand store and database
 * - On login: Load chats from DB
 * - On change: Sync changes to DB if logged in
 */
export function useChatSync() {
  const { data: session } = useAuth();
  const userId = session?.user?.id;
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    chats,
    createChat,
    updateChatTitle,
    addMessage,
    deleteChat,
    deleteAllChats,
  } = useChatStore();

  // Store original methods only once to avoid infinite update loop
  const originalCreateChat = useRef(useChatStore.getState().createChat);
  const originalDeleteChat = useRef(useChatStore.getState().deleteChat);
  const originalDeleteAllChats = useRef(useChatStore.getState().deleteAllChats);

  // Override store methods to include DB sync
  useEffect(() => {
    if (!userId || isInitialized) return;

    // Load chats from DB on login
    const loadChatsFromDB = async () => {
      try {
        setIsSyncing(true);
        // Fetch chats from API
        const res = await fetch("/api/chats", { method: "GET" });
        if (!res.ok) throw new Error("Failed to fetch chats from API");
        const data = await res.json();
        const dbChats = data.chats || [];
        // Convert DB format to Zustand format
        const zustandChats: Chat[] = dbChats.map((dbChat: any) => ({
          id: dbChat.id,
          title: dbChat.title,
          createdAt: new Date(dbChat.createdAt).toISOString(),
          updatedAt: new Date(dbChat.updatedAt).toISOString(),
          parentId: dbChat.parentId,
          messages: dbChat.messages.map((dbMsg: any) => ({
            id: dbMsg.id,
            content:
              typeof dbMsg.content === "object"
                ? JSON.stringify(dbMsg.content)
                : dbMsg.content?.toString() ?? "",
            role: dbMsg.role,
            createdAt: new Date(dbMsg.createdAt).toISOString(),
          })),
        }));
        // Merge with local chats (prioritize DB chats with same ID)
        const localChats = useChatStore.getState().chats;
        const mergedChats = mergeChats(zustandChats, localChats);
        // Update Zustand store with merged chats
        useChatStore.setState({ chats: mergedChats });
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to load chats from DB:", error);
        toast.error("Failed to load your chats from the database");
      } finally {
        setIsSyncing(false);
      }
    };
    loadChatsFromDB();
  }, [userId, isInitialized]);

  // Sync chats to DB when they change (if user is logged in)
  useEffect(() => {
    if (!userId || !isInitialized || isSyncing) return;
    // Only sync if we have chats and we're initialized
    const syncChatsToDb = async () => {
      try {
        for (const chat of chats) {
          // Load model map from localStorage for this chat
          let messageToModelMap: Record<string, string> = {};
          try {
            const modelMapStr = localStorage.getItem(`chat_models_${chat.id}`);
            if (modelMapStr) messageToModelMap = JSON.parse(modelMapStr);
          } catch {}
          // Convert Zustand format to DB format
          const dbChat = {
            id: chat.id,
            title: chat.title,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            parentId: chat.parentId,
            messages: chat.messages.map((msg) => ({
              id: msg.id,
              chatId: chat.id,
              userId: msg.role === "user" ? userId : "assistant",
              role: msg.role as "user" | "assistant",
              content: tryParseJSON(msg.content) || msg.content,
              webSearch: false, // Default values
              thinking: false,
              createdAt: new Date(msg.createdAt),
              updatedAt: new Date(msg.createdAt),
              model: messageToModelMap[msg.id],
            })),
          };
          // Upsert chat via API (use POST for new, PUT for update)
          await fetch("/api/chats", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: chat.id, updates: dbChat }),
          });
        }
      } catch (error) {
        console.error("Failed to sync chats to DB:", error);
        // Don't show toast for every sync attempt to avoid spamming
      }
    };
    // Debounce the sync to avoid too many DB calls
    const timeoutId = setTimeout(syncChatsToDb, 1000);
    return () => clearTimeout(timeoutId);
  }, [chats, userId, isInitialized, isSyncing]);

  // Override the createChat method to include DB sync
  useEffect(() => {
    if (!userId || !isInitialized) return;
    useChatStore.setState({
      createChat: (parentId?: string) => {
        const chatId = originalCreateChat.current(parentId);
        if (userId) {
          const chat = useChatStore
            .getState()
            .chats.find((c) => c.id === chatId);
          if (chat) {
            fetch("/api/chats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: chat.id,
                title: chat.title,
                parentId: chat.parentId,
              }),
            }).catch((error) => {
              console.error("Failed to sync new chat to DB:", error);
            });
          }
        }
        return chatId;
      },
    });
    return () => {
      useChatStore.setState({ createChat: originalCreateChat.current });
    };
  }, [userId, isInitialized]);

  // Override the deleteChat method to include DB sync
  useEffect(() => {
    if (!userId || !isInitialized) return;
    useChatStore.setState({
      deleteChat: (chatId: string) => {
        originalDeleteChat.current(chatId);
        if (userId) {
          fetch("/api/chats", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId }),
          }).catch((error) => {
            console.error("Failed to sync chat deletion to DB:", error);
          });
        }
      },
    });
    return () => {
      useChatStore.setState({ deleteChat: originalDeleteChat.current });
    };
  }, [userId, isInitialized]);

  // Override the deleteAllChats method to include DB sync
  useEffect(() => {
    if (!userId || !isInitialized) return;
    useChatStore.setState({
      deleteAllChats: () => {
        const chatIds = [...useChatStore.getState().chats.map((c) => c.id)];
        originalDeleteAllChats.current();
        if (userId) {
          Promise.all(
            chatIds.map((id) =>
              fetch("/api/chats", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId: id }),
              })
            )
          ).catch((error) => {
            console.error("Failed to sync all chat deletions to DB:", error);
          });
        }
      },
    });
    return () => {
      useChatStore.setState({ deleteAllChats: originalDeleteAllChats.current });
    };
  }, [userId, isInitialized]);

  return {
    isInitialized,
    isSyncing,
  };
}

// Helper function to merge local and DB chats
function mergeChats(dbChats: Chat[], localChats: Chat[]): Chat[] {
  // Create a map of DB chats by ID for quick lookup
  const dbChatsMap = new Map(dbChats.map((chat) => [chat.id, chat]));
  // Add local chats that don't exist in DB
  localChats.forEach((localChat) => {
    if (!dbChatsMap.has(localChat.id)) {
      dbChatsMap.set(localChat.id, localChat);
    }
  });
  // Convert map back to array and sort by updatedAt (newest first)
  return Array.from(dbChatsMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// Helper function to try parsing JSON content
function tryParseJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
