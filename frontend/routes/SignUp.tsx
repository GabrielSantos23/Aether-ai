import { SignUp } from "@/components/auth/SignUp";

export default function SignUpPage() {
  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
      <SignUp />
    </div>
  );
}
