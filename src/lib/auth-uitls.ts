import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { authClient } from "./auth-client";

export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export const getUser = async () => {
  const session = await getSession();
  return session?.user;
};

export type Session = typeof authClient.$Infer.Session;
