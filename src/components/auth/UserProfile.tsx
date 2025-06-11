"use client";

import { useUser } from "@/hooks/useUser";
import { APIKeySettings } from "@/components/settings/APIKeySettings";
import { useNavigate } from "react-router-dom";

export function UserProfile() {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
          <button
            onClick={() => navigate("/settings")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Settings
          </button>
        </div>

        {user && (
          <div className="p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Your Profile</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              {user.name && (
                <p>
                  <span className="font-medium">Name:</span> {user.name}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="p-6 bg-card rounded-lg shadow-sm">
          <APIKeySettings />
        </div>
      </div>
    </div>
  );
}
