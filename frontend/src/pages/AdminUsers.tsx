import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {t} = useTranslation();

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("users.delete.warning"))) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleRoleChange = async (id: string, newRole: "ADMIN" | "USER") => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  } as const;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading users...</p>
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 pb-6">
            {t("users.title")}
          </h1>
          <p className="text-gray-600 text-lg">
            {t("users.h1")}
          </p>
        </div>

        {/* Users Table */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <i className="hgi-stroke hgi-users text-3xl text-purple-500"></i>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{t("users.all.table.title")}</h3>
              <p className="text-sm text-gray-500">{users.length} {users.length !== 1 ? t("users.all.table.h2.plural") : t("users.all.table.h2")}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">ID</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">{t("users.all.table.role")}</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">{t("users.all.table.createdat")}</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">{t("users.all.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                    >
                      <td className="p-4 text-gray-800 font-medium">{user.id}</td>
                      <td className="p-4 text-gray-800">{user.email}</td>
                      <td className="p-4 text-gray-800">{user.role === "ADMIN" ? t("users.all.table.role1") : t("users.all.table.role2")}</td>
                      <td className="p-4 text-gray-800">
                        {new Date(user.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 flex gap-2">
                        {user.role === "USER" ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRoleChange(user.id, "ADMIN")}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            {t("users.all.table.actions.makeadminbutton")}
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRoleChange(user.id, "USER")}
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg items-center gap-2"
                          >
                            {t("users.all.table.actions.makeuserbutton")}
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(user.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg items-center gap-2"
                        >
                          {t("users.all.table.actions.deletebutton")}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-16">
                <i className="hgi-stroke hgi-user-off text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">{t("users.all.table.nomessage")}</p>
                <p className="text-gray-400 text-sm">
                  Invite your first user to get started
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
