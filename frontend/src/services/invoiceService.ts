import api from "../api/axios";
import type { Invoice } from "../types/types";

function getBase(): string {
  const role = localStorage.getItem("role");
  return role === "ADMIN" ? "/admin/invoices" : "/user/invoices";
}

interface CreateInvoiceData {
  userId?:     string; // only required for ADMIN
  amount:      number;
  description: string;
}

export const invoiceService = {
  getAll: async (): Promise<Invoice[]> => {
    const res = await api.get(getBase());
    return res.data;
  },

  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const res = await api.post(getBase(), data);
    return res.data;
  },

  update: async (id: string, data: CreateInvoiceData): Promise<Invoice> => {
    const res = await api.put(`${getBase()}/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${getBase()}/${id}`);
  },
};