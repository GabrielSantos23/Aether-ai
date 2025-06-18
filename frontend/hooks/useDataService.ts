"use client";

import { useEffect, useState, useCallback } from "react";
import { dataServiceClient } from "@/lib/data-service-client";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export function useDataService() {
  const { user, isLoggedIn, isLoading: isAuthLoading, refetch } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);

  // Set authentication status in the data service client whenever it changes
  useEffect(() => {
    if (!isAuthLoading) {
      console.log("Auth status changed:", {
        isLoggedIn,
        userId: user?.id,
        hasMigrated,
      });
      dataServiceClient.setAuthStatus(isLoggedIn, user?.id || null);

      // If the user just logged in and we haven't migrated data yet, trigger migration
      if (isLoggedIn && user?.id && !hasMigrated) {
        console.log("Attempting to migrate local data to Supabase...");
        const migrateData = async () => {
          setIsLoading(true);
          try {
            // Use the client's method to migrate data
            const success =
              await dataServiceClient.migrateLocalDataToSupabase();

            if (success) {
              console.log("Migration successful");
              toast.success(
                "Your local chats have been synced to your account"
              );
              setHasMigrated(true);
            } else {
              console.error("Migration failed");
              toast.error("Failed to sync your local chats");
            }
          } catch (error) {
            console.error("Error migrating local data:", error);
            toast.error("Failed to sync your local chats");
          } finally {
            setIsLoading(false);
          }
        };

        migrateData();
      }
    }
  }, [isLoggedIn, user, isAuthLoading, hasMigrated]);

  // Function to check and update auth status manually
  const refreshAuthStatus = useCallback(async () => {
    if (isAuthLoading) return;

    try {
      setIsLoading(true);
      await refetch();
      dataServiceClient.setAuthStatus(isLoggedIn, user?.id || null);
    } catch (error) {
      console.error("Error refreshing auth status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user, isAuthLoading, refetch]);

  // Return the data service along with authentication state
  return {
    dataService: dataServiceClient,
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    isLoading: isLoading || isAuthLoading,
    refreshAuthStatus,
  };
}
