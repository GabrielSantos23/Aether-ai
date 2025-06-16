"use client";

import { useEffect, useState, useCallback } from "react";
import { dataServiceClient } from "@/lib/data-service-client";
import { useUser } from "@/hooks/useUser";

export function useDataService() {
  const { user, isLoggedIn, isLoading: isAuthLoading, refetch } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Set authentication status in the data service client whenever it changes
  useEffect(() => {
    console.log("Auth state changed:", {
      isLoggedIn,
      userId: user?.id,
      isAuthLoading,
    });

    if (!isAuthLoading) {
      dataServiceClient.setAuthStatus(isLoggedIn, user?.id || null);
      console.log("Updated dataServiceClient auth status:", {
        isLoggedIn,
        userId: user?.id,
      });
    }
  }, [isLoggedIn, user, isAuthLoading]);

  // Function to check and update auth status manually
  const refreshAuthStatus = useCallback(async () => {
    if (isAuthLoading) return;

    try {
      setIsLoading(true);
      await refetch();
      dataServiceClient.setAuthStatus(isLoggedIn, user?.id || null);
      console.log("Manually refreshed auth status:", {
        isLoggedIn,
        userId: user?.id,
      });
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
