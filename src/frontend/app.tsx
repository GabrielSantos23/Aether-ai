import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Docs, Examples, Home, Layout } from "@/components/boilerplate";
import NotFound from "@/app/not-found";
import { LoginForm } from "@/components/auth/login-form";
import { UserProfile } from "@/components/auth/user-profile";
import React from "react";
import Sidebar from "../components/sidebar/index";
import { useUser } from "@/lib/hooks/useUser";
import { CommandProvider } from "@/components/command-provider";
import { NewChat } from "@/components/chat/new-chat";
import { ChatDetail } from "@/components/chat/chat-detail";
import Settings from "@/components/settings/settings";
import { Toaster } from "@/components/ui/sonner";

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

  if (user) {
    return <Navigate to="/" state={{ from: location }} replace />;
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

function AppRoutes() {
  const isAuthPage = useIsAuthPage();

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route
        path="/chat"
        element={<ProtectedRoute element={<ChatDetail />} />}
      />
      <Route
        path="/chat/:id"
        element={<ProtectedRoute element={<ChatDetail />} />}
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
      <AppRoutes />
      <Toaster />
    </CommandProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWithProviders />
    </BrowserRouter>
  );
}
