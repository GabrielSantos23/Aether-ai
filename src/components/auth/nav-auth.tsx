"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { NavLink, useNavigate } from "react-router";
import { useState } from "react";

export function NavAuth() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <Button variant="ghost" disabled>
        Loading...
      </Button>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/auth/profile")}>
          Profile
        </Button>
        <Button variant="outline" onClick={handleSignOut} disabled={loading}>
          {loading ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <NavLink
        to="/auth/sign-in"
        className={({ isActive }) =>
          `${
            isActive
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          } text-sm transition-colors`
        }
      >
        Sign in
      </NavLink>
      <Button variant="default" onClick={() => navigate("/auth/sign-up")}>
        Sign up
      </Button>
    </div>
  );
}
