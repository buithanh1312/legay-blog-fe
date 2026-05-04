import api from "./axios";

export const getComments = (postId: number) =>
  api.get(`/comments/post/${postId}`).then(res => res.data);

export const createComment = (data: any) =>
  api.post("/comments", data);

export const updateComment = (id: number, content: string) =>
  api.put(`/comments/${id}`, { content });

export const deleteComment = (id: number) =>
  api.delete(`/comments/${id}`);

export const likeComment = (id: number) =>
  api.post(`/comments/${id}/like`);

export const unlikeComment = (id: number) =>
  api.delete(`/comments/${id}/like`);

export const getCommentLikers = (id: number): Promise<string[]> =>
  api.get(`/comments/${id}/likers`).then(res => res.data);