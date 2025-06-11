import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import NotFound from "@/app/not-found";
import React from "react";
import Sidebar from "../components/sidebar/index";
import { useUser } from "@/hooks/useUser";
import { CommandProvider } from "@/components/command-provider";
import { Chat } from "@/components/chat";
import { Toaster } from "@/components/ui/sonner";
import { LoginForm } from "@/components/auth/SignInForm";
import { UserProfile } from "@/components/auth/UserProfile";
import { APIKeySettings } from "@/components/settings/APIKeySettings";

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

function AppRoutes() {
  const isAuthPage = useIsAuthPage();

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/chat" element={<ProtectedRoute element={<Chat />} />} />
      <Route path="/chat/:id" element={<ProtectedRoute element={<Chat />} />} />

      <Route path="/auth" element={<AuthRoute element={<LoginForm />} />} />
      <Route
        path="/auth/profile"
        element={<ProtectedRoute element={<UserProfile />} />}
      />
      <Route
        path="/settings"
        element={<ProtectedRoute element={<Settings />} />}
      />

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
      <Toaster className="bg-popover/50 backdrop-blur-md" />
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
