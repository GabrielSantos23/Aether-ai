import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChatLayout from "./components/sidebar/ChatLayout";
import Home from "./routes/Home";
import Index from "./routes/Index";
import Thread from "./routes/Thread";
import Settings from "./routes/Settings";
import Auth from "./routes/Auth";
import SignUpPage from "./routes/SignUp";
import ProfilePage from "./routes/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
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
    </BrowserRouter>
  );
}
