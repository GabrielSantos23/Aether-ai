"use client";

import { LoginForm } from "@/components/auth/login-form";
import { UserProfile } from "@/components/auth/user-profile";
import { useParams } from "next/navigation";

export default function AuthPage() {
  const params = useParams();
  const action = params.action as string;

  switch (action) {
    case "sign-in":
      return (
        <div className="container flex flex-col items-center justify-center min-h-screen py-12">
          <LoginForm />
        </div>
      );
    case "profile":
      return (
        <div className="container flex flex-col items-center justify-center min-h-screen py-12">
          <UserProfile />
        </div>
      );
    default:
      return (
        <div className="container flex flex-col items-center justify-center min-h-screen py-12">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p>The requested auth action is not supported.</p>
        </div>
      );
  }
}
