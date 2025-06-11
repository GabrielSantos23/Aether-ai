import { useState } from "react";
import { LoginForm } from "./SignInForm";
import { useAuth } from "../providers/AuthProvider";
import { UserProfile } from "./UserProfile";

export function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { data: session, isPending } = useAuth();

  if (isPending) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  if (session) {
    return (
      <div className="max-w-md mx-auto py-12">
        <UserProfile />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      {mode === "signin" && <LoginForm />}

      <div className="mt-6 text-center">
        {mode === "signin" ? (
          <p>
            Don't have an account?{" "}
            <button
              onClick={() => setMode("signup")}
              className="text-blue-600 hover:underline"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button
              onClick={() => setMode("signin")}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
