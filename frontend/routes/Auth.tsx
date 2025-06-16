import { SignIn } from "@/components/auth/SignIn";

export default function Auth() {
  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
      <SignIn />
    </div>
  );
}
