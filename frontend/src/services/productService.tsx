// ─────────────────────────────────────────────────────────────
// src/services/productService.ts
//
// WHY A SERVICES FOLDER:
// Components should handle UI and state — not know about API URLs,
// request shapes, or error parsing. A service layer separates those
// concerns cleanly.
//
// BEFORE (scattered in component):
//   const res = await api.get("/admin/products");
//   await api.post("/admin/products", { name, description, price });
//   await api.delete(`/admin/products/${id}`);
//
// AFTER (one import, clean calls):
//   const products = await productService.getAll();
//   await productService.create({ name, description, price });
//   await productService.remove(id);
//
// Now if the API path ever changes you update ONE file, not every
// component that touches products.
// ─────────────────────────────────────────────────────────────

import api from "../api/axios";
import type { Product } from "../types/types"

// Determine the correct base URL from the user's role
function getBase(): string {
  const role = localStorage.getItem("role");
  return role === "ADMIN" ? "/admin/products" : "/user/products";
}

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const res = await api.get(getBase());
    return res.data;
  },

  create: async (data: Omit<Product, "id">): Promise<Product> => {
    const res = await api.post(getBase(), data);
    return res.data;
  },

  update: async (id: string, data: Omit<Product, "id">): Promise<Product> => {
    const res = await api.put(`${getBase()}/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${getBase()}/${id}`);
  },
};