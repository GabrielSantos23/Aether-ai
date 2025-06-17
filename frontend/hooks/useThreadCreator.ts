import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Custom hook to check if the current user is the creator of a thread
 * and to get information about shared access
 * @param threadId The ID of the thread to check
 * @returns An object with information about the thread creator and shared status
 */
export function useThreadCreator(threadId: string | undefined) {
  const [isCreator, setIsCreator] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get the current user session
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: session } = await authClient.getSession();
        setUserId(session?.user?.id || null);
      } catch (err) {
        console.error("Error getting user session:", err);
        setUserId(null);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    const fetchThreadStatus = async () => {
      if (!threadId || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/threads/${threadId}/access`);

        if (!response.ok) {
          throw new Error("Failed to fetch thread access information");
        }

        const data = await response.json();

        setIsCreator(data.isCreator);
        setIsShared(data.isShared);
        setIsPublic(data.isPublic);
        setSharedWith(data.sharedWith || []);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred")
        );
        console.error("Error fetching thread creator status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreadStatus();
  }, [threadId, userId]);

  /**
   * Share the thread with specific users
   * @param emails Array of user emails to share the thread with
   * @returns Promise that resolves when the sharing operation completes
   */
  const shareWithUsers = async (emails: string[]) => {
    if (!threadId) {
      throw new Error("Thread ID is required");
    }

    try {
      const response = await fetch(`/api/threads/${threadId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to share thread");
      }

      const data = await response.json();
      setSharedWith(data.sharedWith || []);
      setIsShared(true);

      return data;
    } catch (err) {
      console.error("Error sharing thread:", err);
      throw err;
    }
  };

  /**
   * Remove a user's access to the thread
   * @param email The email of the user to remove access for
   * @returns Promise that resolves when the operation completes
   */
  const removeUserAccess = async (email: string) => {
    if (!threadId) {
      throw new Error("Thread ID is required");
    }

    try {
      const response = await fetch(
        `/api/threads/${threadId}/share/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove user access");
      }

      setSharedWith((prev) => prev.filter((e) => e !== email));
      if (sharedWith.length <= 1) {
        setIsShared(false);
      }

      return await response.json();
    } catch (err) {
      console.error("Error removing user access:", err);
      throw err;
    }
  };

  /**
   * Toggle the public status of the thread
   * @returns Promise that resolves when the operation completes
   */
  const togglePublicStatus = async () => {
    if (!threadId) {
      throw new Error("Thread ID is required");
    }

    try {
      const newPublicState = !isPublic;

      const response = await fetch(`/api/threads/${threadId}/public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: newPublicState }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update thread visibility"
        );
      }

      setIsPublic(newPublicState);

      return await response.json();
    } catch (err) {
      console.error("Error toggling thread public status:", err);
      throw err;
    }
  };

  return {
    isCreator,
    isShared,
    isPublic,
    sharedWith,
    isLoading,
    error,
    shareWithUsers,
    removeUserAccess,
    togglePublicStatus,
  };
}
