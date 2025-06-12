import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export type Chat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

export type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
};

interface ChatState {
  chats: Chat[];
  activeChat: string | null;
  setActiveChat: (chatId: string | null) => void;
  createChat: () => string;
  updateChatTitle: (chatId: string, title: string) => void;
  addMessage: (
    chatId: string,
    content: string,
    role: "user" | "assistant"
  ) => string;
  deleteChat: (chatId: string) => void;
  deleteAllChats: () => void;
  getChat: (chatId: string) => Chat | undefined;
  getAllChats: () => Chat[];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,

      setActiveChat: (chatId) => set({ activeChat: chatId }),

      createChat: () => {
        const id = uuidv4();
        const now = new Date().toISOString();

        set((state) => ({
          chats: [
            ...state.chats,
            {
              id,
              title: "New Chat",
              createdAt: now,
              updatedAt: now,
              messages: [],
            },
          ],
          activeChat: id,
        }));

        return id;
      },

      updateChatTitle: (chatId, title) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  title,
                  updatedAt: new Date().toISOString(),
                }
              : chat
          ),
        })),

      addMessage: (chatId, content, role) => {
        const messageId = uuidv4();
        const now = new Date().toISOString();

        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  updatedAt: now,
                  messages: [
                    ...chat.messages,
                    {
                      id: messageId,
                      content,
                      role,
                      createdAt: now,
                    },
                  ],
                }
              : chat
          ),
        }));

        return messageId;
      },

      deleteChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          activeChat: state.activeChat === chatId ? null : state.activeChat,
        })),

      deleteAllChats: () =>
        set({
          chats: [],
          activeChat: null,
        }),

      getChat: (chatId) => get().chats.find((chat) => chat.id === chatId),

      getAllChats: () => get().chats,
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        chats: state.chats,
        activeChat: state.activeChat,
      }),
    }
  )
);
