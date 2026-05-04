import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import PostModal from "../components/PostModal";
import Sidebar from "../components/Sidebar";

import { getMyPosts, createPost, updatePost, deletePost, publishPost } from "../api/post";

type Tab = "all" | "published" | "draft" | "newest";

const TABS: { id: Tab; label: string }[] = [
  { id: "all",       label: "🗂 All"       },
  { id: "published", label: "✅ Published" },
  { id: "draft",     label: "📝 Drafts"   },
  { id: "newest",    label: "🆕 Newest"   },
];

export default function MyPostsPage() {
  const [posts,       setPosts]       = useState<any[]>([]);
  const [open,        setOpen]        = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [tab,         setTab]         = useState<Tab>("all");

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    const data = await getMyPosts();
    setPosts(data ?? []);
  };

  const handleCreate = async (data: any) => {
    await createPost(data);
    setOpen(false);
    loadPosts();
  };

  const handleUpdate = async (data: any) => {
    if (!editingPost) return;
    await updatePost(editingPost.id, data);
    setEditingPost(null);
    setOpen(false);
    loadPosts();
  };

  const handleDelete = async (id: number) => { await deletePost(id);  loadPosts(); };
  const handlePublish = async (id: number) => { await publishPost(id); loadPosts(); };

  const displayed = useMemo(() => {
    let list = [...posts];
    if (tab === "published") list = list.filter((p) => p.status === "PUBLISHED");
    else if (tab === "draft") list = list.filter((p) => p.status === "DRAFT");
    else if (tab === "newest") list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [posts, tab]);

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 pt-6 flex gap-6 items-start">

        {/* ── MAIN ───────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Page header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold">My Posts</h2>
            <button
              onClick={() => { setEditingPost(null); setOpen(true); }}
              className="bg-[#6B2515] text-white px-5 py-2 rounded-lg hover:opacity-90 text-sm"
            >
              + New Post
            </button>
          </div>

          {/* Sub-menu tabs */}
          <div className="flex gap-1 mb-5 bg-white border rounded-xl p-1 w-fit">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === t.id
                    ? "bg-[#6B2515] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Post list */}
          {displayed.length === 0 ? (
            <p className="text-gray-400 text-center mt-20">No posts here</p>
          ) : (
            <div className="space-y-4">
              {displayed.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwner
                  onEdit={() => { setEditingPost(post); setOpen(true); }}
                  onDelete={() => handleDelete(post.id)}
                  onPublish={() => handlePublish(post.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
        <Sidebar />
      </div>

      {/* MODAL */}
      <PostModal
        open={open}
        onClose={() => { setOpen(false); setEditingPost(null); }}
        onSubmit={editingPost ? handleUpdate : handleCreate}
        initialData={editingPost}
      />
    </Layout>
  );
}