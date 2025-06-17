import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ChatLayout from "./components/sidebar/ChatLayout";
import Home from "./routes/Home";
import Index from "./routes/Index";
import Thread from "./routes/Thread";
import Settings from "./routes/Settings";
import Auth from "./routes/Auth";
import SignUpPage from "./routes/SignUp";
import ProfilePage from "./routes/Profile";
import { SettingsModalProvider } from "./contexts/SettingsModalContext";
import SettingsModal from "@/frontend/components/settings-modal";

export default function App() {
  return (
    <BrowserRouter>
      <SettingsModalProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" />} />
          <Route path="chat" element={<ChatLayout />}>
            <Route index element={<Home />} />
            <Route path=":id" element={<Thread />} />
          </Route>
          <Route path="settings" element={<Settings />} />
          <Route path="auth" element={<Auth />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<p> Not found </p>} />
        </Routes>
        <SettingsModal />
      </SettingsModalProvider>
    </BrowserRouter>
  );
}
