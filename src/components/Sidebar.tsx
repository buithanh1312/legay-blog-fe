// Sidebar shown on the right of PostPage / MyPostPage
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { followUser, unfollowUser } from "../api/follow";

interface SuggestedAuthor {
  username: string;
  postCount: number;
  totalLikes: number;
}

interface SidebarProps {
  onNewPost?: () => void;
  suggestedAuthors?: SuggestedAuthor[];
}

export default function Sidebar({ onNewPost, suggestedAuthors = [] }: SidebarProps) {
  const username = localStorage.getItem("username") || "User";
  const currentUser = username.toLowerCase();
  const navigate = useNavigate();

  // Filter out self; show up to 5
  const authors = suggestedAuthors
    .filter((a) => a.username.toLowerCase() !== currentUser)
    .slice(0, 5);

  // Track follow state per author
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleFollow = async (targetUsername: string) => {
    const isFollowing = followingMap[targetUsername] ?? false;
    setLoadingMap((p) => ({ ...p, [targetUsername]: true }));
    try {
      if (isFollowing) {
        await unfollowUser(targetUsername);
        setFollowingMap((p) => ({ ...p, [targetUsername]: false }));
      } else {
        await followUser(targetUsername);
        setFollowingMap((p) => ({ ...p, [targetUsername]: true }));
      }
    } finally {
      setLoadingMap((p) => ({ ...p, [targetUsername]: false }));
    }
  };

  return (
    <aside className="w-72 flex-shrink-0 space-y-5">

      {/* Current user card */}
      <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#6B2515] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{username}</p>
          <p className="text-xs text-gray-400">Logged in</p>
        </div>
      </div>

      {/* New post CTA */}
      {onNewPost && (
        <button
          onClick={onNewPost}
          className="w-full bg-[#6B2515] hover:opacity-90 text-white rounded-2xl py-2.5 text-sm font-semibold transition"
        >
          + New Post
        </button>
      )}

      {/* Suggested authors */}
      <div className="bg-white rounded-2xl border p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">👥 Suggested Authors</p>
        {authors.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No authors yet</p>
        ) : (
          <div className="space-y-3">
            {authors.map((a) => {
              const isFollowing = followingMap[a.username] ?? false;
              const isLoading = loadingMap[a.username] ?? false;
              return (
                <div key={a.username} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#6B2515]/20 text-[#6B2515] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {a.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate(`/users/${encodeURIComponent(a.username)}`)}
                      className="text-sm font-medium text-gray-800 hover:text-[#6B2515] hover:underline truncate block text-left"
                    >
                      {a.username}
                    </button>
                    <p className="text-xs text-gray-400">
                      {a.postCount} post{a.postCount !== 1 ? "s" : ""}
                      {a.totalLikes > 0 ? ` · ❤️ ${a.totalLikes}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFollow(a.username)}
                    disabled={isLoading}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition flex-shrink-0 ${
                      isFollowing
                        ? "border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500"
                        : "border-[#6B2515] text-[#6B2515] hover:bg-[#6B2515] hover:text-white"
                    } disabled:opacity-50`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 text-center px-2">
        LegayBlog © {new Date().getFullYear()}
      </p>
    </aside>
  );
}
