export const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export const formatDateTime = (date: string) => {
    const d = new Date(date);

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const timeAgo = (date: string) => {
  if (!date) return "";

  // BE sends LocalDateTime without timezone (e.g. "2026-04-28T12:06:00.123456").
  // Append 'Z' only if no timezone info present so browser parses as UTC-compat.
  const normalized = /[Zz]|[+-]\d{2}:?\d{2}$/.test(date) ? date : date + "Z";
  const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);

  if (diff < 10)  return "just now";
  if (diff < 60)  return `${diff} seconds ago`;
  if (diff < 120) return "1 minute ago";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 7200) return "1 hour ago";
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return "yesterday";
  return `${Math.floor(diff / 86400)} days ago`;
};