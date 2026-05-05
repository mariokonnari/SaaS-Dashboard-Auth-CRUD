import { lazy, Suspense } from "react";
import type { JSX } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Lazy-loaded pages — each route gets its own chunk so the initial bundle
// only loads what the user needs to see first (Login/Signup).
const Login         = lazy(() => import("./pages/Login"));
const Signup        = lazy(() => import("./pages/Signup"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const Users         = lazy(() => import("./pages/Users"));
const Invoices      = lazy(() => import("./pages/Invoices"));
const AdminUsers    = lazy(() => import("./pages/AdminUsers"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Products      = lazy(() => import("./pages/Products"));
const NotFound      = lazy(() => import("./pages/NotFound"));

// Skeleton shown while any lazy chunk is loading — matches the app background
// so there's no white flash on navigation.
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center">
      <div className="space-y-3 w-64">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-3 rounded-full bg-white/5 animate-pulse" style={{ width: `${80 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

function RequireRole({ role, children }: { role: string; children: JSX.Element }) {
  const userRole = localStorage.getItem("role");
  return userRole === role ? children : <Navigate to="/login" replace />;
}

function RootRedirect() {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");
  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard"} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
