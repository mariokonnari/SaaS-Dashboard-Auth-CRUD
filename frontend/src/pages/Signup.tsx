import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();

        if (!email || !password || !confirmPassword) {
            alert("Please fill all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            await api.post("/signup", { email, password });
            alert("Signup successful! Please login.");
            navigate("/login");
        } catch (err: any) {
            alert(err.response?.data?.message || "Signup failed");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
            <motion.form
                onSubmit={handleSignup}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col gap-6"
            >
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent text-center">
                    Create Account
                </h1>
                <p className="text-gray-600 text-center">
                    Sign up to access the dashboard
                </p>

                <div className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 bg-white text-black"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 bg-white text-black"
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-200 bg-white text-black"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    Sign Up
                </motion.button>

                <p className="text-center text-gray-500">
                    Already have an account?{" "}
                    <span
                        className="text-blue-500 hover:underline cursor-pointer"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </span>
                </p>
            </motion.form>
        </div>
    );
}
