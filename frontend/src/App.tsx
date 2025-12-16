import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import "./index.css";
import type {JSX} from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup"
import UserDashboard from "./pages/UserDashboard";
import Users from "./pages/Users";
import Invoices from "./pages/Invoices";

import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import Products from "./pages/Products";

function RequireRole({role, children} : {role: string, children: JSX.Element}) {
  const userRole = localStorage.getItem("role");
  return userRole === role ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/*Public route*/}
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />

        {/*Protected dashboard wrapper*/}
        {/*User Routes*/}
        <Route element={<ProtectedRoute><RequireRole role="USER"><DashboardLayout /></RequireRole></ProtectedRoute>}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/products" element={<Products />} />
          <Route path="/user/invoices" element={<Invoices />} />
          <Route path="/users" element={<Users />} />
        </Route>

          {/*Admin Routes*/}
        <Route element={<ProtectedRoute><RequireRole role="ADMIN"><DashboardLayout /></RequireRole></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/invoices" element={<Invoices />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        {/*DEFAULT*/}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};