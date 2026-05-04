import API from "./axios";

// GET ALL POSTS
export const getPosts = async (page = 0, size = 10) => {
  const res = await API.get(`/posts?page=${page}&size=${size}`);
  return res.data;
};

// GET MY POSTS
export const getMyPosts = async () => {
  const res = await API.get("/posts/me");
  return res.data;
};

// GET DETAIL
export const getPost = async (id: string | number) => {
  const res = await API.get(`/posts/${id}`);
  return res.data;
};

// CREATE
export const createPost = async (data: any) => {
  const res = await API.post("/posts", data);
  return res.data;
};

// UPDATE
export const updatePost = async (id: number, data: any) => {
  const res = await API.put(`/posts/${id}`, data);
  return res.data;
};

// DELETE
export const deletePost = async (id: number) => {
  const res = await API.delete(`/posts/${id}`);
  return res.data;
};

// ✅ FIX CHÍNH Ở ĐÂY
export const publishPost = async (id: number) => {
  const res = await API.post(`/posts/${id}/publish`);
  return res.data;
};

// LIKE / UNLIKE POST
export const likePost = async (id: number) => {
  const res = await API.post(`/posts/${id}/like`);
  return res.data;
};

export const unlikePost = async (id: number) => {
  const res = await API.delete(`/posts/${id}/like`);
  return res.data;
};

export const getPostLikers = async (id: number): Promise<string[]> => {
  const res = await API.get(`/posts/${id}/likers`);
  return res.data;
};

export const recordView = async (id: number): Promise<void> => {
  await API.post(`/posts/${id}/view`);
};

export const getPopularTags = async (limit = 10): Promise<{ tag: string; count: number }[]> => {
  const res = await API.get(`/posts/popular-tags?limit=${limit}`);
  return res.data;
};

export interface TrendingPost {
  id: number;
  title: string;
  author: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  score: number;
}

export const getTrendingPosts = async (limit = 5): Promise<TrendingPost[]> => {
  const res = await API.get(`/posts/trending?limit=${limit}`);
  return res.data;
};