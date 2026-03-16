import { useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Users, Receipt, LogOut, Settings, Globe, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import SettingsModal from "../components/Settings";

function decodeJwtEmail(): string {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email ?? "";
  } catch {
    return "";
  }
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const role    = localStorage.getItem("role");
  const isAdmin = role === "ADMIN";
  const email   = useMemo(() => decodeJwtEmail(), []);

  const [collapsed,      setCollapsed]      = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "gr" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const navItems: NavItem[] = [
    { to: isAdmin ? "/admin/dashboard" : "/user/dashboard", label: t("sidebar.dashboard"), icon: <LayoutDashboard size={18} /> },
    { to: isAdmin ? "/admin/products"  : "/user/products",  label: t("sidebar.products"),  icon: <Package size={18} /> },
    { to: isAdmin ? "/admin/invoices"  : "/user/invoices",  label: t("sidebar.invoices"),  icon: <Receipt size={18} /> },
    ...(isAdmin ? [{ to: "/admin/users", label: t("sidebar.users"), icon: <Users size={18} /> }] : []),
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 py-2 px-3 rounded-xl text-sm transition-colors duration-150 ${
      isActive
        ? "bg-[#6c63ff]/15 text-[#6c63ff] font-semibold"
        : "text-[#6b7694] hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="flex h-screen w-full bg-[#0b0e17] overflow-hidden">
      {/*
        WHY overflow-hidden on the root:
        Without it, the sidebar sliding in/out can cause a horizontal
        scrollbar to flash on mobile during the CSS transition.
      */}

      {/* ── Top bar (mobile only) ──────────────────────────────────────
          WHY a dedicated top bar instead of floating buttons:
          Floating buttons (fixed top-4 left-4 / right-4) overlap page
          content and fight each other on narrow screens. A proper top
          bar reserves space, so page content starts below it, not under it.
      */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#111624] border-b border-white/7 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* App name in center so it doesn't feel empty */}
        <span className="text-white font-semibold text-sm">
          {isAdmin ? t("admin.sidebar.title") : t("user.sidebar.title")}
        </span>

        <button
          onClick={toggleLanguage}
          className="text-[#6b7694] hover:text-white px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-white/10 transition-colors"
        >
          <Globe size={14} />
          {i18n.language === "en" ? "🇬🇷" : "🇺🇸"}
          {/* WHY just the flag on mobile: saves space. Full label on desktop below. */}
        </button>
      </div>

      {/* ── Language toggle (desktop only) ────────────────────────────
          Kept as a floating button on desktop where there's room for it.
      */}
      <button
        onClick={toggleLanguage}
        className="hidden md:flex fixed top-4 right-4 z-50 bg-[#111624] border border-white/7 hover:border-white/15 text-[#6b7694] hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium items-center gap-2 transition-colors"
      >
        <Globe size={15} />
        {i18n.language === "en" ? "🇬🇷 Ελληνικά" : "🇺🇸 English"}
      </button>

      {/* ── Sidebar ───────────────────────────────────────────────────
          WHY translate-x-0 / -translate-x-full:
          The sidebar is always in the DOM (good for accessibility and
          avoiding layout flashes), but visually hidden off-screen on
          mobile until mobileOpen is true. The overlay below handles
          closing it by clicking outside.
      */}
      <aside
        className={`
          fixed md:relative top-0 left-0 h-screen bg-[#111624] border-r border-white/7
          flex flex-col transition-all duration-300 ease-in-out z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${collapsed ? "md:w-16" : "md:w-60"} w-60
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/7 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c63ff] to-[#00e5b0] flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            N
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-white text-sm">
                {isAdmin ? t("admin.sidebar.title") : t("user.sidebar.title")}
              </div>
              <div className="text-[10px] text-[#00e5b0] font-semibold tracking-widest uppercase">
                {isAdmin ? "Admin" : "User"}
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex absolute -right-3 top-12 bg-[#111624] border border-white/7 text-[#6b7694] w-6 h-6 rounded-full items-center justify-center hover:text-white transition-colors"
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 text-[#6b7694] hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[#6b7694] px-3 pb-1 tracking-widest uppercase">
              Menu
            </p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/7 space-y-1">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 py-2 px-3 rounded-xl text-sm text-[#6b7694] hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings size={18} className="flex-shrink-0" />
            {!collapsed && <span>{t("sidebar.settings")}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-2 px-3 rounded-xl text-sm text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>{t("sidebar.logout")}</span>}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-2 mt-3 bg-[#161c2e] rounded-xl px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#00e5b0] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {email ? email[0].toUpperCase() : "?"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{email || "Unknown"}</p>
                <p className="text-[10px] text-[#6b7694]">{isAdmin ? "Administrator" : "User"}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay — clicking outside closes the sidebar */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 md:hidden z-40"
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentEmail={email}
      />

      {/* ── Main content ──────────────────────────────────────────────
          WHY pt-14 md:pt-0:
          On mobile the fixed top bar is 14 (h-14 = 56px). Without this
          padding, page content starts at y=0 and gets hidden behind the
          top bar. On md+ the top bar doesn't exist so no padding needed.
      */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}