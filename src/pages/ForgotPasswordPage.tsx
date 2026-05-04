import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/ui/AuthInput";
import AuthButton from "../components/ui/AuthButton";
import { forgotPassword } from "../api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    await forgotPassword(email);
    setMessage("If email exists, reset link sent.");
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
          Reset password
        </h2>

        {message && (
          <div className="text-green-500 text-sm mb-3">
            {message}
          </div>
        )}

        <AuthInput
          placeholder="Email"
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <AuthButton onClick={handleSubmit}>
          Send reset link
        </AuthButton>

        {/* BACK TO LOGIN */}
        <div className="mt-4 text-sm text-gray-500 text-center">
          Remember password?{" "}
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