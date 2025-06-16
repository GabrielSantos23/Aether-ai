import ChatSidebar from "@/frontend/components/sidebar/ChatSidebar";
import { Outlet } from "react-router";
import Sidebar from ".";

export default function ChatLayout() {
  return (
    <Sidebar>
      <ChatSidebar />
      <div className="flex-1 relative">
        <Outlet />
      </div>
    </Sidebar>
  );
}
