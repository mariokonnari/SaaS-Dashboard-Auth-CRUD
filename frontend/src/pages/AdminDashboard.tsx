// ─────────────────────────────────────────────────────────────
// AdminDashboard.tsx — REDESIGNED (dark theme)
//
// CHANGES & WHY:
//
// 1. ALL COLORS CONVERTED TO DARK THEME — removed all bg-white,
//    bg-gray-*, text-gray-800, from-blue-50 etc. and replaced with
//    the same design tokens used in DashboardLayout and Login.
//
// 2. FIXED $NaN BUG — totalRevenue now wraps every amount in
//    Number() so string values from the API don't break the sum.
//
// 3. CHART COLORS UPDATED — CartesianGrid, XAxis, YAxis, Tooltip
//    all had light theme colors (#E5E7EB, white bg). Updated to
//    match the dark surface.
//
// 4. KPI CARD GRADIENT BUG FIXED — the original had a broken
//    template literal: `text-gray-700` was hardcoded after the
//    gradient clip, so the gradient text never actually showed.
//    Fixed by using inline style for the value color instead.
//
// 5. TABLE UPDATED — border colors, hover states, and text colors
//    all converted to dark equivalents.
// ─────────────────────────────────────────────────────────────

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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import type { User, Invoice, Product } from "../types/types"
import LiveActivityFeed from "../components/LiveActivityFeed";
import { supabase } from "../config/supabase";

// KPI card config — each card has its own accent color
const KPI_COLORS = [
  { accent: "#6c63ff", bg: "rgba(108,99,255,0.10)", border: "rgba(108,99,255,0.2)" },
  { accent: "#00e5b0", bg: "rgba(0,229,176,0.08)", border: "rgba(0,229,176,0.18)" },
  { accent: "#ffd166", bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.18)" },
  { accent: "#ff6b6b", bg: "rgba(255,107,107,0.08)", border: "rgba(255,107,107,0.18)" },
];

const PIE_COLORS = ["#6c63ff", "#00e5b0", "#ffd166", "#ff6b6b", "#a78bfa", "#38bdf8"];

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const { t } = useTranslation();

  // Number() wrapping fixes the $NaN bug — API may return strings
  const totalUsers = users.length;
  const totalProducts = products.length;
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  const revenuePerUser = users.map((user) => ({
    name: user.email.split("@")[0], //just the username part, looks cleaner on chart
    value: invoices
      .filter((inv) => inv.user?.id === user.id)
      .reduce((sum, inv) => sum + Number(inv.amount), 0),
  })).filter((u) => u.value > 0); // hide users with no revenue

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

    const channel = supabase
      .channel("invoices-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Invoice"},
        async () => {
          try {
            const res = await api.get("admin/invoices");
            setInvoices(res.data);
          } catch (err) {
            console.error("Realtime refetch error:", err);
          }
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
  }, []);

  const revenueByDate = invoices.reduce<Record<string, number>>((acc, inv) => {
    const date = new Date(inv.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + Number(inv.amount);
    return acc;
  }, {});

  const revenueData =Object.entries(revenueByDate)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7); // last 7 unique days

  const invoicesPerUser = users.map((user) => ({
    user: user.email,
    count: invoices.filter((inv) => inv.user?.id === user.id).length,
  }));

  const recentInvoices = invoices.slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  } as const;

  const kpiCards = [
    { title: t("dashboard.card1"), value: totalUsers, icon: "👥" },
    { title: t("dashboard.card2"), value: totalProducts, icon: "📦" },
    { title: t("dashboard.card3"), value: totalInvoices, icon: "🧾" },
    { title: t("dashboard.card4"), value: `$${totalRevenue.toFixed(2)}`, icon: "💰" },
  ];

  // Shared dark tooltip style for both charts
  const darkTooltip = {
    backgroundColor: "#161c2e",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "10px",
    color: "#e8eaf6",
    fontSize: "13px",
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] p-4 md:p-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
          {t("dashboard.title")}
        </h1>
        <p className="text-[#6b7694] text-base">
          {t("dashboard.h1")}
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        {kpiCards.map((card, index) => {
          const colors = KPI_COLORS[index];
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-[#6b7694]">{card.title}</p>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.accent }}>
                {card.value}
              </p>
              {/* Decorative glow blob */}
              <div
                className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20"
                style={{ background: colors.accent }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6"
      >
        {/* Revenue Line Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 border border-white/7"
          style={{ background: "#111624" }}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white">
              {t("dashboard.card5.title")}
            </h3>
            <p className="text-sm text-[#6b7694]">{t("dashboard.card5.h2")}</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Dark grid lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#6b7694" style={{ fontSize: "11px" }} />
              <YAxis stroke="#6b7694" style={{ fontSize: "11px" }} />
              <Tooltip contentStyle={darkTooltip} cursor={{ stroke: "rgba(108,99,255,0.3)" }} />
              <Legend wrapperStyle={{ color: "#6b7694", fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6c63ff"
                strokeWidth={2.5}
                dot={{ fill: "#6c63ff", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#6c63ff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Distribution Pie Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 border border-white/7"
          style={{ background: "#111624" }}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white">Revenue Distribution</h3>
            <p className="text-sm text-[#6b7694]">Share of total revenue per user</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={revenuePerUser}
                cx="50%"
                cy="50%"
                innerRadius={65}   // makes it a donut — more modern than a filled pie
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {revenuePerUser.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={darkTooltip}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
              />
              <Legend
                wrapperStyle={{ color: "#6b7694", fontSize: "12px" }}
                formatter={(value) => (
                  <span style={{ color: "#e8eaf6" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Invoices Per User Bar Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 border border-white/7"
          style={{ background: "#111624" }}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white">
              {t("dashboard.card6.title")}
            </h3>
            <p className="text-sm text-[#6b7694]">{t("dashboard.card6.h2")}</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={invoicesPerUser}>
              <defs>
                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5b0" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#00e5b0" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="user" stroke="#6b7694" style={{ fontSize: "11px" }} />
              <YAxis stroke="#6b7694" style={{ fontSize: "11px" }} />
              <Tooltip contentStyle={darkTooltip} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend wrapperStyle={{ color: "#6b7694", fontSize: "12px" }} />
              <Bar dataKey="count" fill="url(#colorBar)" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      {/* Recent Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl p-6 border border-white/7"
        style={{ background: "#111624" }}
      >
        <div className="mb-5">
          <h3 className="text-base font-bold text-white">
            {t("dashboard.invoices.table.title")}
          </h3>
          <p className="text-sm text-[#6b7694]">{t("dashboard.invoices.table.h2")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/7">
                <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">ID</th>
                <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">
                  {t("dashboard.invoices.table.UserEmail")}
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">
                  {t("dashboard.invoices.table.Amount")}
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">
                  {t("dashboard.invoices.table.Description")}
                </th>
                <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">
                  {t("dashboard.invoices.table.CreatedAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv, index) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="border-b border-white/4 hover:bg-white/3 transition-colors duration-150"
                >
                  {/* Dark mono ID pill */}
                  <td className="p-3 text-sm">
                    <span className="font-mono text-xs bg-white/5 text-[#6b7694] px-2 py-1 rounded">
                      {inv.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="p-3 text-sm text-[#e8eaf6] font-medium">
                    {inv.user?.email || "Unknown"}
                  </td>
                  <td className="p-3 text-sm font-bold text-[#00e5b0]">
                    ${inv.amount ? Number(inv.amount).toFixed(2) : "0.00"}
                  </td>
                  <td className="p-3 text-sm text-[#6b7694]">
                    {inv.description}
                  </td>
                  <td className="p-3 text-sm text-[#6b7694]">
                    {new Date(inv.createdAt).toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {recentInvoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-[#6b7694]">No recent invoices</p>
            </div>
          )}
        </div>
      </motion.div>
      <div className="mt-4">
        <LiveActivityFeed />
      </div>
    </div>
  );
}