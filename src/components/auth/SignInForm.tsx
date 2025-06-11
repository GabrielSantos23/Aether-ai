"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { NavLink } from "react-router-dom";
import { siteConfig } from "@/config/site.config";
import { ArrowLeftIcon, ArrowRightIcon, Loader2 } from "lucide-react";
import { RiGoogleFill } from "@remixicon/react";

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-screen relative w-full">
      <NavLink
        to="/"
        className="flex items-center gap-x-2 absolute top-6 left-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Back to chat</span>
      </NavLink>
      <h2 className="text-2xl ">
        Welcome to{" "}
        <span className="text-primary font-bold text-3xl">
          {siteConfig.name}
        </span>
      </h2>
      <p className="text-sm text-muted-foreground mt-2">
        Sign in below (we'll let you send 10 messages for free if you do 😉)
      </p>
      <Button
        className="w-full max-w-md mt-4 "
        size="lg"
        variant="outline"
        onClick={async () => {
          setLoading(true);
          await signIn.social(
            {
              provider: "google",
              callbackURL: "/",
            },
            {
              onRequest: (ctx) => {
                setLoading(true);
              },
              onSuccess: () => {
                setLoading(false);
              },
              onError: () => {
                setLoading(false);
              },
            }
          );
        }}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <div className="flex items-center gap-x-2">
            <RiGoogleFill className="w-4 h-4" />
            <p>Sign in with Google</p>
          </div>
        )}
      </Button>
    </div>
  );
}
