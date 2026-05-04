import API from "./axios";

export interface UserSearchResult {
  id: number;
  username: string;
  following: boolean;
}

export const searchUsers = async (q: string): Promise<UserSearchResult[]> => {
  const res = await API.get(`/users/search?q=${encodeURIComponent(q)}`);
  return res.data;
};

export const followUser = async (username: string): Promise<void> => {
  await API.post(`/follows/${encodeURIComponent(username)}`);
};

export const unfollowUser = async (username: string): Promise<void> => {
  await API.delete(`/follows/${encodeURIComponent(username)}`);
};

export const followStatus = async (username: string): Promise<boolean> => {
  const res = await API.get(`/follows/${encodeURIComponent(username)}/status`);
  return res.data;
};
