import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Icon from "../../assets/Icon.png";
import { toast } from "sonner";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email from query parameters
  const query = new URLSearchParams(location.search);
  const email = query.get("email");
  const redirect = query.get("redirect");

  // Redirect to home page if no email is provided
  useEffect(() => {
    if (!email) {
      toast.error("No email provided. Redirecting to home page.");
      navigate("/");
    }
  }, [email, navigate]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/auth/verify-email-otp`,
        {
          email,
          otp,
        }
      );

      toast.success(data.msg || "OTP verified successfully!");
      setStatus("OTP verified! You can now reset your password.");
      navigate(
        `/login?email=${encodeURIComponent(
          email
        )}&redirect=${encodeURIComponent(redirect)}`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't render the form if redirecting (no email)
  if (!email) return null;

  return (
    <div className="w-full flex flex-col justify-center items-center p-8 text-black">
      <form
        onSubmit={handleVerifyOTP}
        className="w-full max-w-md bg-white p-8 rounded-lg border shadow-sm"
      >
        <div className="flex flex-col justify-center items-center mb-8">
          <img src={Icon} alt="logo" className="w-[130px]" />
          <h2 className="text-2xl font-bold text-center">
            NOVA 1000
            <span className="text-sm align-top ml-1 text-gray-400">™</span>
          </h2>
          <p className="text-center">Enter the OTP sent to {email}.</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">OTP</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter the OTP"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        {status && (
          <p className="mt-4 text-center text-sm text-green-600">{status}</p>
        )}
      </form>
    </div>
  );
};

export default VerifyOTP;
