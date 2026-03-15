import api from "../api/axios";
import type { LoginResponse, SignupResponse } from "../types/types";

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  signup: async (email: string, password: string): Promise<SignupResponse> => {
    const res = await api.post("/auth/signup", { email, password });
    return res.data;
  },

  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  },
};