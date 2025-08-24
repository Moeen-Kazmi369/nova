import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Icon from "../../assets/Icon.png";
import { toast } from "sonner";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  React.useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API_URI}/api/auth/login`, {
        email,
        password,
      });
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
    <div className="h-screen overflow-y-auto">
      <div className="w-full flex  flex-col justify-center items-center p-8  ">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white text-black p-8 rounded-lg border shadow-sm"
        >
          <div className="flex flex-col justify-center items-center mb-8">
            <img src={Icon} alt="logo" className="w-[130px] " />
            <h2 className="text-2xl font-bold text-center">
              NOVA 1000<span className="text-sm align-top ml-1 text-gray-400">™</span>

            </h2>
            {/* <h2 className="text-2xl font-bold text-center">Nova</h2> */}
            <p className="text-center">Please enter your credentials to sign in.</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semi-bold mb-2 text-black">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your email address"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semi-bold mb-2 text-black">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>
          <p className="mt-6 text-center text-sm text-black">
            Forgot password?{" "}
            <Link to="/forgot-password" className="text-blue-500 hover:text-blue-700">
              Click here
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-black">
            Don't have an account?{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-blue-500 hover:text-blue-700"
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
