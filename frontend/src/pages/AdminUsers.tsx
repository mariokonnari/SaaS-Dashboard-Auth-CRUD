import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import type { User } from "../types/types";

const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
} as const;

export default function AdminUsers() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setError(axErr.response?.data?.message ?? "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("users.delete.warning"))) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      alert(axErr.response?.data?.message ?? "Failed to delete user");
    }
  };

  const handleRoleChange = async (id: string, newRole: "ADMIN" | "USER") => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      alert(axErr.response?.data?.message ?? "Failed to update role");
    }
  };

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const userCount  = users.filter((u) => u.role === "USER").length;

  if (loading) return (
    <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center">
      <div className="space-y-3 w-full max-w-2xl px-8">
        {[...Array(5)].map((_, i) => (
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            {t("users.title")}
          </h1>
          <p className="text-[#6b7694] text-base">{t("users.h1")}</p>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(108,99,255,0.10)", color: "#6c63ff", border: "1px solid rgba(108,99,255,0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-[#6c63ff]" />
            {users.length} Total
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,209,102,0.08)", color: "#ffd166", border: "1px solid rgba(255,209,102,0.18)" }}>
            <span className="w-2 h-2 rounded-full bg-[#ffd166]" />
            {adminCount} Admin{adminCount !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(0,229,176,0.08)", color: "#00e5b0", border: "1px solid rgba(0,229,176,0.18)" }}>
            <span className="w-2 h-2 rounded-full bg-[#00e5b0]" />
            {userCount} User{userCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Users Table */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl p-6 border border-white/7"
          style={{ background: "#111624" }}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white">{t("users.all.table.title")}</h3>
            <p className="text-sm text-[#6b7694] mt-0.5">
              {users.length} {users.length !== 1 ? t("users.all.table.h2.plural") : t("users.all.table.h2")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/7">
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">ID</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">Email</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("users.all.table.role")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("users.all.table.createdat")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("users.all.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {users.map((user, index) => {
                    const isAdminUser = user.role === "ADMIN";
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ delay: index * 0.04 }}
                        className="border-b border-white/4 hover:bg-white/3 transition-colors duration-150"
                      >
                        <td className="p-3 text-sm">
                          <span className="font-mono text-xs bg-white/5 text-[#6b7694] px-2 py-1 rounded">
                            {user.id.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="p-3 text-sm text-[#e8eaf6] font-medium">
                          {user.email}
                        </td>
                        <td className="p-3 text-sm">
                          {/* Role badge */}
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={
                              isAdminUser
                                ? { background: "rgba(255,209,102,0.10)", color: "#ffd166" }
                                : { background: "rgba(108,99,255,0.10)", color: "#6c63ff" }
                            }
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: isAdminUser ? "#ffd166" : "#6c63ff" }}
                            />
                            {isAdminUser ? t("users.all.table.role1") : t("users.all.table.role2")}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-[#6b7694]">
                          {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {/* Toggle role button */}
                            <button
                              onClick={() => handleRoleChange(user.id, isAdminUser ? "USER" : "ADMIN")}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              style={
                                isAdminUser
                                  ? { background: "rgba(108,99,255,0.10)", color: "#6c63ff" }
                                  : { background: "rgba(255,209,102,0.10)", color: "#ffd166" }
                              }
                              onMouseOver={e => (e.currentTarget.style.opacity = "0.75")}
                              onMouseOut={e  => (e.currentTarget.style.opacity = "1")}
                            >
                              {isAdminUser
                                ? t("users.all.table.actions.makeuserbutton")
                                : t("users.all.table.actions.makeadminbutton")}
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              style={{ background: "rgba(255,107,107,0.10)", color: "#ff6b6b" }}
                              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,107,107,0.20)")}
                              onMouseOut={e  => (e.currentTarget.style.background = "rgba(255,107,107,0.10)")}
                            >
                              {t("users.all.table.actions.deletebutton")}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-14">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-[#6b7694]">{t("users.all.table.nomessage")}</p>
                <p className="text-sm text-[#6b7694]/60 mt-1">Invite your first user to get started</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}