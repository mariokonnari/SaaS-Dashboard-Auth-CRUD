import { useEffect, useState } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Invoice {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  status?: "Paid" | "Pending" | "Overdue";
}

// ── Static constants outside component so they're never recreated ──

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
} as const;

const STATUS_CONFIG = {
  Paid:    { color: "#00e5b0", bg: "rgba(0,229,176,0.10)",   dot: "#00e5b0" },
  Pending: { color: "#ffd166", bg: "rgba(255,209,102,0.10)", dot: "#ffd166" },
  Overdue: { color: "#ff6b6b", bg: "rgba(255,107,107,0.10)", dot: "#ff6b6b" },
};

// Matches AdminDashboard's tooltip style — consistent across both dashboards
const darkTooltip = {
  backgroundColor: "#161c2e",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "10px",
  color: "#e8eaf6",
  fontSize: "13px",
};

export default function UserDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/user/invoices");
        setInvoices(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived data ──────────────────────────────────────────────────

  const totalSpent   = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const paidInvoices = invoices.filter((inv) => (inv.status ?? "Pending") === "Paid");
  const lastActivity = invoices.length > 0
    ? new Date(invoices[invoices.length - 1].createdAt).toLocaleDateString()
    : null;

  // Group invoices by date and sum amounts — correct approach vs .slice(-7)
  // Why: .slice(-7) gives last 7 *records*, not last 7 *days*.
  // This groups all invoices by date first, then takes the last 7 unique days.
  const spendingByDate = invoices.reduce<Record<string, number>>((acc, inv) => {
    const date = new Date(inv.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + Number(inv.amount || 0);
    return acc;
  }, {});

  const spendingData = Object.entries(spendingByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  // Count invoices by status for the pie chart
  // Why Object.entries on STATUS_CONFIG: guarantees all 3 statuses always
  // appear in the chart even if count is 0 — no missing slices.
  const statusData = Object.entries(STATUS_CONFIG).map(([status, config]) => ({
    name:  status,
    value: invoices.filter((inv) => (inv.status ?? "Pending") === status).length,
    color: config.color,
  }));

  const kpiCards = [
    {
      label:  "Total Invoices",
      value:  invoices.length,
      accent: "#6c63ff",
      bg:     "rgba(108,99,255,0.10)",
      icon:   "🧾",
    },
    {
      label:  "Total Spent",
      value:  `$${totalSpent.toFixed(2)}`,
      accent: "#00e5b0",
      bg:     "rgba(0,229,176,0.08)",
      icon:   "💳",
    },
    {
      label:  "Paid Invoices",
      value:  paidInvoices.length,
      accent: "#a78bfa",
      bg:     "rgba(167,139,250,0.08)",
      icon:   "✅",
    },
    {
      label:  "Last Activity",
      value:  lastActivity ?? "No activity yet",
      accent: "#ffd166",
      bg:     "rgba(255,209,102,0.08)",
      icon:   "🕐",
      small:  !lastActivity,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e17] p-4 md:p-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
          Welcome back 👋
        </h1>
        <p className="text-[#6b7694] text-base">Here's a summary of your account</p>
      </motion.div>

      {/* KPI Cards — now 4 across on xl, 2x2 on md */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        {kpiCards.map((card, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: card.bg, border: `1px solid ${card.accent}30` }}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-medium text-[#6b7694]">{card.label}</p>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p
              className={`font-bold ${card.small ? "text-lg" : "text-3xl"}`}
              style={{ color: card.accent }}
            >
              {card.value}
            </p>
            <div
              className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20"
              style={{ background: card.accent }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6"
      >
        {/* Spending Over Time — Line Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 border border-white/7"
          style={{ background: "#111624" }}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white">Spending Over Time</h3>
            <p className="text-sm text-[#6b7694]">Your daily spend — last 7 days</p>
          </div>

          {/* Why the empty state check: Recharts renders a blank/broken chart
              if data is an empty array. Always guard chart renders. */}
          {spendingData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-[#6b7694]">No spending data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={spendingData}>
                <defs>
                  <linearGradient id="userSpendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#6b7694" style={{ fontSize: "11px" }} />
                <YAxis stroke="#6b7694" style={{ fontSize: "11px" }} />
                <Tooltip
                  contentStyle={darkTooltip}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Spent"]}
                  cursor={{ stroke: "rgba(108,99,255,0.3)" }}
                />
                <Legend wrapperStyle={{ color: "#6b7694", fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Spent"
                  stroke="#6c63ff"
                  strokeWidth={2.5}
                  dot={{ fill: "#6c63ff", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#6c63ff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Invoice Status — Donut Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 border border-white/7"
          style={{ background: "#111624" }}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white">Invoice Status</h3>
            <p className="text-sm text-[#6b7694]">Breakdown by payment status</p>
          </div>

          {invoices.length === 0 ? (
            <div className="flex items-center justify-center h-[260px]">
              <p className="text-[#6b7694]">No invoices yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={darkTooltip}
                  formatter={(value: number, name: string) => [value, name]}
                />
                {/* Custom legend so colors match STATUS_CONFIG exactly */}
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  formatter={(value) => (
                    <span style={{ color: "#e8eaf6" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
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
          <h3 className="text-base font-bold text-white">Recent Invoices</h3>
          <p className="text-sm text-[#6b7694]">Your last 5 transactions</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/4 animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-[#6b7694]">You have no invoices yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/7">
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">ID</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">Amount</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">Description</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6b7694] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(-5).reverse().map((inv, index) => {
                  const status = inv.status ?? "Pending";
                  const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="border-b border-white/4 hover:bg-white/3 transition-colors duration-150"
                    >
                      <td className="p-3 text-sm">
                        <span className="font-mono text-xs bg-white/5 text-[#6b7694] px-2 py-1 rounded">
                          {inv.id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="p-3 text-sm font-bold text-[#00e5b0]">
                        ${Number(inv.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-[#e8eaf6]">{inv.description}</td>
                      <td className="p-3 text-sm">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                          {status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-[#6b7694]">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}