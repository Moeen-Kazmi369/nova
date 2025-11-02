import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Icon from "../../assets/Icon.png";
import { toast } from "sonner";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const emailQuery = new URLSearchParams(location.search).get("email") || "";
  React.useEffect(() => {
    if (emailQuery) {
      setEmail(emailQuery);
    }
  }, [emailQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/auth/login`,
        {
          email,
          password,
        }
      );
      toast.success("Login successful");

      // Save token or user data to localStorage
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("autoCreateChat", "true");
      navigate(redirect);
      toast.success("Login successful, redirecting...");
    } catch (error) {
      toast.error("Login failed, please provide valid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 text-white p-6 rounded-lg border border-slate-700 shadow-lg"
        >
          <div className="flex flex-col justify-center items-center mb-6">
            <img src={Icon} alt="logo" className="w-20 md:w-24 mb-3" />
            <h2 className="text-xl md:text-2xl font-bold text-center">
              NOVA 1000
              <span className="text-sm align-top ml-1 text-gray-400">™</span>
            </h2>
            <p className="text-center text-sm md:text-base mt-2">
              Please enter your credentials to sign in.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-600 rounded bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email address"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-600 rounded bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
          <p className="mt-6 text-center text-sm text-gray-300">
            Forgot password?{" "}
            <Link
              to="/forgot-password"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Click here
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-300">
            Don't have an account?{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;