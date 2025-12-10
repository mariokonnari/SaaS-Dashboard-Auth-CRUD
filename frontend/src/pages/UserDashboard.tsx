import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";

interface Invoice {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  status: "Paid" | "Pending" | "Overdue";
}

export default function UserDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const totalSpent = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto flex flex-col gap-8"
      >
        {/* Welcome */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Here's a summary of your account
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center"
          >
            <h3 className="text-gray-600 text-sm mb-2">Total Invoices</h3>
            <p className="text-3xl font-bold text-gray-800">{invoices.length}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center"
          >
            <h3 className="text-gray-600 text-sm mb-2">Total Spent</h3>
            <p className="text-3xl font-bold text-gray-800">
              ${totalSpent.toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center"
          >
            <h3 className="text-gray-600 text-sm mb-2">Recent Activity</h3>
            <p className="text-gray-800 text-sm">
              {invoices.length > 0
                ? `Last invoice: ${new Date(
                    invoices[invoices.length - 1].createdAt
                  ).toLocaleDateString()}`
                : "No activity yet"}
            </p>
          </motion.div>
        </div>

        {/* Optional: Quick Actions or Recent Invoices preview */}
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Invoices
          </h2>
          {loading ? (
            <p>Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              You have no invoices yet.
            </p>
          ) : (
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="border p-3 text-left text-gray-700">ID</th>
                  <th className="border p-3 text-left text-gray-700">
                    Amount
                  </th>
                  <th className="border p-3 text-left text-gray-700">
                    Description
                  </th>
                  <th className="border p-3 text-left text-gray-700">Status</th>
                  <th className="border p-3 text-left text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(-5).reverse().map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                  >
                    <td className="border p-3 text-gray-800">{inv.id}</td>
                    <td className="border p-3 text-gray-800">
                      ${Number(inv.amount || 0).toFixed(2)}
                    </td>
                    <td className="border p-3 text-gray-800">{inv.description}</td>
                    <td className="border p-3 text-gray-800">{inv.status}</td>
                    <td className="border p-3 text-gray-800">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
