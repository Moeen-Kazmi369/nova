import React from "react";
import { Link } from "react-router-dom";

const AccessDenied: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-center p-6">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="text-lg text-gray-700 mb-6">
        Hello there 👋, it looks like you don’t have permission to view this page.
      </p>
    </div>
  );
};

export default AccessDenied;
