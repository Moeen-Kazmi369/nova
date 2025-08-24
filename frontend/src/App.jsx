import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

// User imports
import UserHomePage from "./user/pages/HomePage";
import VoiceModePage from "./user/pages/VoiceModePage";
import MicAccessPage from "./user/pages/MicAccessPage";
import UserLogin from "./user/pages/Login";
import Register from "./user/pages/Register";
import ForgotPassword from "./user/pages/ForgotPassword";
import ResetPassword from "./user/pages/ResetPassword";
import UserProtectRoutes from "./user/components/ProtectRoutes";
import CurrentChatVoiceModePage from "./user/pages/CurrentChatVoiceModePage";
import UserAccessDenied from "./user/pages/AccessDenied";

// Admin imports
import AdminHomePage from "./admin/pages/HomePage";
import ModelConfigs from "./admin/pages/ModelConfigs";
import AdminLogin from "./admin/pages/Login";
import AdminProtectRoutes from "./admin/components/ProtectRoutes";
import AdminAccessDenied from "./admin/pages/AccessDenied";
import AboutPage from "./user/pages/AboutPage";

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* User Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/access-denied" element={<UserAccessDenied />} />
        <Route element={<UserProtectRoutes />}>
          <Route path="/" element={<UserHomePage />} />
          <Route path="/voice" element={<VoiceModePage />} />
          <Route path="/voice/:id" element={<CurrentChatVoiceModePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/mic-access" element={<MicAccessPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/access-denied" element={<AdminAccessDenied />} />
        <Route element={<AdminProtectRoutes />}>
          <Route path="/admin" element={<AdminHomePage />} />
          <Route path="/admin/model-configs" element={<ModelConfigs />} />
        </Route>
      </Routes>
    </Router>
  );
}
