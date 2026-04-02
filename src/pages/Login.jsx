import { useState } from "react";

import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await login(email, password);

      if (!response || !response.success) {
        setError(response?.message || "Invalid credentials");
        return;
      }

      // Save auth data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("emp_id", response.data.emp_id);

      const roles = Array.isArray(response.data.role)
        ? response.data.role
        : ["USER"];

      const role = roles[0]?.toUpperCase() || "USER";

      localStorage.setItem("role", role);

      // Navigate based on role
      if (role === "SUPERADMIN") {
        navigate("/superadmin/dashboard");
      } else if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 font-sans">

      {/* LEFT */}
      <div className="relative flex items-center justify-center bg-white px-10">
        <div className="w-full max-w-md">

          {/* Brand */}
          <div className="absolute top-8 left-10">
            <img
              src="/Ahana Logo 2024_Full Size@3x 2.png"
              alt="Ahana Logo"
              className="h-8 object-contain"
            />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            Login
          </h2>
          <p className="text-gray-500 mb-7">
            Enter your credentials to access the management portal.
          </p>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Username or Email
              </label>
              <div className="relative mt-2">
                {/* User Icon */}
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  placeholder="e.g. admin@company.com"
                  className="w-full border border-gray-300 rounded-2xl
               pl-10 pr-4 py-3
               focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20
               outline-none transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Password
              </label>

              <div className="relative mt-2">

                {/* Lock Icon Left */}
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                {/* Input */}
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full border border-gray-200 rounded-2xl
                 pl-10 pr-10 py-3
                 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20
                 outline-none transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {/* Eye Icon Right */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

              </div>
            </div>

            {/* Forgot */}
            {/* <div className="text-right">
              <button
                type="button"
                className="text-sm font-medium text-[#7861E6] hover:text-[#7861E6] transition"
              >
                Forgot password?
              </button>
            </div> */}

            {/* CTA */}
            <button
              type="submit"
              className="mt-2 w-full bg-gradient-to-r bg-[#7861E6]
                         text-white py-3 rounded-2xl font-semibold
                         hover:shadow-lg hover:scale-[1.01]
                         active:scale-[0.99] transition"
            >
              Log into Account →
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden md:flex flex-col justify-center items-center 
                text-white bg-gradient-to-br bg-[#7861E6]
                p-16 rounded-l-[40px]">

        {/* Illustration */}
        <img
          src="/images/login.png"
          alt="illustration"
          className="h-60 w-auto mb-10"
        />

        {/* Heading */}
        <h2 className="text-4xl font-bold text-center leading-snug mb-6">
          Manage every conversation <br /> with precision.
        </h2>

        {/* Description */}
        <p className="text-center text-white/80 max-w-lg leading-relaxed mb-12">
          CallSync helps enterprise teams track, route, and resolve
          customer queries with powerful automated workflows and
          real-time analytics.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-8 text-sm w-full max-w-lg">

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 flex items-center justify-center rounded-full border border-white/60 text-xs">
              ✓
            </span>
            <div>
              <p className="font-semibold">Real-time Tracking</p>
              <p className="text-white/70 text-xs">Monitor calls as they happen.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 flex items-center justify-center rounded-full border border-white/60 text-xs">
              ✓
            </span>
            <div>
              <p className="font-semibold">Smart Routing</p>
              <p className="text-white/70 text-xs">Automated transfer logic.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 flex items-center justify-center rounded-full border border-white/60 text-xs">
              ✓
            </span>
            <div>
              <p className="font-semibold">Advanced Reports</p>
              <p className="text-white/70 text-xs">Data-driven insights.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-5 h-5 flex items-center justify-center rounded-full border border-white/60 text-xs">
              ✓
            </span>
            <div>
              <p className="font-semibold">Secure & Compliant</p>
              <p className="text-white/70 text-xs">Enterprise-grade security.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}