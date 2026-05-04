import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import { getPublicProfile, getUserPosts, type PublicUserProfile } from "../api/user";
import { followUser, unfollowUser } from "../api/follow";
import { startConversation } from "../api/message";
import { timeAgo } from "../utils/time";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("username") || "";

  const [profile,  setProfile]  = useState<PublicUserProfile | null>(null);
  const [posts,    setPosts]     = useState<any[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState("");

  const isMe = username?.toLowerCase() === currentUser.toLowerCase();

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      getPublicProfile(username),
      getUserPosts(username),
    ])
      .then(([prof, userPosts]) => {
        setProfile(prof);
        setPosts(userPosts);
      })
      .catch(() => setError("User not found."))
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.following) {
        await unfollowUser(profile.username);
        setProfile({ ...profile, following: false, followedBy: profile.followedBy, followerCount: profile.followerCount - 1 });
      } else {
        await followUser(profile.username);
        setProfile({ ...profile, following: true, followerCount: profile.followerCount + 1 });
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    setMsgLoading(true);
    try {
      const conv = await startConversation(profile.username);
      navigate(`/messages?with=${encodeURIComponent(profile.username)}`);
    } catch {
      alert("You must follow each other to start a conversation.");
    } finally {
      setMsgLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center mt-32 text-gray-400">Loading…</div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center mt-32 text-gray-400">{error || "User not found"}</div>
      </Layout>
    );
  }

  const isMutual = profile.following && profile.followedBy;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">

        {/* ── PROFILE CARD ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex items-start gap-5">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#6B2515] text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 select-none">
              {profile.username.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{profile.username}</h1>
                {isMutual && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    👥 Friends
                  </span>
                )}
              </div>

              {profile.bio ? (
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{profile.bio}</p>
              ) : (
                !isMe && <p className="text-sm text-gray-400 mt-1 italic">No bio yet.</p>
              )}

              {profile.joinedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  📅 Joined {timeAgo(profile.joinedAt)}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-5 mt-3">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{profile.postCount}</p>
                  <p className="text-xs text-gray-400">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{profile.followerCount}</p>
                  <p className="text-xs text-gray-400">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{profile.followingCount}</p>
                  <p className="text-xs text-gray-400">Following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isMe && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50 ${
                  profile.following
                    ? "border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500"
                    : "bg-[#6B2515] text-white hover:opacity-90"
                }`}
              >
                {profile.following ? (isMutual ? "👥 Friends · Unfollow" : "Following · Unfollow") : "+ Follow"}
              </button>

              {isMutual && (
                <button
                  onClick={handleMessage}
                  disabled={msgLoading}
                  className="px-5 py-2 rounded-full text-sm font-semibold border border-[#6B2515] text-[#6B2515] hover:bg-[#6B2515] hover:text-white transition disabled:opacity-50"
                >
                  💬 Message
                </button>
              )}
            </div>
          )}

          {isMe && (
            <button
              onClick={() => navigate("/settings")}
              className="mt-4 px-5 py-2 rounded-full text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* ── POSTS ──────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            📝 Posts ({posts.length})
          </h2>
          {posts.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No published posts yet.</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
