import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [],
});

export const { signIn, signOut, signUp, linkSocial, useSession } = authClient;
