import React, { useState } from "react";
import {
  ArrowLeft,
  Settings,
  User,
  History,
  Bot,
  Key,
  Paperclip,
  Mail,
  Crown,
  Zap,
  Users,
  CloudUpload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import APIKeyForm from "../components/APIKeyForm";
import { NavLink } from "react-router";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import ThemeToggler from "@/components/theme/toggler";
import { useDataService } from "@/frontend/hooks/useDataService";

export default function SettingsPage() {
  const { user } = useUser();
  const { dataService, isLoggedIn } = useDataService();
  const [isMigrating, setIsMigrating] = useState(false);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  const handleMigrateData = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to migrate data");
      return;
    }

    setIsMigrating(true);
    try {
      // Use the client's method to migrate data
      const success = await dataService.migrateLocalDataToSupabase();

      if (success) {
        toast.success("Your local chats have been synced to your account");
      } else {
        toast.error("Failed to sync your local chats");
      }
    } catch (error) {
      console.error("Error migrating local data:", error);
      toast.error("Failed to sync your local chats");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center ">
      <div className="max-w-7xl w-full h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 ">
          <NavLink
            to="/chat"
            className="text-muted-foreground flex items-center gap-2 hover:text-primary hover:bg-card rounded-lg p-2 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </NavLink>
          <div className="flex items-center gap-2">
            <ThemeToggler />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-primary hover:bg-card rounded-lg p-2 transition-all duration-300"
            >
              Sign out
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-80 p-6 ">
            {/* Profile Section */}
            <div className="flex flex-col items-center mb-8">
              <Avatar className="w-24 h-24 mb-4 bg-card">
                <AvatarImage src={user?.image ?? ""} />
                <AvatarFallback className="text-2xl font-semibold text-white bg-card">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <Badge
                variant="secondary"
                className="mt-2 bg-card text-muted-foreground"
              >
                Free Plan
              </Badge>
            </div>

            {/* Usage Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Message Usage</h3>
                <span className="text-xs text-muted-foreground">
                  Resets today at 9:00 PM
                </span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Standard
                  </span>
                  <span className="text-sm">0/20</span>
                </div>
                <Progress value={10} className="h-2 bg-card" />
                <p className="text-xs text-muted-foreground mt-1">
                  20 messages remaining
                </p>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="font-medium mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Search</span>
                  <div className="flex space-x-1">
                    <kbd className="px-2 py-1 text-xs bg-card rounded">
                      Ctrl
                    </kbd>
                    <kbd className="px-2 py-1 text-xs bg-card rounded">K</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    New Chat
                  </span>
                  <div className="flex space-x-1">
                    <kbd className="px-2 py-1 text-xs bg-card rounded">
                      Ctrl
                    </kbd>
                    <kbd className="px-2 py-1 text-xs bg-card rounded">
                      Shift
                    </kbd>
                    <kbd className="px-2 py-1 text-xs bg-card rounded">O</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Toggle Sidebar
                  </span>
                  <div className="flex space-x-1">
                    <kbd className="px-2 py-1 text-xs bg-card rounded">
                      Ctrl
                    </kbd>
                    <kbd className="px-2 py-1 text-xs bg-card rounded">B</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-7   h-auto  bg-card p-2 rounded-lg">
                <TabsTrigger value="account" className="rounded-lg ">
                  Account
                </TabsTrigger>
                <TabsTrigger value="customization" className="rounded-lg">
                  Customization
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg">
                  History & Sync
                </TabsTrigger>
                <TabsTrigger value="models" className="rounded-lg">
                  Models
                </TabsTrigger>
                <TabsTrigger value="api" className="rounded-lg">
                  API Keys
                </TabsTrigger>
                <TabsTrigger value="attachments" className="rounded-lg">
                  Attachments
                </TabsTrigger>
                <TabsTrigger value="contact" className="rounded-lg">
                  Contact Us
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="mt-8">
                {/* Upgrade to Pro Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">Upgrade to Pro</h2>
                    <span className="text-2xl font-bold">
                      $8<span className="text-lg text-gray-400">/month</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Access to All Models */}
                    <Card className="bg-card">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Bot className="w-5 h-5 mr-2 text-primary" />
                          Access to All Models
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Get access to our full suite of models including
                          Claude, o3-mini-high, and more!
                        </p>
                      </CardContent>
                    </Card>

                    {/* Generous Limits */}
                    <Card className="bg-card">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Zap className="w-5 h-5 mr-2 text-primary" />
                          Generous Limits
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Receive <strong>1500 standard credits</strong> per
                          month, plus <strong>100 premium credits</strong> per
                          month.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Priority Support */}
                    <Card className="bg-card">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Users className="w-5 h-5 mr-2 text-primary" />
                          Priority Support
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Get faster responses and dedicated assistance from the
                          T3 team whenever you need help!
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-semibold mb-4">
                    Upgrade Now
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    * Premium credits are used for GPT Image Gen, o3, Claude
                    Sonnet, Gemini 2.5 Pro, and Grok 3. Additional Premium
                    credits can be purchased separately for $8 per 100.
                  </p>
                </div>

                <Separator className="bg-border mb-8" />

                {/* Danger Zone */}
                <div>
                  <h3 className="text-xl font-semibold text-red-400 mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Permanently delete your account and all associated data.
                  </p>
                  <Button
                    variant="destructive"
                    className="bg-red-900 hover:bg-red-800 text-red-100"
                  >
                    Delete Account
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="customization" className="mt-8">
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Customization Settings
                  </h3>
                  <p className="text-muted-foreground">
                    Customize your Claude experience here.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        Sync Local Chats
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Upload your local chat history to your account
                      </p>
                    </div>
                    <Button
                      onClick={handleMigrateData}
                      disabled={!isLoggedIn || isMigrating}
                      className="flex items-center gap-2"
                    >
                      {isMigrating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <CloudUpload className="h-4 w-4" />
                          Sync Local Chats
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-lg font-semibold mb-1">Chat History</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Manage your conversation history and sync settings
                    </p>

                    <Card className="bg-card">
                      <CardHeader>
                        <CardTitle>Chat History Settings</CardTitle>
                        <CardDescription>
                          Configure how your chat history is stored and managed
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Save Chat History</p>
                            <p className="text-sm text-muted-foreground">
                              Store your conversations for future reference
                            </p>
                          </div>
                          <Button variant="outline">Configure</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="models" className="mt-8">
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Models</h3>
                  <p className="text-muted-foreground">
                    Configure which AI models you have access to.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="api" className="mt-8">
                <APIKeyForm inModal={true} />
              </TabsContent>

              <TabsContent value="attachments" className="mt-8">
                <div className="text-center py-12">
                  <Paperclip className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Attachments</h3>
                  <p className="text-muted-foreground">
                    Configure file attachment settings.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-8">
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
                  <p className="text-muted-foreground">
                    Get help and support from our team.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
