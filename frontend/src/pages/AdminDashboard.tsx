import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Package, Receipt, DollarSign } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar,
  CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import type { User, Invoice, Product } from "../types/types";
import LiveActivityFeed from "../components/LiveActivityFeed";
import { supabase } from "../config/supabase";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const chartTooltip = {
  backgroundColor: "#111113",
  border: "1px solid #27272a",
  borderRadius: "8px",
  color: "#fafafa",
  fontSize: "12px",
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#09090b] p-4 md:p-8 animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 bg-[#27272a] rounded-md" />
        <div className="h-4 w-64 bg-[#1c1c1e] rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl h-24 bg-[#111113] border border-[#27272a]" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl h-72 bg-[#111113] border border-[#27272a]" />
        ))}
      </div>
      <div className="rounded-xl bg-[#111113] border border-[#27272a] p-6 space-y-3">
        <div className="h-4 w-36 bg-[#27272a] rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-[#1c1c1e] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

function KpiCard({ label, value, icon, trend }: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-[#111113] border border-[#27272a] rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#71717a] font-medium">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-[#1c1c1e] flex items-center justify-center text-[#71717a]">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-[#fafafa]">{value}</p>
      {trend && <p className="text-xs text-[#52525b] mt-1">{trend}</p>}
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);

  const { t } = useTranslation();

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  const revenuePerUser = users
    .map((user) => ({
      name: user.email.split("@")[0],
      value: invoices.filter((inv) => inv.user?.id === user.id).reduce((s, inv) => s + Number(inv.amount), 0),
    }))
    .filter((u) => u.value > 0);

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
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const channel = supabase.channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "Invoice" }, async () => {
        const res = await api.get("/admin/invoices");
        setInvoices(res.data);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "Product" }, async () => {
        const res = await api.get("/admin/products");
        setProducts(res.data);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "User" }, async () => {
        const res = await api.get("/admin/users");
        setUsers(res.data);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const revenueByDate = invoices.reduce<Record<string, number>>((acc, inv) => {
    const date = new Date(inv.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + Number(inv.amount);
    return acc;
  }, {});

  const revenueData = Object.entries(revenueByDate)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  const invoicesPerUser = users.map((user) => ({
    user: user.email.split("@")[0],
    count: invoices.filter((inv) => inv.user?.id === user.id).length,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  } as const;

  const itemVariants = {
    hidden:  { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120 } },
  } as const;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#09090b] p-4 md:p-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-[#fafafa] mb-1">{t("dashboard.title")}</h1>
        <p className="text-sm text-[#71717a]">{t("dashboard.h1")}</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: t("dashboard.card1"), value: users.length,                   icon: <Users size={15} /> },
          { label: t("dashboard.card2"), value: products.length,                icon: <Package size={15} /> },
          { label: t("dashboard.card3"), value: invoices.length,                icon: <Receipt size={15} /> },
          { label: t("dashboard.card4"), value: `$${totalRevenue.toFixed(2)}`,  icon: <DollarSign size={15} /> },
        ].map((card, i) => (
          <motion.div key={i} variants={itemVariants}>
            <KpiCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6"
      >
        {/* Revenue Line Chart */}
        <motion.div variants={itemVariants} className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#fafafa]">{t("dashboard.card5.title")}</h3>
            <p className="text-xs text-[#71717a] mt-0.5">{t("dashboard.card5.h2")}</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1e" />
              <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: "11px" }} tick={{ fill: "#52525b" }} />
              <YAxis stroke="#52525b" style={{ fontSize: "11px" }} tick={{ fill: "#52525b" }} />
              <Tooltip contentStyle={chartTooltip} cursor={{ stroke: "#3b82f6", strokeOpacity: 0.3 }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#71717a" }} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Distribution Donut */}
        <motion.div variants={itemVariants} className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#fafafa]">Revenue Distribution</h3>
            <p className="text-xs text-[#71717a] mt-0.5">Share of total revenue per user</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={revenuePerUser} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                paddingAngle={3} dataKey="value">
                {revenuePerUser.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltip} formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
              <Legend wrapperStyle={{ fontSize: "12px" }} formatter={(v) => <span style={{ color: "#a1a1aa" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Invoices Per User Bar Chart */}
        <motion.div variants={itemVariants} className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#fafafa]">{t("dashboard.card6.title")}</h3>
            <p className="text-xs text-[#71717a] mt-0.5">{t("dashboard.card6.h2")}</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={invoicesPerUser}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1e" />
              <XAxis dataKey="user" stroke="#52525b" style={{ fontSize: "11px" }} tick={{ fill: "#52525b" }} />
              <YAxis stroke="#52525b" style={{ fontSize: "11px" }} tick={{ fill: "#52525b" }} />
              <Tooltip contentStyle={chartTooltip} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#71717a" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      {/* Recent Invoices Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-[#111113] border border-[#27272a] rounded-xl p-6 mb-6">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-[#fafafa]">{t("dashboard.invoices.table.title")}</h3>
          <p className="text-xs text-[#71717a] mt-0.5">{t("dashboard.invoices.table.h2")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1c1c1e]">
                {["ID", t("dashboard.invoices.table.UserEmail"), t("dashboard.invoices.table.Amount"),
                  t("dashboard.invoices.table.Description"), t("dashboard.invoices.table.CreatedAt")].map((h) => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-[#52525b] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map((inv, index) => (
                <motion.tr key={inv.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-[#1c1c1e] hover:bg-[#161618] transition-colors duration-100"
                >
                  <td className="p-3">
                    <span className="font-mono text-xs bg-[#1c1c1e] text-[#71717a] px-2 py-1 rounded">
                      {inv.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="p-3 text-sm text-[#fafafa]">{inv.user?.email ?? "Unknown"}</td>
                  <td className="p-3 text-sm font-semibold text-[#10b981]">
                    ${inv.amount != null ? Number(inv.amount).toFixed(2) : "0.00"}
                  </td>
                  <td className="p-3 text-sm text-[#71717a]">{inv.description}</td>
                  <td className="p-3 text-sm text-[#52525b]">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#71717a] text-sm">No invoices yet</p>
            </div>
          )}
        </div>
      </motion.div>

      <LiveActivityFeed />
    </div>
  );
}
