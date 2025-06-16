import { ComponentProps } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
// import SourceMessages, { Source } from "@/components/chat/sourcemessages";

interface RightSidebarProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // sources?: Source[];
}

export function RightSidebar({
  children,
  defaultOpen,
  open,
  onOpenChange,
  // sources = [],
  ...props
}: RightSidebarProps &
  Omit<
    ComponentProps<typeof Sidebar>,
    "defaultOpen" | "open" | "onOpenChange"
  >) {
  return (
    <Sidebar side="right" {...props}>
      <SidebarRail />
      <SidebarContent>
        {/* <div className="flex-1 overflow-hidden">
        </div> */}
        {children}
      </SidebarContent>
    </Sidebar>
  );
}
