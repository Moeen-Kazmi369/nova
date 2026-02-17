import React from "react";
import { useLocation, Outlet, Navigate } from "react-router-dom";

const ProtectRoutes = () => {
  const location = useLocation();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) {
    // Not logged in → redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.role !== "admin") {
    // Logged in but not admin → access denied
    return <Navigate to="/login" replace />;
  }

  // Admin → allow access
  return <Outlet />;
};

export default ProtectRoutes;
