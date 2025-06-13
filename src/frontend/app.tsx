import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import NotFound from "@/app/not-found";
import React, { Suspense } from "react";
import Sidebar from "../components/sidebar/index";
import { useUser } from "@/hooks/useUser";
import { CommandProvider } from "@/components/command-provider";
import { Chat } from "@/components/chat";
import { Toaster } from "@/components/ui/sonner";
import { LoginForm } from "@/components/auth/SignInForm";
import { UserProfile } from "@/components/auth/UserProfile";
import { APIKeySettings } from "@/components/settings/APIKeySettings";
import { RightSidebar } from "@/components/sidebar/RightSidebar";
import { useChatSync } from "@/hooks/useChatSync";
import { AuthProvider } from "@/components/providers/AuthProvider";

function useIsAuthPage() {
  const location = useLocation();
  return (
    location.pathname.startsWith("/auth") &&
    location.pathname !== "/auth/profile"
  );
}

function AuthRoute({ element }: { element: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{element}</>;
}

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{element}</>;
}

function Settings() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      <div className="p-6 bg-card rounded-lg shadow-sm">
        <APIKeySettings />
      </div>
    </div>
  );
}

// Loading fallback for suspense
function LoadingFallback() {
  return <div className="p-8 text-center">Loading...</div>;
}

function ChatSyncProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized, isSyncing } = useChatSync();

  return <>{children}</>;
}

function AppRoutes() {
  const isAuthPage = useIsAuthPage();

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />

      {/* The empty chat route (for new chats) */}
      <Route
        path="/chat"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Chat />
          </Suspense>
        }
      />

      {/* The chat route with an ID parameter */}
      <Route
        path="/chat/:id"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Chat />
          </Suspense>
        }
      />

      <Route path="/auth" element={<AuthRoute element={<LoginForm />} />} />
      <Route
        path="/auth/profile"
        element={<ProtectedRoute element={<UserProfile />} />}
      />
      <Route path="/settings" element={<Settings />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  if (isAuthPage) {
    return routes;
  }

  return <Sidebar>{routes}</Sidebar>;
}

function AppWithProviders() {
  return (
    <CommandProvider>
      <ChatSyncProvider>
        <AppRoutes />
      </ChatSyncProvider>
      <Toaster className="bg-popover/50 backdrop-blur-md" />
    </CommandProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppWithProviders />
      </AuthProvider>
    </BrowserRouter>
  );
}
