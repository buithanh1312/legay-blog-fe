import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Layout from "../components/Layout";
import CommentItem from "../components/CommentItem";
import PostModal from "../components/PostModal";
import {
  getComments,
  createComment,
  deleteComment,
  updateComment,
  likeComment,
  unlikeComment,
} from "../api/comment";
import { getPost, deletePost, updatePost, likePost, unlikePost, getPostLikers, recordView } from "../api/post";
import { formatDateTime } from "../utils/time";

// Module-level set persists across React StrictMode double-mount — prevents +2 views
const recordedViews = new Set<number>();

const updateLikeInTree = (comments: any[], commentId: number, liked: boolean): any[] =>
  comments.map((c) => {
    if (c.id === commentId) {
      return { ...c, likedByMe: liked, likeCount: liked ? c.likeCount + 1 : c.likeCount - 1 };
    }
    if (c.replies?.length > 0) {
      return { ...c, replies: updateLikeInTree(c.replies, commentId, liked) };
    }
    return c;
  });

export default function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const navigate = useNavigate();

  const [post,     setPost]     = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [content,  setContent]  = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [postLiked,     setPostLiked]     = useState(false);
  const [postLikeCount, setPostLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [postLikers, setPostLikers] = useState<string[]>([]);
  const [showPostLikers, setShowPostLikers] = useState(false);
  const postLikersRef = useRef<HTMLDivElement>(null);

  const username = localStorage.getItem("username") || "U";

  useEffect(() => {
    loadPost();
    loadComments();

    // Module-level set prevents double-recording in React StrictMode
    if (!recordedViews.has(postId)) {
      recordedViews.add(postId);
      recordView(postId).catch(() => {});
    }
  }, [id]);

  // Close likers panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (postLikersRef.current && !postLikersRef.current.contains(e.target as Node)) {
        setShowPostLikers(false);
      }
    }
    if (showPostLikers) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPostLikers]);

  const loadPost = async () => {
    const res = await getPost(postId);
    setPost(res);
    setPostLiked(res.likedByMe ?? false);
    setPostLikeCount(res.likeCount ?? 0);
  };

  const loadComments = async () => {
    const res = await getComments(postId);
    setComments(res);
  };

  const handleCreate = async () => {
    if (!content.trim()) return;
    try {
      await createComment({ postId, content, parentId: null });
      setContent("");
      await loadComments();
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to post comment");
    }
  };

  const handleReply = async (parentId: number, replyContent: string) => {
    if (!replyContent.trim()) return;
    try {
      await createComment({ postId, content: replyContent, parentId });
      await loadComments();
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to post reply");
    }
  };

  const handleLikeComment = async (c: any) => {
    const newLiked = !c.likedByMe;
    setComments((prev) => updateLikeInTree(prev, c.id, newLiked));
    try {
      if (c.likedByMe) await unlikeComment(c.id); else await likeComment(c.id);
    } catch (err: any) {
      setComments((prev) => updateLikeInTree(prev, c.id, !newLiked));
      const status = err?.response?.status;
      if (status !== 400 && status !== 429) console.error("Like error:", err?.response?.data || err.message);
    }
  };

  const handleLikePost = async () => {
    const next = !postLiked;
    setPostLiked(next);
    setPostLikeCount((c) => next ? c + 1 : Math.max(0, c - 1));
    try {
      if (postLiked) await unlikePost(postId); else await likePost(postId);
    } catch {
      setPostLiked(!next);
      setPostLikeCount((c) => next ? Math.max(0, c - 1) : c + 1);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    await deletePost(postId);
    navigate("/posts");
  };

  const handleEditPost = async (data: { title: string; content: string; tags?: string }) => {
    await updatePost(postId, data);
    loadPost();
  };

  if (!post) return <Layout>Loading...</Layout>;

  const isPostOwner = post.isOwner || post.owner;
  const tags: string[] = post.tags ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

  return (
    <Layout>
      {/* Owner actions */}
      {isPostOwner && (
        <div className="max-w-2xl mx-auto px-4 flex justify-end gap-2 mt-4">
          <button onClick={() => setEditOpen(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition">
            ✏️ Edit post
          </button>
          <button onClick={handleDeletePost}
            className="px-3 py-1.5 text-sm rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition">
            🗑 Delete post
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-4">
        <h1 className="text-3xl font-bold text-center">{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <div className="text-gray-500 text-sm">
              Posted at: {formatDateTime(post.createdAt)} • By{" "}
              <button
                onClick={() => navigate(`/users/${encodeURIComponent(post.author)}`)}
                className="text-[#6B2515] hover:underline font-medium"
              >
                {post.author}
              </button>
            </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>👁 {post.viewCount ?? 0} views</span>
            <span>❤️ {postLikeCount} likes</span>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-[#6B2515]/10 text-[#6B2515] font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="mt-6 markdown-content">
          <ReactMarkdown
            urlTransform={(url) => url}
            components={{ img: ({ src, alt }) => (
              <img src={src} alt={alt} className="max-w-full rounded-lg my-3 max-h-[480px] object-contain" />
            )}}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Like / Share bar */}
        <div className="flex items-center gap-3 mt-6 py-4 border-y border-gray-100">
          {/* Like button */}
          <button
            onClick={handleLikePost}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
              postLiked ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {postLiked ? "❤️" : "🤍"}
          </button>

          {/* Like count + likers popover */}
          <div className="relative" ref={postLikersRef}>
            <button
              onClick={async () => {
                if (!showPostLikers) {
                  const data = await getPostLikers(postId);
                  setPostLikers(data);
                }
                setShowPostLikers((v) => !v);
              }}
              className="text-sm text-gray-500 hover:text-[#6B2515] hover:underline transition"
            >
              {postLikeCount} {postLikeCount === 1 ? "like" : "likes"}
            </button>

            {showPostLikers && (
              <div className="absolute left-0 top-8 z-50 bg-white border rounded-xl shadow-lg py-2 px-3 min-w-[160px] max-w-[240px]">
                {postLikers.length === 0 ? (
                  <p className="text-xs text-gray-400">No likes yet</p>
                ) : (
                  <>
                    <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Liked by</p>
                    {postLikers.map((name) => (
                      <div key={name} className="flex items-center gap-2 py-0.5">
                        <span className="w-6 h-6 rounded-full bg-[#6B2515] text-white text-xs flex items-center justify-center font-bold">
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-700 truncate">{name}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition ml-auto"
          >
            {copied ? "✅ Copied!" : "🔗 Share"}
          </button>
        </div>

        <hr className="my-6" />

        {/* Comment input */}
        <div className="flex gap-3 items-center">
          <div className="w-8 h-8 rounded-full bg-[#6B2515] text-white flex items-center justify-center text-sm">
            {username.charAt(0).toUpperCase()}
          </div>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 border border-gray-300 bg-white text-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#6B2515]"
            placeholder="Write a comment..."
          />
          <button disabled={!content.trim()} onClick={handleCreate}
            className="bg-[#6B2515] text-white px-4 py-1 rounded-full disabled:bg-gray-300 text-sm">
            Post
          </button>
        </div>

        {/* Comments */}
        <div className="mt-6 pb-10">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              onLike={handleLikeComment}
              onDelete={async (cid: number) => { await deleteComment(cid); await loadComments(); }}
              onReply={handleReply}
              onUpdate={async (cid: number, txt: string) => { await updateComment(cid, txt); await loadComments(); }}
            />
          ))}
        </div>
      </div>

      <PostModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={post}
        onSubmit={handleEditPost}
      />
    </Layout>
  );
}
