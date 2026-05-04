import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useNotifications } from "../api/useNotifications";
import { timeAgo } from "../utils/time";
import { searchUsers, followUser, unfollowUser, type UserSearchResult } from "../api/follow";

export default function Navbar() {
  const [open,         setOpen]         = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [query,        setQuery]        = useState("");
  const [userResults,  setUserResults]  = useState<UserSearchResult[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const navigate   = useNavigate();
  const notifRef   = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Close panels on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced unified search — searches users; posts searched via navigate on submit
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!q.trim()) { setUserResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await searchUsers(q.trim());
        setUserResults(res);
        const map: Record<string, boolean> = {};
        res.forEach((u) => { map[u.username] = u.following; });
        setFollowingMap((prev) => ({ ...prev, ...map }));
      } catch { setUserResults([]); }
    }, 350);
  }, []);

  const handleFollowToggle = async (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFollowing = followingMap[username] ?? false;
    setFollowingMap((p) => ({ ...p, [username]: !isFollowing }));
    try {
      if (isFollowing) await unfollowUser(username);
      else await followUser(username);
    } catch {
      setFollowingMap((p) => ({ ...p, [username]: isFollowing }));
    }
  };

  const username = localStorage.getItem("username") || "U";
  const initial  = username.charAt(0).toUpperCase();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/posts?q=${encodeURIComponent(q)}` : "/posts");
    setSearchFocused(false);
  };

  const showDropdown = searchFocused && query.trim().length > 0;

  return (
    <div className="flex items-center justify-between gap-4 px-6 h-14 border-b bg-white sticky top-0 z-40">

      {/* LOGO */}
      <div onClick={() => navigate("/posts")} className="cursor-pointer flex-shrink-0 overflow-hidden" style={{ height: "56px" }}>
        <img
          src={logo}
          style={{ height: "130px", width: "auto", marginTop: "-30px" }}
          className="transition-transform duration-200 hover:scale-105 object-contain"
          alt="LegayBlog"
        />
      </div>

      {/* UNIFIED SEARCH BOX */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search posts or people…"
              className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-[#6B2515] focus:bg-white transition"
            />
          </div>
        </form>

        {/* Unified dropdown */}
        {showDropdown && (
          <div className="absolute top-full mt-1 left-0 w-full min-w-[280px] bg-white shadow-xl rounded-xl border z-50 overflow-hidden">
            {/* Posts section */}
            <div className="px-3 pt-2 pb-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Posts</p>
              <button
                onClick={() => { navigate(`/posts?q=${encodeURIComponent(query.trim())}`); setSearchFocused(false); }}
                className="w-full text-left text-sm text-[#6B2515] hover:bg-gray-50 px-2 py-1.5 rounded-lg transition"
              >
                🔍 Search posts for &ldquo;{query}&rdquo;
              </button>
            </div>
            <div className="border-t my-1" />
            {/* People section */}
            <div className="px-3 pb-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">People</p>
              {userResults.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 py-1.5 italic">No users found</p>
              ) : (
                userResults.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => { navigate(`/users/${encodeURIComponent(u.username)}`); setSearchFocused(false); setQuery(""); }}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#6B2515]/20 text-[#6B2515] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-gray-800 truncate">{u.username}</span>
                    <button
                      onClick={(e) => handleFollowToggle(u.username, e)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition flex-shrink-0 ${
                        followingMap[u.username]
                          ? "border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500"
                          : "border-[#6B2515] text-[#6B2515] hover:bg-[#6B2515] hover:text-white"
                      }`}
                    >
                      {followingMap[u.username] ? "Unfollow" : "Follow"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ICONS + AVATAR — grouped together */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* MESSAGES */}
        <button
          onClick={() => navigate("/messages")}
          className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition text-lg"
          title="Messages"
        >
          💬
        </button>

        {/* BELL */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition text-lg"
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl border z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm text-gray-800">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#6B2515] hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-[#fdf6f0]" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">
                          {n.type === "COMMENT"      ? "💬"
                           : n.type === "REPLY"      ? "↩️"
                           : n.type === "POST_LIKE"  ? "❤️"
                           : n.type === "COMMENT_LIKE" ? "👍"
                           : n.type === "FOLLOW"     ? "👤"
                           : n.type === "NEW_POST"   ? "📝"
                           : "🔔"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#6B2515] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* AVATAR + DROPDOWN */}
        <div className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="w-9 h-9 rounded-full bg-[#6B2515] text-white flex items-center justify-center cursor-pointer text-sm font-semibold select-none"
          >
            {initial}
          </div>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-xl border overflow-hidden z-50">
              <div className="px-4 py-3 text-sm font-medium text-gray-800 border-b">{username}</div>

              <div onClick={() => { navigate("/my-posts"); setOpen(false); }}
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2">
                📝 My Posts
              </div>

              <div onClick={() => { navigate("/messages"); setOpen(false); }}
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2">
                💬 Messages
              </div>

              <div onClick={() => { navigate("/settings"); setOpen(false); }}
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2">
                ⚙️ Account Settings
              </div>

              <div className="border-t" />

              <div
                onClick={() => { localStorage.removeItem("accessToken"); localStorage.removeItem("username"); navigate("/"); }}
                className="px-4 py-3 text-red-500 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
              >
                🚪 Logout
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
