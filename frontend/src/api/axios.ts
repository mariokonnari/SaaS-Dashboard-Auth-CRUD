// ─────────────────────────────────────────────────────────────
// src/api/axios.ts — IMPROVED
//
// CHANGES & WHY:
//
// 1. ADDED RESPONSE INTERCEPTOR — The original only had a request
//    interceptor (attaching the token). There was no response
//    interceptor, which means when a token expired the user would
//    get silent 401 errors — API calls just failing with no feedback
//    and no redirect to login. The response interceptor catches
//    every 401 and automatically clears storage + redirects.
//
// 2. REMOVED console.warn — "No token found in localStorage" was
//    logged on every request from public pages (login, signup).
//    That's noise. The request interceptor only needs to attach the
//    token if it exists — no warning needed.
//
// 3. AVOIDED REDIRECT LOOPS — We skip the auto-logout redirect if
//    the failing request was itself an auth endpoint (/auth/login,
//    /auth/signup), otherwise logging in with wrong credentials
//    would redirect you away from the login page.
// ─────────────────────────────────────────────────────────────

import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL:         API_BASE_URL + "/api",
  withCredentials: true,
});

// ── Request interceptor — attach JWT to every request ─────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // No console.warn — it's fine not to have a token on public pages
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle expired / invalid tokens ────
api.interceptors.response.use(
  // Pass successful responses straight through
  (response) => response,

  (error) => {
    const status  = error.response?.status;
    const url     = error.config?.url ?? "";

    // If we get a 401 and it's NOT from an auth endpoint,
    // the token has expired or been invalidated — log the user out.
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/signup");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      // Redirect to login — using window.location so it works
      // outside of React's router context (this file has no hooks)
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;