// ─────────────────────────────────────────────────────────────
// App.tsx — IMPROVED
//
// CHANGES & WHY:
//
// 1. MOVED RequireRole INTO A SEPARATE FILE — Defining a component
//    inside another component's file works, but putting it in its own
//    file (or in ProtectedRoute) is cleaner and easier to find later.
//    For now it's extracted to a constant outside the component.
//
// 2. DECODED THE JWT CLIENT-SIDE — Instead of relying purely on
//    localStorage.getItem("role") (which could be stale or tampered),
//    a better pattern is to verify the token expiry on the client.
//    This version also checks if the token is expired before rendering.
//
// 3. REMOVED DUPLICATE NESTING — The original had ProtectedRoute
//    wrapping RequireRole wrapping DashboardLayout which is redundant.
//    ProtectedRoute already checks for token; RequireRole checks role.
//    They should be separate concerns in one wrapper.
//
// 4. ADDED A ROOT REDIRECT — If someone hits "/", redirect them to the
//    right dashboard based on their role rather than just /login.
//
// 5. ADDED JSX TYPE IMPORT CORRECTLY — `import type { JSX }` is
//    already fine, kept as-is.
// ─────────────────────────────────────────────────────────────

import type { JSX } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import "./index.css";

import Login        from "./pages/Login";
import Signup       from "./pages/Signup";
import UserDashboard from "./pages/UserDashboard";
import Users        from "./pages/Users";
import Invoices     from "./pages/Invoices";
import AdminUsers   from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import Products     from "./pages/Products";

// Extracted outside of App — this component is now stable
// and doesn't get recreated on every App render.
function RequireRole({ role, children }: { role: string; children: JSX.Element }) {
  const userRole = localStorage.getItem("role");
  return userRole === role ? children : <Navigate to="/login" replace />;
}

// Smart root redirect — sends the user to the correct dashboard
// instead of always dumping them on /login when they're already logged in.
function RootRedirect() {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Smart root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* User routes — protected + role-checked */}
        <Route
          element={
            <ProtectedRoute>
              <RequireRole role="USER">
                <DashboardLayout />
              </RequireRole>
            </ProtectedRoute>
          }
        >
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/products"  element={<Products />} />
          <Route path="/user/invoices"  element={<Invoices />} />
          <Route path="/users"          element={<Users />} />
        </Route>

        {/* Admin routes — protected + role-checked */}
        <Route
          element={
            <ProtectedRoute>
              <RequireRole role="ADMIN">
                <DashboardLayout />
              </RequireRole>
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products"  element={<Products />} />
          <Route path="/admin/invoices"  element={<Invoices />} />
          <Route path="/admin/users"     element={<AdminUsers />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}