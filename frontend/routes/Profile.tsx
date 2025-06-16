import { Profile } from "@/components/auth/Profile";

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Profile</h1>
      <Profile />
    </div>
  );
}
