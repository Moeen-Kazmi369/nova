import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Icon from "../../assets/Icon.png";
import { toast } from "sonner";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_API_URI}/api/auth/register`, {
        name,
        email,
        password,
      });

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("autoCreateChat", "true");
      navigate(redirect);
      toast.success("Registration successful");
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto">

    <div className="w-full flex flex-col justify-center items-center p-8  text-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg border shadow-sm"
      >
        <div className="flex flex-col justify-center items-center mb-8">
          <img src={Icon} alt="logo" className="w-[130px] " />

          <h2 className="text-2xl font-bold text-center">
            NOVA 1000<span className="text-sm align-top ml-1 text-gray-400">™</span>
         
          </h2>          <p className="text-center">Please enter your credentials to sign up.</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your name"
            required
          />
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
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        <p className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            to={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="text-blue-500 hover:text-blue-700"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
    </div>
  );
};

export default Register;
