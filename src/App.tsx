import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PostPage from "./pages/PostPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PostDetailPage from "./pages/PostDetailPage";
import SettingsPage from "./pages/SettingsPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import MyPostsPage from "./pages/MyPostPage";
import { isTokenValid } from "./utils/auth";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Redirect to /posts if token is still valid */}
        <Route
          path="/"
          element={isTokenValid() ? <Navigate to="/posts" replace /> : <LoginPage />}
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/posts"
          element={
            <ProtectedRoute>
              <PostPage />
            </ProtectedRoute>
          }
        />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route
          path="/my-posts"
          element={<ProtectedRoute><MyPostsPage /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
        />
        <Route
          path="/messages"
          element={<ProtectedRoute><MessagesPage /></ProtectedRoute>}
        />
        <Route
          path="/users/:username"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
