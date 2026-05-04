import API from "./axios";

export interface PublicUserProfile {
  id: number;
  username: string;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  following: boolean;
  followedBy: boolean;
  joinedAt: string | null;
}

export const getProfile = async () => {
  const res = await API.get("/users/me");
  return res.data;
};

export const updateProfile = async (data: { username: string; bio?: string }) => {
  const res = await API.put("/users/me", data);
  return res.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  const res = await API.post("/users/me/change-password", data);
  return res.data;
};

export const getPublicProfile = async (username: string): Promise<PublicUserProfile> => {
  const res = await API.get(`/users/${encodeURIComponent(username)}/profile`);
  return res.data;
};

export const getUserPosts = async (username: string): Promise<any[]> => {
  const res = await API.get(`/users/${encodeURIComponent(username)}/posts`);
  return res.data;
};
