import { SidebarInset, SidebarProvider } from "../../../components/ui/sidebar";
import ChatSidebar from "./ChatSidebar";
import { RightSidebar } from "./RightSidebar";
import { SidebarButtons, SidebarButtonsRight } from "./sidebar-buttons";
import { useState, useContext } from "react";
// import { Source } from "../chat/sourcemessages";
import React from "react";

function getLocalStorageItem(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage:`, error);
    return defaultValue;
  }
}

const SIDEBAR_STORAGE_KEY = "sidebar_state";

export const SourcesContext = React.createContext<{
  sources: Source[];
  setActiveSources: (sources: Source[]) => void;
}>({
  sources: [],
  setActiveSources: () => {},
});

export const useSources = () => useContext(SourcesContext);

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [defaultOpen] = useState(() =>
    getLocalStorageItem(`${SIDEBAR_STORAGE_KEY}_left`, true)
  );

  const [sources, setSources] = useState<Source[]>([]);

  return (
    <SourcesContext.Provider
      value={{
        sources,
        setActiveSources: setSources,
      }}
    >
      <SidebarProvider defaultOpen={defaultOpen} defaultOpenRight={false}>
        <SidebarButtons />
        <SidebarButtonsRight />
        <ChatSidebar />

        <SidebarInset className="overflow-hidden">
          <main className="max-h-[99vh] rounded-lg overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
        <RightSidebar />
      </SidebarProvider>
    </SourcesContext.Provider>
  );
}
