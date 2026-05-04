import axios from "./axios";
import api from "./axios";

export const login = async (data: any) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const register = async (data: any) => {
  return axios.post("http://localhost:8080/api/auth/register", data);
};

export const forgotPassword = async (email: string) => {
  return axios.post("http://localhost:8080/api/auth/forgot-password", { email });
};