import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import PostModal from "../components/PostModal";
import Sidebar from "../components/Sidebar";
import LeftPanel from "../components/LeftPanel";

import { getPosts, createPost, likePost, unlikePost, getPopularTags, getTrendingPosts } from "../api/post";
import type { TrendingPost } from "../api/post";

type SuggestedAuthor = { username: string; postCount: number; totalLikes: number };

type Tab = "all" | "newest" | "mostLiked" | "mostViewed";

const TABS: { id: Tab; label: string }[] = [
  { id: "all",        label: "🗂 All Posts"   },
  { id: "newest",     label: "🆕 Newest"      },
  { id: "mostLiked",  label: "🔥 Most Liked"  },
  { id: "mostViewed", label: "👁 Most Viewed"  },
];

export default function PostPage() {
  const [posts,         setPosts]         = useState<any[]>([]);
  const [popularTags,   setPopularTags]   = useState<{ tag: string; count: number }[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [open,          setOpen]          = useState(false);
  const [tab,           setTab]           = useState<Tab>("all");
  const [activeTag,     setActiveTag]     = useState<string | undefined>(undefined);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() ?? "";

  useEffect(() => { loadPosts(); }, []);

  useEffect(() => {
    getPopularTags(10).then(setPopularTags).catch(() => {});
    getTrendingPosts(5).then(setTrendingPosts).catch(() => {});
  }, []);

  // Refresh post list every 30s for real-time view count updates
  useEffect(() => {
    const timer = setInterval(loadPosts, 30_000);
    return () => clearInterval(timer);
  }, []);

  const loadPosts = async () => {
    const res = await getPosts();
    setPosts(res.content ?? []);
  };

  const handleCreate = async (data: any) => {
    await createPost(data);
    setOpen(false);
    loadPosts();
  };

  const handleLike = async (post: any) => {
    // post.likedByMe is the PRE-TOGGLE state (passed from PostCard)
    try {
      if (post.likedByMe) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch {
      // PostCard already shows optimistic state; silent fail is acceptable
    }
  };

  const displayed = useMemo(() => {
    let list = [...posts];
    if (query)      list = list.filter((p) => p.title?.toLowerCase().includes(query));
    if (activeTag)  list = list.filter((p) => {
      const tagsStr = (p.tags || "").toLowerCase();
      return tagsStr.split(",").map((t: string) => t.trim()).includes(activeTag.toLowerCase());
    });
    if (tab === "newest")     list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (tab === "mostLiked")  list = list.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    if (tab === "mostViewed") list = list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    return list;
  }, [posts, tab, query, activeTag]);

  // Derive suggested authors from post list (aggregated by username, sorted by post count)
  const suggestedAuthors = useMemo<SuggestedAuthor[]>(() => {
    const map = new Map<string, { postCount: number; totalLikes: number }>();
    posts.forEach((p) => {
      if (!p.author) return;
      const entry = map.get(p.author) ?? { postCount: 0, totalLikes: 0 };
      entry.postCount += 1;
      entry.totalLikes += p.likeCount ?? 0;
      map.set(p.author, entry);
    });
    return Array.from(map.entries())
      .map(([username, stats]) => ({ username, ...stats }))
      .sort((a, b) => b.postCount - a.postCount || b.totalLikes - a.totalLikes);
  }, [posts]);

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 pt-6 flex gap-5 items-start">

        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <LeftPanel activeTag={activeTag} onTagClick={(t) => setActiveTag((prev) => prev === t ? undefined : t)} popularTags={popularTags} trendingPosts={trendingPosts} />

        {/* ── MAIN ───────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Search result banner */}
          {query && (
            <div className="mb-4 text-sm text-gray-500 bg-white border rounded-xl px-4 py-2">
              Showing results for <span className="font-semibold text-gray-800">"{query}"</span>
              {" "}— {displayed.length} post{displayed.length !== 1 ? "s" : ""} found
            </div>
          )}

          {/* Active tag banner */}
          {activeTag && !query && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 bg-white border rounded-xl px-4 py-2">
              Filtered by tag: <span className="font-semibold text-[#6B2515]">#{activeTag}</span>
              <button onClick={() => setActiveTag(undefined)} className="ml-auto text-gray-400 hover:text-gray-700 text-xs">✕ Clear</button>
            </div>
          )}

          {/* Sub-menu tabs */}
          <div className="flex gap-1 mb-5 bg-white border rounded-xl p-1 w-fit">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === t.id ? "bg-[#6B2515] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
                }`}
              >{t.label}</button>
            ))}
          </div>

          {/* Post list */}
          {displayed.length === 0 ? (
            <p className="text-gray-400 text-center mt-20">No posts found</p>
          ) : (
            <div className="space-y-4">
              {displayed.map((post) => (
                <PostCard key={post.id} post={post} onLike={handleLike} />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ──────────────────────────────────────────────── */}
        <Sidebar onNewPost={() => setOpen(true)} suggestedAuthors={suggestedAuthors} />
      </div>

      {/* MODAL */}
      <PostModal open={open} onClose={() => setOpen(false)} onSubmit={handleCreate} />
    </Layout>
  );
}