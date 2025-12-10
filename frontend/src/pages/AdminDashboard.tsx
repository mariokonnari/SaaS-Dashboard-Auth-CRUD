import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
}

interface Invoice {
  id: string;
  user: User;
  amount: number;
  description: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const {t} = useTranslation();

  // KPI numbers
  const totalUsers = users.length;
  const totalProducts = products.length;
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, productsRes, invoicesRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/products"),
          api.get("/admin/invoices"),
        ]);
        setUsers(usersRes.data);
        setProducts(productsRes.data);
        setInvoices(invoicesRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

  // Prepare chart data
  const revenueData = invoices
    .slice(-7) // last 7 invoices
    .map((inv) => ({
      date: new Date(inv.createdAt).toLocaleDateString(),
      revenue: inv.amount,
    }));

  const invoicesPerUser = users.map((user) => ({
    user: user.email,
    count: invoices.filter((inv) => inv.user?.id === user.id).length,
  }));

  const recentInvoices = invoices.slice(-5).reverse();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  } as const;

  const kpiCards = [
    {
      title: t("dashboard.card1"),
      value: totalUsers,
      icon: (
        <i className="hgi-stroke hgi-user-multiple text-4xl text-blue-500"></i>
      ),
      gradient: "from-blue-500 to-cyan-400",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      title: t("dashboard.card2"),
      value: totalProducts,
      icon: (
        <i className="hgi-stroke hgi-package text-4xl text-purple-500"></i>
      ),
      gradient: "from-purple-500 to-pink-400",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      title: t("dashboard.card3"),
      value: totalInvoices,
      icon: (
        <i className="hgi-stroke hgi-invoice-01 text-4xl text-emerald-500"></i>
      ),
      gradient: "from-emerald-500 to-teal-400",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      title: t("dashboard.card4"),
      value: `$${Number(totalRevenue).toFixed(2)}`,
      icon: (
        <i className="hgi-stroke hgi-dollar-circle text-4xl text-amber-500"></i>
      ),
      gradient: "from-amber-500 to-orange-400",
      bgGradient: "from-amber-50 to-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          {t("dashboard.title")}
        </h1>
        <p className="text-gray-600 text-lg">
          {t("dashboard.h1")}
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
      >
        {kpiCards.map((card, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bgGradient} p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {card.title}
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${card.gradient} text-gray-700">
                  {card.value}
                </p>
              </div>
              <div className="shrink-0">{card.icon}</div>
            </div>
            <div
              className={`absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full blur-2xl`}
            ></div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8"
      >
        {/* Revenue Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <i className="hgi-stroke hgi-chart-line-data-03 text-3xl text-blue-500"></i>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {t("dashboard.card5.title")}
              </h3>
              <p className="text-sm text-gray-500">{t("dashboard.card5.h2")}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", r: 6 }}
                activeDot={{ r: 8 }}
                fill="url(#colorRevenue)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Invoices Per User Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <i className="hgi-stroke hgi-bar-chart text-3xl text-emerald-500"></i>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {t("dashboard.card6.title")}
              </h3>
              <p className="text-sm text-gray-500">{t("dashboard.card6.h2")}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={invoicesPerUser}>
              <defs>
                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="user"
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend />
              <Bar
                dataKey="count"
                fill="url(#colorBar)"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      {/* Recent Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <i className="hgi-stroke hgi-invoice-02 text-3xl text-purple-500"></i>
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {t("dashboard.invoices.table.title")}
            </h3>
            <p className="text-sm text-gray-500">{t("dashboard.invoices.table.h2")}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  ID
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  {t("dashboard.invoices.table.UserEmail")}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  {t("dashboard.invoices.table.Amount")}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  {t("dashboard.invoices.table.Description")}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  {t("dashboard.invoices.table.CreatedAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv, index) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                >
                  <td className="p-4 text-sm text-gray-600">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {inv.id}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-800 font-medium">
                    {inv.user?.email || "Unknown"}
                  </td>
                  <td className="p-4 text-sm">
                    <span className="font-bold text-emerald-600 text-black">
                      ${inv.amount ? Number(inv.amount).toFixed(2) : "0.00"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {inv.description}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(inv.createdAt).toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {recentInvoices.length === 0 && (
            <div className="text-center py-12">
              <i className="hgi-stroke hgi-invoice-03 text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No recent invoices</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
