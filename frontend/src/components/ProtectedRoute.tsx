import { Navigate } from "react-router-dom";
import React from "react";

interface ProtectedRouteProps{
    children: React.ReactNode;
    role?: string;
}

export default function ProtectedRoute({children, role}: ProtectedRouteProps) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) return <Navigate to="/login" replace />;
    if (role && userRole !== role) return <Navigate to="/login"/>
    return <>{children}</>;
}