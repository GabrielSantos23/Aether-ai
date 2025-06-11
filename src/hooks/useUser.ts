import { useSession } from "@/lib/auth-client";

/**
 * Custom hook to access the current user data
 * @returns An object containing the user data and loading state
 */
export function useUser() {
  const { data: session, isPending, error, refetch } = useSession();

  return {
    user: session?.user,
    isLoading: isPending,
    error,
    refetch,
    isLoggedIn: !!session?.user,
  };
}
