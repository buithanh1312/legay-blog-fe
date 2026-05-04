import { Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/auth";

export default function ProtectedRoute({ children }: any) {
  if (!isTokenValid()) {
    // Clear any stale/expired token before redirecting to login
    localStorage.removeItem("accessToken");
    return <Navigate to="/" replace />;
  }

  return children;
}