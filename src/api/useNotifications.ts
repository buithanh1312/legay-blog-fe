import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { NotificationDTO } from "./notification";
import {
  getNotifications,
  getUnreadCount,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
} from "./notification";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const clientRef = useRef<Client | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch {
      // Not authenticated yet — silently ignore
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    loadHistory();

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/user/queue/notifications", (frame) => {
          try {
            const notif: NotificationDTO = JSON.parse(frame.body);
            setNotifications((prev) => [notif, ...prev]);
            setUnreadCount((c) => c + 1);
          } catch {
            // ignore malformed frames
          }
        });
      },
      onStompError: () => {
        // Connection error — silent
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [loadHistory]);

  const markRead = useCallback(async (id: number) => {
    await apiMarkRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await apiMarkAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead };
}
