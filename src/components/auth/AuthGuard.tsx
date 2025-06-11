import { ReactNode } from "react";
import { useAuth } from "../providers/AuthProvider";
import { Navigate } from "react-router";

interface AuthGuardProps {
  children: ReactNode;
  fallbackUrl?: string;
}

export function AuthGuard({ children, fallbackUrl = "/auth" }: AuthGuardProps) {
  const { data: session, isPending } = useAuth();

  if (isPending) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  if (!session) {
    return <Navigate to={fallbackUrl} />;
  }

  return <>{children}</>;
}
