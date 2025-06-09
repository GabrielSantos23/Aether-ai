import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { SidebarButtons, SidebarButtonsRight } from "./sidebar-buttons";
import { useState } from "react";

// Helper function to safely access localStorage
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

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [defaultOpen] = useState(() =>
    getLocalStorageItem(`${SIDEBAR_STORAGE_KEY}_left`, true)
  );

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SidebarButtons />
      <SidebarButtonsRight />
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-auto border-muted-foreground/10 border rounded-lg">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
