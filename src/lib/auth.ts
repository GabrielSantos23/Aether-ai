import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { supabase } from "./supabase";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
  },

  emailVerification: {
    sendVerificationEmail: async (data: {
      user: { email: string };
      url: string;
      token: string;
    }) => {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.user.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        console.error("Error sending verification email:", error);
        throw error;
      }
    },
  },

  verification: {
    modelName: "verification",
    fields: {
      identifier: "identifier",
      token: "value",
      value: "value",
      expiresAt: "expiresAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    disableCleanup: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/api/auth/callback/google",
      mapProfileToUser: (profile) => ({
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        emailVerified: !!profile.email_verified,
      }),
    },
  },

  secret: process.env.BETTER_AUTH_SECRET || "",

  account: {
    modelName: "account",
    fields: {
      providerAccountId: "accountId",
      provider: "providerId",
      refreshToken: "refreshToken",
      accessToken: "accessToken",
      accessTokenExpiresAt: "accessTokenExpiresAt",
      idToken: "idToken",
      userId: "userId",
      sessionState: "sessionState",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
});
