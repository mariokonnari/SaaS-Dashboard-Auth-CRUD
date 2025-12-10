import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
}

interface Invoice {
  id: string;
  userId: string;
  amount: number;
  description: string;
  createdAt: string;
  user?: User;
}

export default function Invoices() {
  const role = localStorage.getItem("role") || "USER";
  const apiBase = role === "ADMIN" ? "/admin/invoices" : "/user/invoices";
  const usersBase = "/admin/users";
  const {t} = useTranslation();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get(apiBase);
      setInvoices(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users (only for admin)
  const fetchUsers = async () => {
    if (role !== "ADMIN") return;
    try {
      const res = await api.get(usersBase);
      setUsers(res.data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchUsers();
  }, []);

  // Create invoice
  const handleCreate = async () => {
    if ((role === "ADMIN" && !selectedUser) || Number(amount) <= 0 || !description) {
      alert(t("invoices.fill.warning"));
      return;
    }

    try {
      await api.post(apiBase, {
        userId: role === "ADMIN" ? selectedUser : undefined,
        amount: Number(amount),
        description,
      });
      setSelectedUser("");
      setAmount("");
      setDescription("");
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create invoice");
    }
  };

  // Edit invoice
  const loadInvoiceForEdit = (invoice: Invoice) => {
    setEditId(invoice.id);
    setSelectedUser(invoice.userId);
    setAmount(invoice.amount.toString());
    setDescription(invoice.description);
  };

  const handleUpdate = async () => {
    if ((role === "ADMIN" && !selectedUser) || Number(amount) <= 0 || !description) {
      alert(t("invoices.fill.warning"));
      return;
    }

    try {
      await api.put(`${apiBase}/${editId}`, {
        userId: role === "ADMIN" ? selectedUser : undefined,
        amount: Number(amount),
        description,
      });
      setEditId(null);
      setSelectedUser("");
      setAmount("");
      setDescription("");
      fetchInvoices();
    } catch (err: any) {
      console.error("Update invoice error:", err);
      alert(err.response?.data?.message || "Failed to update invoice");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("invoices.delete.warning"))) return;
    try {
      await api.delete(`${apiBase}/${id}`);
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete invoice");
    }
  };

  // Animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  } as const;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading invoices...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">Error: {error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 pb-6">
            {t("invoices.title")}
          </h1>
          <p className="text-gray-600 text-lg">{t("invoices.h1")}</p>
        </div>

        {/* Create/Edit Form */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {role === "ADMIN" && (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 bg-white text-black"
              >
                <option value="">{t("invoices.add.selectuser.placeholder")}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            )}

            <input
              type="number"
              placeholder={t("invoices.add.amount.placeholder")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 bg-white text-black"
            />
            <input
              type="text"
              placeholder={t("invoices.add.description.placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200 bg-white text-black"
            />
            <div className="flex gap-2">
              {editId ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUpdate}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-bold"
                  >
                    {t("invoices.add.updatebutton")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditId(null);
                      setSelectedUser("");
                      setAmount("");
                      setDescription("");
                    }}
                    className="px-6 py-3 rounded-xl border-2 border-gray-300 text-white-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    {t("invoices.add.cancelbutton")}
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreate}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
                >
                  {t("invoices.add.addbutton")}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Invoices Table */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <i className="hgi-stroke hgi-invoice-03 text-3xl text-purple-500"></i>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{t("invoices.table.title")}</h3>
              <p className="text-sm text-gray-500">
                {invoices.length} {invoices.length !== 1 ? t("invoices.table.h2.plural") : t("invoices.table.h2")}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">ID</th>
                  {role === "ADMIN" && <th className="text-left p-4 text-sm font-semibold text-gray-700">{t("invoices.table.useremail")}</th>}
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">{t("invoices.table.amount")}</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">{t("invoices.table.description")}</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">{t("invoices.table.createdat")}</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">{t("invoices.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {invoices.map((inv, index) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                    >
                      <td className="p-4 text-gray-800 font-medium">{inv.id}</td>
                      {role === "ADMIN" && <td className="p-4 text-gray-800">{inv.user?.email || "Unknown"}</td>}
                      <td className="p-4 text-gray-800">${inv.amount != null && !isNaN(Number(inv.amount)) ? Number(inv.amount).toFixed(2) : "0.00"}</td>
                      <td className="p-4 text-gray-800">{inv.description}</td>
                      <td className="p-4 text-gray-800">{new Date(inv.createdAt).toLocaleString()}</td>
                      <td className="p-4 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => loadInvoiceForEdit(inv)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {t("invoices.table.actions.editbutton")}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(inv.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {t("invoices.table.actions.deletebutton")}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {invoices.length === 0 && (
              <div className="text-center py-16">
                <i className="hgi-stroke hgi-invoice-off text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">{t("invoices.table.nomessage")}</p>
                <p className="text-gray-400 text-sm">{t("invoices.table.addmessage")}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
