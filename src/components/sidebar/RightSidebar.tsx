import { ComponentProps } from "react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";

interface RightSidebarProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RightSidebar({
  children,
  defaultOpen,
  open,
  onOpenChange,
  ...props
}: RightSidebarProps &
  Omit<
    ComponentProps<typeof Sidebar>,
    "defaultOpen" | "open" | "onOpenChange"
  >) {
  return (
    <Sidebar side="right" {...props}>
      <SidebarRail />
      <SidebarContent>{children}</SidebarContent>
    </Sidebar>
  );
}
