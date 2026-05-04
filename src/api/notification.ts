import axios from "./axios";

export interface NotificationDTO {
  id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const getNotifications = () =>
  axios.get<NotificationDTO[]>("/notifications").then((r) => r.data);

export const getUnreadCount = () =>
  axios.get<number>("/notifications/unread-count").then((r) => r.data);

export const markRead = (id: number) =>
  axios.patch(`/notifications/${id}/read`).then((r) => r.data);

export const markAllRead = () =>
  axios.patch("/notifications/read-all").then((r) => r.data);
