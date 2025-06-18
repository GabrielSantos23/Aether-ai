import { SignIn } from "@/components/auth/SignIn";
import { useUser } from "@/hooks/useUser";
import { Navigate } from "react-router";

export default function Auth() {
  const { isLoggedIn } = useUser();

  if (isLoggedIn) {
    return <Navigate to="/chat" />;
  }

  return (
    <div className="flex  h-screen">
      <SignIn />
    </div>
  );
}
