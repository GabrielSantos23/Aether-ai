import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Provider = "openrouter" | "google" | "openai";

interface APIKeyState {
  keys: Record<Provider, string>;
  setKey: (provider: Provider, key: string) => void;
  getKey: (provider: Provider) => string;
  hasKey: (provider: Provider) => boolean;
  clearKey: (provider: Provider) => void;
  clearAllKeys: () => void;
}

export const useAPIKeyStore = create<APIKeyState>()(
  persist(
    (set, get) => ({
      keys: {
        openrouter: "",
        google: "",
        openai: "",
      },

      setKey: (provider, key) =>
        set((state) => ({
          keys: {
            ...state.keys,
            [provider]: key,
          },
        })),

      getKey: (provider) => get().keys[provider],

      hasKey: (provider) => {
        const key = get().keys[provider];
        return key !== undefined && key !== "";
      },

      clearKey: (provider) =>
        set((state) => ({
          keys: {
            ...state.keys,
            [provider]: "",
          },
        })),

      clearAllKeys: () =>
        set({
          keys: {
            openrouter: "",
            google: "",
            openai: "",
          },
        }),
    }),
    {
      name: "api-keys-storage",
      partialize: (state) => ({ keys: state.keys }),
    }
  )
);
