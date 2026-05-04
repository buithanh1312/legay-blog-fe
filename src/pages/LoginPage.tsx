import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/ui/AuthInput";
import AuthButton from "../components/ui/AuthButton";
import { login } from "../api/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // If already logged in with a valid (non-expired) token, skip to posts
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (typeof payload.exp === "number" && payload.exp * 1000 > Date.now()) {
        navigate("/posts", { replace: true });
      } else {
        // Expired token — clean it up
        localStorage.removeItem("accessToken");
      }
    } catch {
      localStorage.removeItem("accessToken");
    }
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await login({ email, password });

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("email", email);
      localStorage.setItem("username", res.username);

      navigate("/posts");
    } catch (e: any) {
      setError(
        e.response?.data?.message || "Invalid email or password"
      );
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.3 }}
    >
      <AuthLayout>

        <h2 className="text-2xl font-semibold mb-6">
          Welcome back
        </h2>

        {error && (
          <div className="text-red-500 text-sm mb-3 text-center">
            {error}
          </div>
        )}

        <AuthInput
          placeholder="Email"
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <AuthInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
        />

        <AuthButton onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </AuthButton>

        {/* LINKS */}
        <div className="mt-3 text-sm text-gray-500 text-center">

          <div
            onClick={() => navigate("/forgot-password")}
            className="cursor-pointer hover:text-[#6B2515] transition mb-2"
          >
            Forgot password?
          </div>

          <div>
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="cursor-pointer hover:text-[#6B2515]"
            >
              Sign up
            </span>
          </div>

        </div>

      </AuthLayout>
    </motion.div>
  );
}