import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90 } },
} as const;

// Reusable dark input className
const inputClass =
  "w-full bg-[#161c2e] border border-white/7 text-white placeholder-[#6b7694] px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#6c63ff] transition-colors";

export default function Products() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [price,       setPrice]       = useState<string>("");
  const [editId,      setEditId]      = useState<string | null>(null);
  const [formError,   setFormError]   = useState<string | null>(null);

  const { t }     = useTranslation();
  const role      = localStorage.getItem("role") || "USER";
  const isAdmin   = role === "ADMIN";
  const apiBase   = isAdmin ? "/admin/products" : "/user/products";

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
    setEditId(null);
    setName("");
    setDescription("");
    setPrice("");
    setFormError(null);
  };

  const validate = () => {
    if (!name.trim() || !description.trim() || Number(price) <= 0) {
      setFormError(t("products.fill.warning"));
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await api.post(apiBase, { name, description, price: Number(price) });
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Create product error:", err);
    }
  };

  const handleUpdate = async () => {
    if (!validate() || !editId) return;
    try {
      await api.put(`${apiBase}/${editId}`, { name, description, price: Number(price) });
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Update product error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("products.delete.warning"))) return;
    try {
      await api.delete(`${apiBase}/${id}`);
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
    }
  };

  const loadProductForEdit = (product: Product) => {
    setEditId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setFormError(null);
    // Scroll form into view smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            {isAdmin ? t("products.title.admin") : t("products.title.user")}
          </h1>
          <p className="text-[#6b7694] text-base">
            {isAdmin ? t("products.h1.admin") : t("products.h1.user")}
          </p>
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
          {/* Form header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">
                {editId ? t("products.add.table.title.edit") : t("products.add.table.title.add")}
              </h3>
              <p className="text-sm text-[#6b7694] mt-0.5">
                {editId ? t("products.add.table.h2.edit") : t("products.add.table.h2.add")}
              </p>
            </div>
            {/* Editing badge */}
            {editId && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "rgba(108,99,255,0.15)", color: "#6c63ff" }}>
                ✏️ Editing
              </span>
            )}
          </div>

          {/* Inline form error */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide uppercase">
                {t("products.add.name.form.label")}
              </label>
              <input
                type="text"
                placeholder={t("products.add.name.form.placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide uppercase">
                {t("products.add.description.form.label")}
              </label>
              <input
                type="text"
                placeholder={t("products.add.description.form.placeholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b7694] block mb-1.5 tracking-wide uppercase">
                {t("products.add.price.form.label")} ($)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3">
            {editId ? (
              <>
                <motion.button
                  whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                  onClick={handleUpdate}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
                  style={{ background: "#6c63ff" }}
                >
                  {t("products.add.updatebutton")}
                </motion.button>
                <motion.button
                  whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#6b7694] border border-white/7 hover:border-white/15 transition-colors"
                >
                  {t("products.add.cancelbutton")}
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }}
                onClick={handleCreate}
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#6c63ff" }}
              >
                + {t("products.add.addbutton")}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Products Table */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl p-6 border border-white/7"
          style={{ background: "#111624" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">
                {isAdmin ? t("products.all.table.title.admin") : t("products.all.table.title.user")}
              </h3>
              <p className="text-sm text-[#6b7694] mt-0.5">
                {products.length} {t("products.all.table.h2")}
                {products.length !== 1 ? t("products.all.table.h2.plural") : ""}
              </p>
            </div>
            {/* Total value pill */}
            {products.length > 0 && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(0,229,176,0.10)", color: "#00e5b0" }}>
                Catalog value: ${products.reduce((s, p) => s + Number(p.price), 0).toFixed(2)}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/7">
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("products.all.name")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("products.all.description")}</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("products.all.price")}</th>
                  {isAdmin && (
                    <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">{t("products.all.actions")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 14 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-white/4 hover:bg-white/3 transition-colors duration-150"
                    >
                      <td className="p-3 text-sm font-semibold text-white">{p.name}</td>
                      <td className="p-3 text-sm text-[#6b7694]">{p.description}</td>
                      <td className="p-3 text-sm font-bold" style={{ color: "#00e5b0" }}>
                        ${Number(p.price).toFixed(2)}
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadProductForEdit(p)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff" }}
                              onMouseOver={e => (e.currentTarget.style.background = "rgba(108,99,255,0.22)")}
                              onMouseOut={e  => (e.currentTarget.style.background = "rgba(108,99,255,0.12)")}
                            >
                              {t("products.all.editbutton")}
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              style={{ background: "rgba(255,107,107,0.12)", color: "#ff6b6b" }}
                              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,107,107,0.22)")}
                              onMouseOut={e  => (e.currentTarget.style.background = "rgba(255,107,107,0.12)")}
                            >
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
              <div className="text-center py-14">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-[#6b7694]">
                  {isAdmin ? t("products.all.admin.nomessage") : t("products.all.user.nomessage")}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}