import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { UserProfile } from "./UserProfile";

export function ProfilePage() {
  const { data: session, isPending } = useAuth();
  const [tab, setTab] = useState<"profile" | "settings">("profile");

  if (isPending) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Account</h1>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <div className="sticky top-8">
            <UserProfile />

            <div className="mt-6 border rounded-lg overflow-hidden">
              <button
                onClick={() => setTab("profile")}
                className={`w-full py-3 px-4 text-left ${
                  tab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setTab("settings")}
                className={`w-full py-3 px-4 text-left ${
                  tab === "settings"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50"
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          {tab === "profile" ? (
            <div className="space-y-6">
              <div className="border rounded-lg p-6 bg-card">
                <h2 className="text-xl font-semibold mb-4">
                  Profile Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Name
                    </label>
                    <div className="font-medium">
                      {session.user.name || "Not set"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </label>
                    <div className="font-medium">{session.user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email Verified
                    </label>
                    <div className="font-medium">
                      {session.user.emailVerified ? (
                        <span className="text-green-600">Verified</span>
                      ) : (
                        <span className="text-red-600">Not verified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-lg p-6 bg-card">
                <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
                <p className="text-muted-foreground mb-4">
                  Manage your account settings and preferences.
                </p>

                <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  Change Password
                </button>
              </div>

              <div className="border rounded-lg p-6 bg-card">
                <h2 className="text-xl font-semibold text-red-600 mb-4">
                  Danger Zone
                </h2>
                <p className="text-muted-foreground mb-4">
                  Permanently delete your account and all of your data.
                </p>

                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
