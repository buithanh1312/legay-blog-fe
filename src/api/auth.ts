import axios from "./axios";
import api from "./axios";

export const login = async (data: any) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const register = async (data: any) => {
  return api.post("/auth/register", data);
};

export const forgotPassword = async (email: string) => {
  return api.post("/auth/forgot-password", { email });
};