import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import VoiceModePage from "./pages/VoiceModePage";
import { AboutPage } from "./pages/AboutPage";
import MicAccessPage from "./pages/MicAccessPage";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectRoutes from "./components/ProtectRoutes";
import CurrentChatVoiceModePage from "./pages/CurrentChatVoiceModePage";

export default function AppRouter() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route element={<ProtectRoutes />}>
          <Route path="/" element={<App />} />
          <Route path="/voice" element={<VoiceModePage />} />
          <Route path="/voice/:id" element={<CurrentChatVoiceModePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/mic-access" element={<MicAccessPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
