import { useNavigate } from "react-router-dom";
import type { TrendingPost } from "../api/post";

interface PopularTag {
  tag: string;
  count: number;
}

interface LeftPanelProps {
  activeTag?: string;
  onTagClick?: (tag: string) => void;
  popularTags?: PopularTag[];
  trendingPosts?: TrendingPost[];
}

export default function LeftPanel({ activeTag, onTagClick, popularTags = [], trendingPosts = [] }: LeftPanelProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-56 flex-shrink-0 space-y-5 sticky top-4 self-start">

      {/* Navigation */}
      <div className="bg-white rounded-2xl border p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Menu</p>
        {[
          { icon: "🏠", label: "All Posts",  path: "/posts"    },
          { icon: "📝", label: "My Posts",   path: "/my-posts" },
          { icon: "⚙️", label: "Settings",   path: "/settings" },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition text-left"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">🏷️ Popular Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {popularTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                  activeTag === tag
                    ? "bg-[#6B2515] text-white border-[#6B2515]"
                    : "text-gray-600 border-gray-200 hover:border-[#6B2515] hover:text-[#6B2515]"
                }`}
              >
                #{tag}
                <span className={`text-[10px] ${activeTag === tag ? "text-white/70" : "text-gray-400"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending (last 3 months) */}
      {trendingPosts.length > 0 && (
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">🔥 Trending</p>
          <p className="text-[10px] text-gray-300 -mt-2 mb-3">Last 3 months</p>
          <div className="space-y-3">
            {trendingPosts.map((post, i) => (
              <button
                key={post.id}
                onClick={() => navigate(`/posts/${post.id}`)}
                className="w-full flex items-start gap-2 text-left group"
              >
                <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug line-clamp-2 group-hover:text-[#6B2515] transition">
                    {post.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    👁 {post.viewCount} · ❤️ {post.likeCount} · 💬 {post.commentCount}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </aside>
  );
}
