import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import type { InvoiceStatus } from "../types/types";
import ConfirmModal from "../components/ConfirmModal";

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
  status: InvoiceStatus;
  user?: User;
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; color: string; dot: string }> = {
  PENDING:   { label: "Pending",   bg: "rgba(255,209,102,0.10)", color: "#f59e0b", dot: "#f59e0b" },
  PAID:      { label: "Paid",      bg: "rgba(0,229,176,0.10)",   color: "#10b981", dot: "#10b981" },
  CANCELLED: { label: "Cancelled", bg: "rgba(255,107,107,0.10)", color: "#ef4444", dot: "#ef4444" },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ── Shared input styles ───────────────────────────────────────────────────────
const inputClass =
  "w-full bg-[#161618] border border-[#27272a] text-white placeholder-[#71717a] px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#3b82f6] transition-colors";
const selectClass =
  "w-full bg-[#161618] border border-[#27272a] text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#3b82f6] transition-colors appearance-none";

const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
} as const;

// ── Component ─────────────────────────────────────────────────────────────────
export default function Invoices() {
  const role    = localStorage.getItem("role") || "USER";
  const isAdmin = role === "ADMIN";
  const apiBase = isAdmin ? "/admin/invoices" : "/user/invoices";
  const { t }   = useTranslation();

  const [invoices,     setInvoices]     = useState<Invoice[]>([]);
  const [users,        setUsers]        = useState<User[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [formError,    setFormError]    = useState<string | null>(null);

  // Form fields
  const [selectedUser, setSelectedUser] = useState("");
  const [amount,       setAmount]       = useState("");
  const [description,  setDescription]  = useState("");
  const [status,       setStatus]       = useState<InvoiceStatus>("PENDING");
  const [editId,       setEditId]       = useState<string | null>(null);

  // Status filter
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "ALL">("ALL");

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ── Data fetching ───────────────────────────────────────────────────────────
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
    } catch {
      // Non-fatal — the user selector will just be empty
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchUsers();
  }, []);

  // ── Form helpers ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setEditId(null);
    setSelectedUser("");
    setAmount("");
    setDescription("");
    setStatus("PENDING");
    setFormError(null);
  };

  const validate = () => {
    if (isAdmin && !selectedUser) {
      setFormError("Please select a user.");
      return false;
    }
    if (Number(amount) <= 0 || isNaN(Number(amount))) {
      setFormError("Amount must be a positive number.");
      return false;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
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
        status,
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
        status,
      });
      resetForm();
      fetchInvoices();
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setFormError(axErr.response?.data?.message ?? "Failed to update invoice");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`${apiBase}/${deleteTarget}`);
      setDeleteTarget(null);
      fetchInvoices();
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setFormError(axErr.response?.data?.message ?? "Failed to delete invoice");
      setDeleteTarget(null);
    }
  };

  const loadInvoiceForEdit = (invoice: Invoice) => {
    setEditId(invoice.id);
    setSelectedUser(invoice.userId);
    setAmount(invoice.amount.toString());
    setDescription(invoice.description);
    setStatus(invoice.status ?? "PENDING");
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const totalRevenue   = invoices.reduce((s, inv) => s + Number(inv.amount), 0);
  const filteredInvoices = filterStatus === "ALL"
    ? invoices
    : invoices.filter((inv) => inv.status === filterStatus);

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="space-y-3 w-full max-w-2xl px-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-white/4 animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-[#ef4444] font-medium">{error}</p>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090b] p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {t("invoices.title")}
            </h1>
            <p className="text-[#71717a] text-base">{t("invoices.h1")}</p>
          </div>
          {invoices.length > 0 && (
            <div
              className="rounded-2xl px-5 py-3 border text-right flex-shrink-0"
              style={{ background: "rgba(0,229,176,0.08)", borderColor: "rgba(0,229,176,0.18)" }}
            >
              <p className="text-xs text-[#71717a] mb-0.5">Total Revenue</p>
              <p className="text-xl font-bold" style={{ color: "#10b981" }}>
                ${totalRevenue.toFixed(2)}
              </p>
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
            background: "#111113",
            borderColor: editId ? "rgba(108,99,255,0.35)" : "rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">
                {editId ? t("invoices.add.updatebutton") : t("invoices.add.addbutton")}
              </h3>
              <p className="text-sm text-[#71717a] mt-0.5">Fill in the details below</p>
            </div>
            {editId && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "rgba(108,99,255,0.15)", color: "#3b82f6" }}
              >
                ✏️ Editing
              </span>
            )}
          </div>

          <AnimatePresence>
            {formError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-sm mb-4 px-4 py-2 rounded-xl"
                style={{ color: "#ef4444", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)" }}
              >
                {formError}
              </motion.p>
            )}
          </AnimatePresence>

          <div className={`grid grid-cols-1 gap-4 mb-4 ${isAdmin ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
            {isAdmin && (
              <div>
                <label className="text-xs font-medium text-[#71717a] block mb-1.5 tracking-wide uppercase">User</label>
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className={selectClass}>
                  <option value="">{t("invoices.add.selectuser.placeholder")}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-[#71717a] block mb-1.5 tracking-wide uppercase">Amount ($)</label>
              <input
                type="number"
                placeholder={t("invoices.add.amount.placeholder")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717a] block mb-1.5 tracking-wide uppercase">Description</label>
              <input
                type="text"
                placeholder={t("invoices.add.description.placeholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#71717a] block mb-1.5 tracking-wide uppercase">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)} className={selectClass}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              {editId ? (
                <>
                  <motion.button
                    whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                    onClick={handleUpdate}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "#3b82f6" }}
                  >
                    {t("invoices.add.updatebutton")}
                  </motion.button>
                  <motion.button
                    whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#71717a] border border-[#27272a] hover:border-white/15 transition-colors"
                  >
                    {t("invoices.add.cancelbutton")}
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#3b82f6" }}
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
          className="rounded-2xl p-6 border border-[#27272a]"
          style={{ background: "#111113" }}
        >
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-white">{t("invoices.table.title")}</h3>
              <p className="text-sm text-[#71717a] mt-0.5">
                {filteredInvoices.length}{" "}
                {filteredInvoices.length !== 1 ? t("invoices.table.h2.plural") : t("invoices.table.h2")}
              </p>
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 flex-wrap">
              {(["ALL", "PENDING", "PAID", "CANCELLED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                  style={
                    filterStatus === s
                      ? { background: "rgba(108,99,255,0.20)", color: "#3b82f6", border: "1px solid rgba(108,99,255,0.35)" }
                      : { background: "rgba(255,255,255,0.04)", color: "#71717a", border: "1px solid rgba(255,255,255,0.07)" }
                  }
                >
                  {s === "ALL" ? "All" : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/7">
                  <th className="text-left p-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider">ID</th>
                  {isAdmin && <th className="text-left p-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider">{t("invoices.table.useremail")}</th>}
                  <th className="text-left p-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider">{t("invoices.table.amount")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider">{t("invoices.table.description")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider">{t("invoices.table.createdat")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#71717a] uppercase tracking-wider">{t("invoices.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredInvoices.map((inv, index) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-[#1c1c1e] hover:bg-[#161618] transition-colors duration-150"
                    >
                      <td className="p-3 text-sm">
                        <span className="font-mono text-xs bg-white/5 text-[#71717a] px-2 py-1 rounded">
                          {inv.id.slice(0, 8)}…
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-sm text-[#e8eaf6] font-medium">
                          {inv.user?.email || "Unknown"}
                        </td>
                      )}
                      <td className="p-3 text-sm font-bold" style={{ color: "#10b981" }}>
                        ${inv.amount != null ? Number(inv.amount).toFixed(2) : "0.00"}
                      </td>
                      <td className="p-3 text-sm text-[#71717a]">{inv.description}</td>
                      <td className="p-3">
                        <StatusBadge status={inv.status ?? "PENDING"} />
                      </td>
                      <td className="p-3 text-sm text-[#71717a]">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadInvoiceForEdit(inv)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: "rgba(255,209,102,0.10)", color: "#f59e0b" }}
                          >
                            {t("invoices.table.actions.editbutton")}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(inv.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: "rgba(255,107,107,0.10)", color: "#ef4444" }}
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

            {filteredInvoices.length === 0 && (
              <div className="text-center py-14">
                <p className="text-4xl mb-3">🧾</p>
                <p className="text-[#71717a]">
                  {filterStatus !== "ALL"
                    ? `No ${STATUS_CONFIG[filterStatus].label.toLowerCase()} invoices`
                    : t("invoices.table.nomessage")}
                </p>
                {filterStatus === "ALL" && (
                  <p className="text-sm text-[#71717a]/60 mt-1">{t("invoices.table.addmessage")}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete invoice"
        description="This action cannot be undone. The invoice will be permanently removed."
        confirmLabel="Delete invoice"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
