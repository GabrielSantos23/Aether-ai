import { authClient } from "@/lib/auth-client";
import { ReactNode } from "react";
import { Toaster } from "../ui/sonner";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
