import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // If your API base URL matches the frontend, this is optional
  // baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL
});

// Export commonly used functions for convenience
export const { signIn, signOut, useSession } = authClient;
