import React from "react";
import { useLocation, Outlet, Navigate } from "react-router-dom";

const ProtectRoutes = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get("email");
  const user = localStorage.getItem("user");

  if (!email && !user) {
    // No email in URL & no logged in user → Access Denied
    return <Navigate to="/access-denied" replace />;
  }

  if (email && !user) {
    // Email exists in URL & no user logged in → Login with email
    return <Navigate to="/login" state={{ email, from: location }} replace />;
  }

  // If either:
  // - user exists and email doesn't matter
  // - email exists and user exists
  // Then allow access
  return <Outlet />;
};

export default ProtectRoutes;
