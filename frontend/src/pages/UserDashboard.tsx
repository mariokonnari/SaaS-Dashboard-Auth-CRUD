import { useEffect, useState } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";
import { Receipt, DollarSign, CheckCircle, Clock } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import type { InvoiceStatus } from "../types/types";

interface Invoice {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  status: InvoiceStatus;
}

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const itemVariants = {
  hidden:  { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120 } },
} as const;

const STATUS_CONFIG: Record<InvoiceStatus, { color: string; bg: string }> = {
  PAID:      { color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  PENDING:   { color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  CANCELLED: { color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
};

const PIE_COLORS: Record<InvoiceStatus, string> = {
  PAID:      "#10b981",
  PENDING:   "#f59e0b",
  CANCELLED: "#ef4444",
};

const chartTooltip = {
  backgroundColor: "#111113",
  border: "1px solid #27272a",
  borderRadius: "8px",
  color: "#fafafa",
  fontSize: "12px",
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

  const totalSpent   = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
  const lastActivity = invoices.length > 0
    ? new Date(invoices[0].createdAt).toLocaleDateString()
    : null;

  const spendingByDate = invoices.reduce<Record<string, number>>((acc, inv) => {
    const date = new Date(inv.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + Number(inv.amount || 0);
    return acc;
  }, {});

  const spendingData = Object.entries(spendingByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  const statusData = (["PAID", "PENDING", "CANCELLED"] as InvoiceStatus[]).map((s) => ({
    name:  s.charAt(0) + s.slice(1).toLowerCase(),
    value: invoices.filter((inv) => inv.status === s).length,
    color: PIE_COLORS[s],
  }));

  const kpiCards = [
    { label: "Total Invoices", value: invoices.length,           icon: <Receipt size={15} /> },
    { label: "Total Spent",    value: `$${totalSpent.toFixed(2)}`, icon: <DollarSign size={15} /> },
    { label: "Paid Invoices",  value: paidInvoices.length,       icon: <CheckCircle size={15} /> },
    { label: "Last Activity",  value: lastActivity ?? "—",       icon: <Clock size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] p-4 md:p-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-[#fafafa] mb-1">Dashboard</h1>
        <p className="text-sm text-[#71717a]">Here's a summary of your account</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        {kpiCards.map((card, i) => (
          <motion.div key={i} variants={itemVariants}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="bg-[#111113] border border-[#27272a] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[#71717a] font-medium">{card.label}</p>
              <div className="w-8 h-8 rounded-lg bg-[#1c1c1e] flex items-center justify-center text-[#71717a]">
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#fafafa]">{card.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6"
      >
        {/* Spending Over Time */}
        <motion.div variants={itemVariants} className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#fafafa]">Spending Over Time</h3>
            <p className="text-xs text-[#71717a] mt-0.5">Your daily spend — last 7 days</p>
          </div>
          {spendingData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px]">
              <p className="text-sm text-[#71717a]">No spending data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1e" />
                <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: "11px" }} tick={{ fill: "#52525b" }} />
                <YAxis stroke="#52525b" style={{ fontSize: "11px" }} tick={{ fill: "#52525b" }} />
                <Tooltip contentStyle={chartTooltip} formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]}
                  cursor={{ stroke: "#3b82f6", strokeOpacity: 0.3 }} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#71717a" }} />
                <Line type="monotone" dataKey="amount" name="Spent" stroke="#3b82f6" strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Invoice Status Donut */}
        <motion.div variants={itemVariants} className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#fafafa]">Invoice Status</h3>
            <p className="text-xs text-[#71717a] mt-0.5">Breakdown by payment status</p>
          </div>
          {invoices.length === 0 ? (
            <div className="flex items-center justify-center h-[220px]">
              <p className="text-sm text-[#71717a]">No invoices yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltip} />
                <Legend wrapperStyle={{ fontSize: "12px" }}
                  formatter={(v) => <span style={{ color: "#a1a1aa" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>

      {/* Recent Invoices Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-[#111113] border border-[#27272a] rounded-xl p-6">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-[#fafafa]">Recent Invoices</h3>
          <p className="text-xs text-[#71717a] mt-0.5">Your last 5 transactions</p>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-[#1c1c1e]" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-[#71717a]">No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1c1c1e]">
                  {["ID", "Amount", "Description", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left p-3 text-xs font-medium text-[#52525b] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((inv, index) => {
                  const sc = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.PENDING;
                  return (
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
                      <td className="p-3 text-sm font-semibold text-[#10b981]">
                        ${Number(inv.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-[#a1a1aa]">{inv.description}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                          style={{ background: sc.bg, color: sc.color }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.color }} />
                          {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-[#52525b]">
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
