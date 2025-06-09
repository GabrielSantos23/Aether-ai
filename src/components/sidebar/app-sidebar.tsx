"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site.config";
import {
  HomeIcon,
  BookOpenIcon,
  CodeIcon,
  UserIcon,
  SearchIcon,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NavLink } from "react-router";
import { signIn, signOut } from "@/lib/auth-client";
import { useState } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [loading, setLoading] = useState(false);
  const { user, isLoading } = useUser();

  return (
    <Sidebar variant={"inset"} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="  ">
              <div className="flex justify-between items-center ">
                <a
                  href="#"
                  className="flex justify-between items-center gap-x-3 w-full"
                >
                  <div className="grid flex-1 text-center w-full text-sm leading-tight">
                    <span className="truncate font-semibold text-lg">
                      {siteConfig.name}
                    </span>
                  </div>
                </a>
              </div>
            </SidebarMenuButton>
            <div className="border-b w-full mt-2" />
          </SidebarMenuItem>
          <Button asChild>
            <span>New Chat</span>
          </Button>
        </SidebarMenu>
        <div className="border-b w-full mt-2">
          <div className="relative flex items-center">
            <Input
              placeholder="Search your threads..."
              className="pl-10 bg-transparent dark:bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to="/settings" className="w-full">
              <SidebarMenuButton>
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mb-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                await signOut();
                setLoading(false);
              }}
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              <span>Logout</span>
            </Button>
          </div>
        ) : (
          <NavLink to="/auth" className="flex justify-center w-full">
            <Button
              variant="outline"
              className="w-full"
              disabled={loading || isLoading}
            >
              <LogInIcon className="w-4 h-4 mr-2" />
              <span>Login</span>
            </Button>
          </NavLink>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
