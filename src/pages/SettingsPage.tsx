import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getProfile, updateProfile, changePassword } from "../api/user";

type Status = { type: "success" | "error"; message: string } | null;

export default function SettingsPage() {
  const [email,       setEmail]       = useState("");
  const [username,    setUsername]    = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currPwd,     setCurrPwd]     = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [pwdStatus,     setPwdStatus]     = useState<Status>(null);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setEmail(p.email);
      setUsername(p.username);
      setNewUsername(p.username);
    }).catch(() => {});
  }, []);

  const handleUpdateProfile = async () => {
    if (!newUsername.trim()) return;
    setLoading(true); setProfileStatus(null);
    try {
      await updateProfile({ username: newUsername.trim() });
      setUsername(newUsername.trim());
      localStorage.setItem("username", newUsername.trim());
      setProfileStatus({ type: "success", message: "Username updated successfully!" });
    } catch (e: any) {
      setProfileStatus({ type: "error", message: e?.response?.data?.error || e?.response?.data?.message || "Failed to update username" });
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!currPwd || !newPwd) return;
    if (newPwd !== confirmPwd) {
      setPwdStatus({ type: "error", message: "New passwords do not match" });
      return;
    }
    if (newPwd.length < 6) {
      setPwdStatus({ type: "error", message: "Password must be at least 6 characters" });
      return;
    }
    setLoading(true); setPwdStatus(null);
    try {
      await changePassword({ currentPassword: currPwd, newPassword: newPwd });
      setCurrPwd(""); setNewPwd(""); setConfirmPwd("");
      setPwdStatus({ type: "success", message: "Password changed successfully!" });
    } catch (e: any) {
      setPwdStatus({ type: "error", message: e?.response?.data?.error || e?.response?.data?.message || "Incorrect current password" });
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">⚙️ Account Settings</h1>

        {/* ── PROFILE INFO ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Profile</h2>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Email (read-only)</label>
            <input
              readOnly
              value={email}
              className="w-full border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-400 bg-gray-50 cursor-default"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-[#6B2515] transition"
            />
          </div>

          {profileStatus && (
            <p className={`text-sm mb-3 ${profileStatus.type === "success" ? "text-green-600" : "text-red-500"}`}>
              {profileStatus.message}
            </p>
          )}

          <button
            onClick={handleUpdateProfile}
            disabled={loading || !newUsername.trim() || newUsername.trim() === username}
            className="px-5 py-2 bg-[#6B2515] text-white text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition"
          >
            Save username
          </button>
        </section>

        {/* ── CHANGE PASSWORD ──────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Change Password</h2>

          {[
            { label: "Current password", value: currPwd, onChange: setCurrPwd },
            { label: "New password",     value: newPwd,  onChange: setNewPwd  },
            { label: "Confirm new password", value: confirmPwd, onChange: setConfirmPwd },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input
                type="password"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-[#6B2515] transition"
              />
            </div>
          ))}

          {pwdStatus && (
            <p className={`text-sm mb-3 ${pwdStatus.type === "success" ? "text-green-600" : "text-red-500"}`}>
              {pwdStatus.message}
            </p>
          )}

          <button
            onClick={handleChangePassword}
            disabled={loading || !currPwd || !newPwd || !confirmPwd}
            className="px-5 py-2 bg-[#6B2515] text-white text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition"
          >
            Change password
          </button>
        </section>
      </div>
    </Layout>
  );
}
