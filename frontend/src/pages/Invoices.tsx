import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";

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

const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
} as const;

const inputClass =
  "w-full bg-[#161c2e] border border-white/7 text-white placeholder-[#6b7694] px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#6c63ff] transition-colors";

const selectClass =
  "w-full bg-[#161c2e] border border-white/7 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#6c63ff] transition-colors appearance-none";

export default function Invoices() {
  const role    = localStorage.getItem("role") || "USER";
  const isAdmin = role === "ADMIN";
  const apiBase = isAdmin ? "/admin/invoices" : "/user/invoices";
  const { t }   = useTranslation();

  const [invoices,      setInvoices]      = useState<Invoice[]>([]);
  const [users,         setUsers]         = useState<User[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [formError,     setFormError]     = useState<string | null>(null);
  const [selectedUser,  setSelectedUser]  = useState("");
  const [amount,        setAmount]        = useState("");
  const [description,   setDescription]  = useState("");
  const [editId,        setEditId]        = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get(apiBase);
      setInvoices(res.data);
      setError(null);
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setError(axErr.response?.data?.message ?? "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchUsers();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setSelectedUser("");
    setAmount("");
    setDescription("");
    setFormError(null);
  };

  const validate = () => {
    if ((isAdmin && !selectedUser) || Number(amount) <= 0 || !description.trim()) {
      setFormError(t("invoices.fill.warning"));
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await api.post(apiBase, {
        userId: isAdmin ? selectedUser : undefined,
        amount: Number(amount),
        description,
      });
      resetForm();
      fetchInvoices();
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setFormError(axErr.response?.data?.message ?? "Failed to create invoice");
    }
  };

  const handleUpdate = async () => {
    if (!validate() || !editId) return;
    try {
      await api.put(`${apiBase}/${editId}`, {
        userId: isAdmin ? selectedUser : undefined,
        amount: Number(amount),
        description,
      });
      resetForm();
      fetchInvoices();
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setFormError(axErr.response?.data?.message ?? "Failed to update invoice");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("invoices.delete.warning"))) return;
    try {
      await api.delete(`${apiBase}/${id}`);
      fetchInvoices();
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setFormError(axErr.response?.data?.message ?? "Failed to delete invoice");
    }
  };

  const loadInvoiceForEdit = (invoice: Invoice) => {
    setEditId(invoice.id);
    setSelectedUser(invoice.userId);
    setAmount(invoice.amount.toString());
    setDescription(invoice.description);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Summary stats
  const totalRevenue = invoices.reduce((s, inv) => s + Number(inv.amount), 0);

  if (loading) return (
    <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center">
      <div className="space-y-3 w-full max-w-2xl px-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-white/4 animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-[#ff6b6b] font-medium">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0e17] p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {t("invoices.title")}
            </h1>
            <p className="text-[#6b7694] text-base">{t("invoices.h1")}</p>
          </div>
          {/* Total revenue pill */}
          {invoices.length > 0 && (
            <div className="rounded-2xl px-5 py-3 border text-right"
              style={{ background: "rgba(0,229,176,0.08)", borderColor: "rgba(0,229,176,0.18)" }}>
              <p className="text-xs text-[#6b7694] mb-0.5">Total Revenue</p>
              <p className="text-xl font-bold" style={{ color: "#00e5b0" }}>${totalRevenue.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Create / Edit Form */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl p-6 border mb-6"
          style={{
            background: "#111624",
            borderColor: editId ? "rgba(108,99,255,0.35)" : "rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">
                {editId ? t("invoices.add.updatebutton") : t("invoices.add.addbutton")}
              </h3>
              <p className="text-sm text-[#6b7694] mt-0.5">Fill in the details below</p>
            </div>
            {editId && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "rgba(108,99,255,0.15)", color: "#6c63ff" }}>
                ✏️ Editing
              </span>
            )}
          </div>

          <AnimatePresence>
            {formError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-sm mb-4 px-4 py-2 rounded-xl"
                style={{ color: "#ff6b6b", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)" }}
              >
                {formError}
              </motion.p>
            )}
          </AnimatePresence>

          <div className={`grid grid-cols-1 gap-4 mb-4 ${isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            {isAdmin && (
              <div>
                <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide uppercase">User</label>
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className={selectClass}>
                  <option value="">{t("invoices.add.selectuser.placeholder")}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide uppercase">Amount ($)</label>
              <input
                type="number"
                placeholder={t("invoices.add.amount.placeholder")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide uppercase">Description</label>
              <input
                type="text"
                placeholder={t("invoices.add.description.placeholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex items-end gap-2">
              {editId ? (
                <>
                  <motion.button
                    whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                    onClick={handleUpdate}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "#6c63ff" }}
                  >
                    {t("invoices.add.updatebutton")}
                  </motion.button>
                  <motion.button
                    whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#6b7694] border border-white/7 hover:border-white/15 transition-colors"
                  >
                    {t("invoices.add.cancelbutton")}
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#6c63ff" }}
                >
                  + {t("invoices.add.addbutton")}
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
          className="rounded-2xl p-6 border border-white/7"
          style={{ background: "#111624" }}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white">{t("invoices.table.title")}</h3>
            <p className="text-sm text-[#6b7694] mt-0.5">
              {invoices.length} {invoices.length !== 1 ? t("invoices.table.h2.plural") : t("invoices.table.h2")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/7">
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">ID</th>
                  {isAdmin && <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("invoices.table.useremail")}</th>}
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("invoices.table.amount")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("invoices.table.description")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("invoices.table.createdat")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("invoices.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {invoices.map((inv, index) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ delay: index * 0.04 }}
                      className="border-b border-white/4 hover:bg-white/3 transition-colors duration-150"
                    >
                      <td className="p-3 text-sm">
                        <span className="font-mono text-xs bg-white/5 text-[#6b7694] px-2 py-1 rounded">
                          {inv.id.slice(0, 8)}…
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-sm text-[#e8eaf6] font-medium">
                          {inv.user?.email || "Unknown"}
                        </td>
                      )}
                      <td className="p-3 text-sm font-bold" style={{ color: "#00e5b0" }}>
                        ${inv.amount != null ? Number(inv.amount).toFixed(2) : "0.00"}
                      </td>
                      <td className="p-3 text-sm text-[#6b7694]">{inv.description}</td>
                      <td className="p-3 text-sm text-[#6b7694]">
                        {new Date(inv.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadInvoiceForEdit(inv)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: "rgba(255,209,102,0.10)", color: "#ffd166" }}
                            onMouseOver={e => (e.currentTarget.style.background = "rgba(255,209,102,0.20)")}
                            onMouseOut={e  => (e.currentTarget.style.background = "rgba(255,209,102,0.10)")}
                          >
                            {t("invoices.table.actions.editbutton")}
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: "rgba(255,107,107,0.10)", color: "#ff6b6b" }}
                            onMouseOver={e => (e.currentTarget.style.background = "rgba(255,107,107,0.20)")}
                            onMouseOut={e  => (e.currentTarget.style.background = "rgba(255,107,107,0.10)")}
                          >
                            {t("invoices.table.actions.deletebutton")}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {invoices.length === 0 && (
              <div className="text-center py-14">
                <p className="text-4xl mb-3">🧾</p>
                <p className="text-[#6b7694]">{t("invoices.table.nomessage")}</p>
                <p className="text-sm text-[#6b7694]/60 mt-1">{t("invoices.table.addmessage")}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}