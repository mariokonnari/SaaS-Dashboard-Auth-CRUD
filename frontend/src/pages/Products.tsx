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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [editId, setEditId] = useState<string | null>(null);
  const { t } = useTranslation();

  const role = localStorage.getItem("role") || "USER"; // default to USER

  const apiBase = role === "ADMIN" ? "/admin/products" : "/user/products";

  // Fetch products depending on role
  const fetchProducts = async () => {
    try {
      const res = await api.get(apiBase);
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !description.trim() || Number(price) <= 0) {
      alert(t("products.fill.warning"));
      return;
    }

    try {
      await api.post(apiBase, { name, description, price: Number(price) });
      setName("");
      setDescription("");
      setPrice("0");
      fetchProducts();
    } catch (err) {
      console.error("Create product error:", err);
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
  };

  const handleUpdate = async () => {
    if (!name.trim() || !description.trim() || Number(price) <= 0) {
      alert(t("products.fill.warning"));
      return;
    }

    if (!editId) return;

    try {
      console.log("Updating product:", { editId, apiBase, name, description, price });
      await api.put(`${apiBase}/${editId}`, {
        name,
        description,
        price: Number(price),
      });
      setEditId(null);
      setName("");
      setDescription("");
      setPrice("0");
      fetchProducts();
    } catch (err) {
      console.error("Update product error:", err);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setPrice("0");
  };

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90 } },
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-4">
            {role === "ADMIN" ? t("products.title.admin") : t("products.title.user")}
          </h1>
          <p className="text-gray-600 text-lg">
            {role === "ADMIN"
              ? t("products.h1.admin")
              : t("products.h1.user")}
          </p>
        </div>

        {/* Create/Edit Form */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <i className="hgi-stroke hgi-package-add text-3xl text-indigo-500"></i>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{editId ? t("products.add.table.title.edit") : t("products.add.table.title.add")}</h3>
              <p className="text-sm text-gray-500">{editId ? t("products.add.table.h2.edit") : t("products.add.table.h2.add")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("products.add.name.form.label")}</label>
              <input type="text" placeholder={t("products.add.name.form.placeholder")} value={name} onChange={(e) => setName(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-black"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("products.add.description.form.label")}</label>
              <input type="text" placeholder={t("products.add.description.form.placeholder")} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-black"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("products.add.price.form.label")} ($)</label>
              <input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white text-black"/>
            </div>
          </div>

          <div className="flex gap-3">
            {editId ? (
              <>
                <motion.button whileHover={{ scale: 1.05 }} onClick={handleUpdate} className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 shadow">{t("products.add.updatebutton")}</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} onClick={handleCancel} className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50">{t("products.add.cancelbutton")}</motion.button>
              </>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} onClick={handleCreate} className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 shadow">{t("products.add.addbutton")}</motion.button>
            )}
          </div>
        </motion.div>

        {/* Product Table */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <i className="hgi-stroke hgi-package text-3xl text-purple-500"></i>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{role === "ADMIN" ? t("products.all.table.title.admin") : t("products.all.table.title.user")}</h3>
              <p className="text-sm text-gray-500">{products.length} {t("products.all.table.h2")}{products.length !== 1 ? t("products.all.table.h2.plural") : ""}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-4 text-left text-gray-700">{t("products.all.name")}</th>
                  <th className="p-4 text-left text-gray-700">{t("products.all.description")}</th>
                  <th className="p-4 text-left text-gray-700">{t("products.all.price")}</th>
                  <th className="p-4 text-left text-gray-700">{t("products.all.actions")}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ delay: i * 0.04 }} className="border-b border-gray-100 hover:bg-indigo-50/40 transition">
                      <td className="p-4 font-semibold text-gray-800">{p.name}</td>
                      <td className="p-4 text-gray-800">{p.description}</td>
                      <td className="p-4 font-semibold text-gray-800">${Number(p.price).toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => loadProductForEdit(p)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">{t("products.all.editbutton")}</button>
                          <button onClick={() => handleDelete(p.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{t("products.all.deletebutton")}</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-16">
                <i className="hgi-stroke hgi-package-out-of-stock text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">{role === "ADMIN" ? t("products.all.admin.nomessage") : t("products.all.user.nomessage")}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
