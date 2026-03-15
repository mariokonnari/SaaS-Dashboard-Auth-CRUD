import api from "../api/axios";
import type { User, Role } from "../types/types";

export const userService = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get("/admin/users");
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  updateRole: async (id: string, role: Role): Promise<User> => {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },
};