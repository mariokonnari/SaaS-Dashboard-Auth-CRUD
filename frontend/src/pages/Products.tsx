import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import type { Product } from "../types/types";
import ConfirmModal from "../components/ConfirmModal";

const itemVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
} as const;

const inputClass =
  "w-full bg-[#111113] border border-[#27272a] text-[#fafafa] placeholder-[#52525b] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-colors";

export default function Products() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [price,       setPrice]       = useState<string>("");
  const [editId,      setEditId]      = useState<string | null>(null);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { t }   = useTranslation();
  const role    = localStorage.getItem("role") || "USER";
  const isAdmin = role === "ADMIN";
  const apiBase = isAdmin ? "/admin/products" : "/user/products";

  const fetchProducts = async () => {
    try {
      const res = await api.get(apiBase);
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setEditId(null); setName(""); setDescription(""); setPrice(""); setFormError(null);
  };

  const validate = () => {
    if (!name.trim())                { setFormError(t("products.fill.warning")); return false; }
    if (Number(price) <= 0)          { setFormError(t("products.fill.warning")); return false; }
    setFormError(null); return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await api.post(apiBase, { name, description, price: Number(price) });
      resetForm(); fetchProducts();
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      setFormError(e.response?.data?.message ?? "Failed to create product");
    }
  };

  const handleUpdate = async () => {
    if (!validate() || !editId) return;
    try {
      await api.put(`${apiBase}/${editId}`, { name, description, price: Number(price) });
      resetForm(); fetchProducts();
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      setFormError(e.response?.data?.message ?? "Failed to update product");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`${apiBase}/${deleteTarget}`);
      setDeleteTarget(null); fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      setDeleteTarget(null);
    }
  };

  const loadForEdit = (p: Product) => {
    setEditId(p.id); setName(p.name); setDescription(p.description);
    setPrice(p.price.toString()); setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#09090b] p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#fafafa] mb-1">
            {isAdmin ? t("products.title.admin") : t("products.title.user")}
          </h1>
          <p className="text-sm text-[#71717a]">
            {isAdmin ? t("products.h1.admin") : t("products.h1.user")}
          </p>
        </div>

        {/* Form */}
        {isAdmin && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible"
            className="bg-[#111113] rounded-xl p-6 mb-6"
            style={{ border: `1px solid ${editId ? "rgba(59,130,246,0.35)" : "#27272a"}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-[#fafafa]">
                  {editId ? t("products.add.table.title.edit") : t("products.add.table.title.add")}
                </h3>
                <p className="text-xs text-[#71717a] mt-0.5">
                  {editId ? t("products.add.table.h2.edit") : t("products.add.table.h2.add")}
                </p>
              </div>
              {editId && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">
                  Editing
                </span>
              )}
            </div>

            <AnimatePresence>
              {formError && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-sm mb-4 px-3 py-2.5 rounded-lg text-[#ef4444] bg-[#ef4444]/8 border border-[#ef4444]/20">
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a1a1aa]">{t("products.add.name.form.label")}</label>
                <input type="text" placeholder={t("products.add.name.form.placeholder")}
                  value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a1a1aa]">{t("products.add.description.form.label")}</label>
                <input type="text" placeholder={t("products.add.description.form.placeholder")}
                  value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a1a1aa]">{t("products.add.price.form.label")} ($)</label>
                <input type="number" placeholder="0.00" value={price}
                  onChange={(e) => setPrice(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3">
              {editId ? (
                <>
                  <button onClick={handleUpdate}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors">
                    {t("products.add.updatebutton")}
                  </button>
                  <button onClick={resetForm}
                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#71717a] border border-[#27272a] hover:border-[#3f3f46] hover:text-[#fafafa] transition-colors">
                    {t("products.add.cancelbutton")}
                  </button>
                </>
              ) : (
                <button onClick={handleCreate}
                  className="px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors">
                  {t("products.add.addbutton")}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible"
          className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#fafafa]">
                {isAdmin ? t("products.all.table.title.admin") : t("products.all.table.title.user")}
              </h3>
              <p className="text-xs text-[#71717a] mt-0.5">
                {products.length} {t("products.all.table.h2")}{products.length !== 1 ? t("products.all.table.h2.plural") : ""}
              </p>
            </div>
            {products.length > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                Total: ${products.reduce((s, p) => s + Number(p.price), 0).toFixed(2)}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1c1c1e]">
                  {[t("products.all.name"), t("products.all.description"), t("products.all.price"),
                    ...(isAdmin ? [t("products.all.actions")] : [])].map((h) => (
                    <th key={h} className="text-left p-3 text-xs font-medium text-[#52525b] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((p, i) => (
                    <motion.tr key={p.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-[#1c1c1e] hover:bg-[#161618] transition-colors duration-100"
                    >
                      <td className="p-3 text-sm font-medium text-[#fafafa]">{p.name}</td>
                      <td className="p-3 text-sm text-[#71717a]">{p.description}</td>
                      <td className="p-3 text-sm font-semibold text-[#10b981]">${Number(p.price).toFixed(2)}</td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => loadForEdit(p)}
                              className="text-xs font-medium px-3 py-1.5 rounded-md text-[#3b82f6] bg-[#3b82f6]/8 hover:bg-[#3b82f6]/15 transition-colors">
                              {t("products.all.editbutton")}
                            </button>
                            <button onClick={() => setDeleteTarget(p.id)}
                              className="text-xs font-medium px-3 py-1.5 rounded-md text-[#ef4444] bg-[#ef4444]/8 hover:bg-[#ef4444]/15 transition-colors">
                              {t("products.all.deletebutton")}
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-[#71717a]">
                  {isAdmin ? t("products.all.admin.nomessage") : t("products.all.user.nomessage")}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete product"
        description="This product will be permanently removed. This action cannot be undone."
        confirmLabel="Delete product"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
