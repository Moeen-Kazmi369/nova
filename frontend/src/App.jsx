import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

// User imports
import UserHomePage from "./user/pages/HomePage";
import VoiceModePage from "./user/pages/VoiceModePage";
import MicAccessPage from "./user/pages/MicAccessPage";
import Login from "./user/pages/Login";
import Register from "./user/pages/Register";
import ForgotPassword from "./user/pages/ForgotPassword";
import ResetPassword from "./user/pages/ResetPassword";
import UserProtectRoutes from "./user/components/ProtectRoutes";
import CurrentChatVoiceModePage from "./user/pages/CurrentChatVoiceModePage";
import AccessDenied from "./user/pages/AccessDenied";

// Admin imports
import AdminHomePage from "./admin/pages/HomePage";
import ModelConfigs from "./admin/pages/ModelConfigs";
import AdminProtectRoutes from "./admin/components/ProtectRoutes";
import AboutPage from "./user/pages/AboutPage";
import VerifyOTP from "./user/pages/VerifyOTP";

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>

        {/* Auth Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* User Routes */}
        <Route element={<UserProtectRoutes />}>
          <Route path="/" element={<UserHomePage />} />
          <Route path="/voice" element={<VoiceModePage />} />
          <Route path="/voice/:id" element={<CurrentChatVoiceModePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/mic-access" element={<MicAccessPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminProtectRoutes />}>
          <Route path="/admin" element={<AdminHomePage />} />
          <Route path="/admin/model-configs" element={<ModelConfigs />} />
        </Route>
      </Routes>
    </Router>
  );
}
