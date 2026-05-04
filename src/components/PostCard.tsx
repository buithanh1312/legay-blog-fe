import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../utils/time";

type Props = {
  post: any;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onLike?: (post: any) => void;
};

/** Strip markdown syntax for a clean text preview */
function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(data:[^)]+\)/g, "")
    .replace(/!\[.*?\]\([^)]+\)/g, "[image]")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

function extractFirstImage(content: string): string | null {
  const m = content.match(/!\[[^\]]*\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/);
  return m ? m[1] : null;
}

export default function PostCard({ post, isOwner, onEdit, onDelete, onPublish, onLike }: Props) {
  const navigate = useNavigate();
  const fullPreview = stripMarkdown(post.content || "");
  const thumbnail = extractFirstImage(post.content || "");

  const PREVIEW_MAX = 120;
  const truncated = fullPreview.length > PREVIEW_MAX;
  const previewText = truncated ? fullPreview.slice(0, PREVIEW_MAX) + "…" : fullPreview;
  const tags: string[] = post.tags ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
  const [liked, setLiked]         = useState<boolean>(post.likedByMe || false);
  const [likeCount, setLikeCount] = useState<number>(post.likeCount ?? 0);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => next ? c + 1 : Math.max(0, c - 1));
    onLike?.({ ...post, likedByMe: liked });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="border rounded-2xl shadow-sm bg-white hover:shadow-md transition overflow-hidden">

      {/* CLICKABLE AREA */}
      <div onClick={() => navigate(`/posts/${post.id}`)} className="cursor-pointer p-5 flex gap-4 items-start">

        {/* TEXT */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 leading-snug">{post.title}</h3>

          <p className="text-gray-500 text-sm mt-1.5">
            {previewText || "No content"}
            {truncated && (
              <span className="text-[#6B2515] font-medium ml-1 text-xs">Read more →</span>
            )}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[10px] bg-[#6B2515]/10 text-[#6B2515] px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
              {tags.length > 4 && <span className="text-[10px] text-gray-400">+{tags.length - 4}</span>}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              post.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
              {post.status}
            </span>
            {post.author && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/users/${encodeURIComponent(post.author)}`); }}
                className="text-xs text-[#6B2515] hover:underline font-medium"
              >
                by {post.author}
              </button>
            )}
            {post.createdAt && <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>}
            {(post.viewCount ?? 0) > 0 && (
              <span className="text-xs text-gray-400">👁 {post.viewCount}</span>
            )}
          </div>
        </div>

        {/* THUMBNAIL */}
        {thumbnail && (
          <div className="w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
            <img src={thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* LIKE / SHARE / OWNER ACTIONS */}
      <div className="flex items-center justify-between px-5 pb-4 pt-1 border-t border-gray-50">

        {/* Like + Share */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm font-medium transition px-2 py-1 rounded-lg ${
              liked
                ? "text-red-500 bg-red-50 hover:bg-red-100"
                : "text-gray-400 hover:text-red-400 hover:bg-red-50"
            }`}
          >
            {liked ? "❤️" : "🤍"} <span>{likeCount}</span>
          </button>

          <button
            onClick={handleShare}
            title="Copy link"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#6B2515] hover:bg-gray-100 px-2 py-1 rounded-lg transition"
          >
            🔗 Share
          </button>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-4 text-sm">
            {post.status === "DRAFT" && (
              <button onClick={(e) => { e.stopPropagation(); onPublish?.(); }}
                className="text-green-600 hover:underline font-medium">Publish</button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              className="text-blue-500 hover:underline">Edit</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="text-red-500 hover:underline">Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
