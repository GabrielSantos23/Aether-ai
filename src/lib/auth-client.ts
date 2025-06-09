import { twoFactorClient } from "better-auth/plugins/two-factor";
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [twoFactorClient(), adminClient({})],
});

export const {
  signIn,
  signOut,
  signUp,
  linkSocial,
  useSession,

  admin,
} = authClient;
