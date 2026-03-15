// ─────────────────────────────────────────────────────────────
// src/types.ts — SHARED TYPES
//
// WHY THIS EXISTS:
// The original codebase defined the same interfaces (User, Invoice,
// Product) in every single page file. That means if the API ever
// changes a field — say `amount` becomes `totalAmount` — you'd have
// to find and update 4+ files. Defining them once here means you
// change it in one place and everything stays in sync.
//
// USAGE:
// import type { User, Invoice, Product } from "../types";
// ─────────────────────────────────────────────────────────────

export type Role = "ADMIN" | "USER";

export interface User {
  id:        string;
  email:     string;
  role:      Role;
  createdAt: string;
}

export interface Product {
  id:          string;
  name:        string;
  description: string;
  price:       number;
}

export interface Invoice {
  id:          string;
  userId:      string;
  amount:      number;
  description: string;
  createdAt:   string;
  user?:       User;       // populated when admin fetches invoices
  status?:     InvoiceStatus;
}

export type InvoiceStatus = "Paid" | "Pending" | "Overdue";

// Auth responses
export interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  user:         Pick<User, "id" | "email" | "role">;
}

export interface SignupResponse {
  id:    string;
  email: string;
  role:  Role;
}