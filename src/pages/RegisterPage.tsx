import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/ui/AuthInput";
import AuthButton from "../components/ui/AuthButton";
import { register } from "../api/auth";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async () => {
    if (loading) return;
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, username });
      navigate("/");
    } catch (e: any) {
      setError(e.response?.data?.message || "Register failed");
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
          Create account
        </h2>

        {error && (
          <div className="text-red-500 text-sm mb-3">
            {error}
          </div>
        )}

        <AuthInput
          placeholder="Email"
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <AuthInput
          placeholder="Username"
          onChange={(e: any) => setUsername(e.target.value)}
        />

        <AuthInput
          type="password"
          placeholder="Password"
          onChange={(e: any) => setPassword(e.target.value)}
        />

        <AuthInput
          type="password"
          placeholder="Confirm password"
          onChange={(e: any) => setConfirm(e.target.value)}
        />

        <AuthButton onClick={handleRegister} disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </AuthButton>

        <div className="mt-4 text-sm text-gray-500 text-center">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/")}
            className="cursor-pointer hover:text-[#6B2515]"
          >
            Login
          </span>
        </div>

      </AuthLayout>
    </motion.div>
  );
}