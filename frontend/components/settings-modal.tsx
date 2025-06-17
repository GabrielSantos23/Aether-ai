import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Key,
  MessageSquare,
  Shield,
  Palette,
  Bell,
  Loader2,
} from "lucide-react";
import { useSettingsModal } from "@/frontend/contexts/SettingsModalContext";
import APIKeyForm from "@/frontend/components/APIKeyForm";
import { useUser } from "@/hooks/useUser";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsModal() {
  const { isOpen, closeModal } = useSettingsModal();
  const [messagesUsed, setMessagesUsed] = useState(3);
  const { user, isLoading, isLoggedIn } = useUser();
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Initialize form with user data when available
  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const maxMessages = isLoggedIn ? 20 : 10;
  const remainingMessages = maxMessages - messagesUsed;

  const handleSignIn = () => {
    closeModal();
    navigate("/auth");
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="!max-w-6xl h-[600px] p-0 bg-background">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 p-6 border-r rounded-l-lg bg-sidebar">
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                PERSONAL SETTINGS
              </h3>
            </div>

            <nav className="space-y-2">
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium text-foreground rounded-lg border"
              >
                <User className="w-4 h-4 mr-3" />
                Account Settings
              </a>
              <a
                href="#"
                className="flex text-muted-foreground items-center px-3 py-2 text-sm font-medium hover:text-foreground hover:bg-accent/50 rounded-lg"
              >
                <Shield className="w-4 h-4 mr-3" />
                Privacy & Security
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg"
              >
                <Key className="w-4 h-4 mr-3" />
                API Integration
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg"
              >
                <Palette className="w-4 h-4 mr-3" />
                Appearance
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="px-8 py-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-semibold">
                    Account Settings
                  </DialogTitle>
                  <p className="text-muted-foreground mt-1">
                    Manage your AI chat account settings and preferences
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={closeModal}>
                    Discard
                  </Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full justify-start px-8 py-0 h-12 bg-transparent border-b rounded-none">
                  <TabsTrigger
                    value="profile"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                  >
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="usage"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                  >
                    Usage & Limits
                  </TabsTrigger>
                  <TabsTrigger
                    value="api"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                  >
                    API Settings
                  </TabsTrigger>
                </TabsList>

                <div className="px-8 py-6">
                  <TabsContent value="profile" className="mt-0 space-y-8">
                    {/* Account Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          Account Status
                          <Badge variant={isLoggedIn ? "default" : "secondary"}>
                            {isLoggedIn ? "Logged In" : "Guest User"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {isLoggedIn
                            ? "You have full access to all features"
                            : "Sign in to unlock additional features and higher message limits"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading user data...</span>
                          </div>
                        ) : isLoggedIn ? (
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={user?.image || ""}
                                alt={user?.name || "User"}
                              />
                              <AvatarFallback>
                                {getInitials(user?.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user?.name || "User"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user?.email}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              className="ml-auto"
                              onClick={handleSignOut}
                            >
                              Sign Out
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={handleSignIn}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Sign In to Your Account
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    {/* Profile Information */}
                    {isLoggedIn && (
                      <div className="space-y-6">
                        <div>
                          <Label
                            htmlFor="fullName"
                            className="text-base font-medium"
                          >
                            Full Name
                          </Label>
                          <p className="text-sm text-muted-foreground mb-3">
                            Your name will be visible in your chat history.
                          </p>
                          <div className="flex items-center gap-3">
                            <Input
                              id="fullName"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Enter your full name"
                              className="max-w-md"
                            />
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="email"
                            className="text-base font-medium"
                          >
                            Email Address
                          </Label>
                          <p className="text-sm text-muted-foreground mb-3">
                            Used for account notifications and recovery.
                          </p>
                          <div className="flex items-center gap-3">
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter your email address"
                              className="max-w-md"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="usage" className="mt-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Weekly Message Usage
                        </CardTitle>
                        <CardDescription>
                          Track your message usage and limits
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Messages Used This Week
                          </span>
                          <Badge variant="secondary">
                            {messagesUsed} / {maxMessages}
                          </Badge>
                        </div>

                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(messagesUsed / maxMessages) * 100}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {remainingMessages} messages remaining
                          </span>
                          <span className="text-muted-foreground">
                            Resets weekly
                          </span>
                        </div>

                        {!isLoggedIn && (
                          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-primary">
                              <strong>Upgrade your experience:</strong> Sign in
                              to get 20 messages per week instead of 10.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="api" className="mt-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Key className="w-5 h-5" />
                          API Key Configuration
                        </CardTitle>
                        <CardDescription>
                          Manage your personal API key for unlimited usage
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <APIKeyForm inModal={true} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
