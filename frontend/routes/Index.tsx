import { Link } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { siteConfig } from "@/app/config/site.config";

export default function Index() {
  const { isLoggedIn, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen flex-col">
        <h1 className="text-3xl font-bold mb-6">
          Welcome to {siteConfig.name}
        </h1>
        <div className="flex gap-4">
          <Link to="/chat" className="px-4 py-2 bg-blue-500 text-white rounded">
            Go to Chat
          </Link>
          <Link
            to="/profile"
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <h1 className="text-3xl font-bold mb-6">Welcome to {siteConfig.name}</h1>
      <p className="mb-6">Please sign in or create an account to continue</p>
      <div className="flex gap-4">
        <Link to="/auth" className="px-4 py-2 bg-blue-500 text-white rounded">
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
