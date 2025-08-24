import React, { useState } from "react";
import axios from "axios";
import Icon from "../../assets/Icon.png";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API_URI}/api/auth/forgot-password`, {
        email,
      });

      toast.success(data.msg || "Password reset link sent!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center p-8  text-black">
      <form
        onSubmit={handleForgotPassword}
        className="w-full max-w-md bg-white p-8 rounded-lg border shadow-sm"
      >
        <div className="flex flex-col justify-center items-center mb-8">
          <img src={Icon} alt="logo" className="w-[130px] " />

          <h2 className="text-2xl font-bold text-center">
            NOVA 1000<span className="text-sm align-top ml-1 text-gray-400">™</span>
         
          </h2>          <p className="text-center">Enter your email to reset your password.</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your email"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {status && <p className="mt-4 text-center text-sm text-green-600">{status}</p>}
      </form>
    </div>
  );
};

export default ForgotPassword;
