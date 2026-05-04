import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../utils/time";
import { getCommentLikers } from "../api/comment";

const DEFAULT_REPLIES_SHOWN = 2;

// Flatten the entire reply tree into a single ordered list (depth-first)
function flattenReplies(replies: any[]): any[] {
  const result: any[] = [];
  for (const r of replies) {
    result.push(r);
    if (r.replies?.length > 0) {
      result.push(...flattenReplies(r.replies));
    }
  }
  return result;
}

// Render content: highlight leading @mention in a different color
function CommentContent({ text }: { text: string }) {
  const mentionMatch = text.match(/^(@\S+)\s?(.*)/s);
  if (mentionMatch) {
    return (
      <span className="text-sm mt-1 break-words whitespace-pre-wrap">
        <span className="text-[#6B2515] font-medium">{mentionMatch[1]}</span>
        {mentionMatch[2] ? " " + mentionMatch[2] : ""}
      </span>
    );
  }
  return <span className="text-sm mt-1 break-words whitespace-pre-wrap">{text}</span>;
}

interface CommentItemProps {
  c: any;
  onLike: (c: any) => void;
  onDelete: (id: number) => Promise<void>;
  onReply: (parentId: number, content: string) => Promise<void>;
  onUpdate: (id: number, content: string) => Promise<void>;
  /** Visual nesting depth: 0 = root comment, 1 = reply (flat, no further nesting) */
  depth?: number;
  /** ID of the root-level comment — replies at depth>=1 go here to stay flat */
  rootId?: number;
}

export default function CommentItem({
  c,
  onLike,
  onDelete,
  onReply,
  onUpdate,
  depth = 0,
  rootId,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(c.content);
  const [saving, setSaving] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyValue, setReplyValue] = useState("");
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [likers, setLikers] = useState<string[]>([]);
  const [showLikers, setShowLikers] = useState(false);
  const likersRef = useRef<HTMLSpanElement>(null);
  const navigate = useNavigate();

  // Close likers panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (likersRef.current && !likersRef.current.contains(e.target as Node)) {
        setShowLikers(false);
      }
    }
    if (showLikers) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLikers]);

  // Keep value in sync with server content only when not editing
  useEffect(() => {
    if (!editing) setValue(c.content);
  }, [c.content, editing]);

  // BE: Lombok @Getter on `boolean isOwner` generates isOwner() → Jackson strips `is` → JSON key is `owner`
  const isOwner = !!(c?.isOwner || c?.owner);

  const cancelEdit = () => {
    setValue(c.content);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!value.trim() || saving) return;
    setSaving(true);
    try {
      await onUpdate(c.id, value);
      setEditing(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to save";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(c.id);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to delete";
      alert(msg);
    }
  };

  const openReply = () => {
    // At depth >= 1 (reply-of-reply), pre-fill with @author mention so sender knows who they're targeting
    if (depth >= 1) {
      setReplyValue(`@${c.author} `);
    } else {
      setReplyValue("");
    }
    setShowReply(!showReply);
  };

  const submitReply = async () => {
    if (!replyValue.trim()) return;
    // At depth >= 1: post to the root comment to keep all replies flat (TikTok style)
    const targetId = depth >= 1 ? rootId! : c.id;
    await onReply(targetId, replyValue);
    setReplyValue("");
    setShowReply(false);
  };

  // Flatten replies into ordered list — memoized so the ORDER never changes due to likes
  // We only re-flatten when the set of reply IDs changes (new reply added/deleted), not on like updates
  const replyIds = (c?.replies ?? []).map((r: any) => r.id).join(",");
  const flatReplies: any[] = useMemo(
    () => depth === 0 ? flattenReplies(c?.replies ?? []) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [depth, replyIds]
  );

  // Merge like updates into the stable flatReplies order without changing positions
  const mergedReplies = depth === 0
    ? flatReplies.map((r: any) => {
        // find the updated version of this reply from the live c.replies tree
        const findInTree = (replies: any[], id: number): any => {
          for (const reply of replies) {
            if (reply.id === id) return reply;
            if (reply.replies?.length > 0) {
              const found = findInTree(reply.replies, id);
              if (found) return found;
            }
          }
          return null;
        };
        return findInTree(c?.replies ?? [], r.id) ?? r;
      })
    : [];
  const hiddenCount = mergedReplies.length - DEFAULT_REPLIES_SHOWN;
  const visibleReplies = showAllReplies ? mergedReplies : mergedReplies.slice(0, DEFAULT_REPLIES_SHOWN);

  return (
    <div className="flex gap-3 mt-4">

      {/* AVATAR */}
      <div className="w-8 h-8 min-w-[32px] min-h-[32px] flex-shrink-0 rounded-full bg-[#6B2515] text-white flex items-center justify-center text-sm font-medium">
        {c.author?.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">

        {/* HEADER */}
        <div className="text-xs text-gray-400">
            <button
              onClick={() => navigate(`/users/${encodeURIComponent(c.author)}`)}
              className="text-[#6B2515] hover:underline font-medium"
            >
              {c.author}
            </button>{" "}
            • {timeAgo(c.createdAt)}
          </div>

        {/* CONTENT / EDIT INPUT */}
        {editing ? (
          <div className="flex items-center gap-1 mt-1">
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") cancelEdit();
              }}
              className="flex-1 border border-gray-300 bg-white text-gray-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#6B2515]"
            />
            <button
              onClick={cancelEdit}
              title="Cancel"
              className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="mt-1">
            <CommentContent text={c.content} />
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex gap-4 text-xs mt-1 items-center">
          {/* LIKE + LIKERS POPOVER */}
          <span className="relative" ref={likersRef}>
            <span
              onClick={() => onLike(c)}
              className={`cursor-pointer select-none transition-colors ${
                c.likedByMe ? "text-red-500" : "text-gray-400 hover:text-red-400"
              }`}
            >
              ♥
            </span>
            {c.likeCount > 0 ? (
              <span
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!showLikers) {
                    const data = await getCommentLikers(c.id);
                    setLikers(data);
                  }
                  setShowLikers((v) => !v);
                }}
                className="ml-1 cursor-pointer text-gray-500 hover:text-[#6B2515] hover:underline"
              >
                {c.likeCount}
              </span>
            ) : (
              <span className="ml-1 text-gray-400">0</span>
            )}
            {showLikers && likers.length > 0 && (
              <div className="absolute left-0 top-5 z-50 bg-white border rounded-xl shadow-lg py-2 px-3 min-w-[140px] max-w-[220px]">
                <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Liked by</p>
                {likers.map((name) => (
                  <div key={name} className="flex items-center gap-1.5 py-0.5">
                    <span className="w-5 h-5 rounded-full bg-[#6B2515] text-white text-[10px] flex items-center justify-center font-bold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-700 truncate">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </span>

          <span
            onClick={openReply}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            Reply
          </span>

          {isOwner && !editing && (
            <>
              <span
                onClick={() => { setValue(c.content); setEditing(true); }}
                className="cursor-pointer text-blue-400 hover:text-blue-600"
              >
                Edit
              </span>
              <span
                onClick={handleDelete}
                className="cursor-pointer text-red-400 hover:text-red-600"
              >
                Delete
              </span>
            </>
          )}

          {isOwner && editing && (
            <span
              onClick={handleSave}
              className="cursor-pointer text-green-500 hover:text-green-700 font-medium"
            >
              {saving ? "Saving..." : "Save"}
            </span>
          )}
        </div>

        {/* REPLY BOX */}
        {showReply && (
          <div className="flex gap-2 mt-2">
            <input
              value={replyValue}
              onChange={(e) => setReplyValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitReply();
                if (e.key === "Escape") { setShowReply(false); setReplyValue(""); }
              }}
              autoFocus
              className="flex-1 border border-gray-300 bg-white text-gray-800 rounded-full px-3 py-1 text-sm focus:outline-none focus:border-[#6B2515]"
              placeholder={depth >= 1 ? `Reply to @${c.author}...` : "Write a reply..."}
            />
            <button
              onClick={() => { setShowReply(false); setReplyValue(""); }}
              className="text-gray-400 hover:text-gray-600 text-base px-1"
              title="Cancel"
            >✕</button>
            <button
              disabled={!replyValue.trim()}
              onClick={submitReply}
              className="text-xs bg-[#6B2515] text-white px-3 rounded-full disabled:bg-gray-300"
            >
              Reply
            </button>
          </div>
        )}

        {/* REPLIES — flat list, collapsible (only rendered at depth=0) */}
        {depth === 0 && mergedReplies.length > 0 && (
          <div className="ml-4 border-l-2 border-gray-100 pl-4 mt-3">
            {visibleReplies.map((r: any) => (
              <CommentItem
                key={r.id}
                c={r}
                onLike={onLike}
                onDelete={onDelete}
                onReply={onReply}
                onUpdate={onUpdate}
                depth={1}
                rootId={c.id}
              />
            ))}

            {/* Expand / Collapse toggle */}
            {!showAllReplies && hiddenCount > 0 && (
              <button
                onClick={() => setShowAllReplies(true)}
                className="mt-2 text-xs text-[#6B2515] hover:underline"
              >
                ▼ View {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
              </button>
            )}
            {showAllReplies && mergedReplies.length > DEFAULT_REPLIES_SHOWN && (
              <button
                onClick={() => setShowAllReplies(false)}
                className="mt-2 text-xs text-gray-400 hover:underline"
              >
                ▲ Collapse replies
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}