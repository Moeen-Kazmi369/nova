import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Icon from "../assets/Icon.png";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API_URI}/api/auth/reset-password/${token}`, {
        newPassword,
      });

      toast.success("Password has been reset successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center p-8 text-black">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md bg-white text-black p-8 rounded-lg border shadow-sm"
      >
        <div className="flex flex-col justify-center items-center mb-8">
          <img src={Icon} alt="logo" className="w-[130px] " />

          <h2 className="text-2xl font-bold text-center">
            NOVA 1000<span className="text-sm align-top ml-1 text-gray-400">™</span>
         
          </h2>          <p className="text-center">Reset your password</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter new password"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
