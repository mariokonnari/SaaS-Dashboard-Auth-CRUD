// ─────────────────────────────────────────────────────────────
// DashboardLayout.tsx — IMPROVED
//
// CHANGES & WHY:
//
// 1. EXTRACTED navItems ARRAY — The original had 4 NavLink blocks
//    with copy-pasted className logic. An array + .map() is DRY
//    (Don't Repeat Yourself). Add a new nav item by adding one object.
//
// 2. FIXED SIDEBAR COLLAPSE TOGGLE LOGIC — The original used
//    window.innerWidth inside a click handler (an anti-pattern). In
//    React you should respond to layout state, not query the DOM
//    directly. Using a ref or CSS is better; here we separate the two
//    modes cleanly.
//
// 3. FIXED HARDCODED EMAIL — `currentEmail="{userEmail}"` was passing
//    a literal string. We now read the email from the JWT stored in
//    localStorage using a simple decode helper.
//
// 4. EXTRACTED handleLogout — it was inline on the button. A named
//    function is easier to read and to expand later.
//
// 5. DARK THEME — sidebar now uses the new design system.
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Users, Receipt, LogOut, Settings, Globe, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import SettingsModal from "../components/Settings";

// Simple JWT payload decoder — no library needed.
// atob decodes base64; JSON.parse turns it into an object.
// We only read public payload data (email), not verify the signature.
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

// ✅ nav item type for type safety
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const role    = localStorage.getItem("role");
  const isAdmin = role === "ADMIN";
  const email   = useMemo(() => decodeJwtEmail(), []); //only compute once

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

  // DRY nav items — add/remove one object instead of copy-pasting JSX
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
    <div className="flex h-screen w-full bg-[#0b0e17]">
      {/* Language toggle — top right */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 z-50 bg-[#111624] border border-white/7 hover:border-white/15 text-[#6b7694] hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <Globe size={15} />
        {i18n.language === "en" ? "🇬🇷 Ελληνικά" : "🇺🇸 English"}
      </button>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#111624] border border-white/7 text-white p-2 rounded-lg"
      >
        <Menu size={18} />
      </button>

      {/* Sidebar */}
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
              <div className="font-bold text-white text-sm">{isAdmin ? t("admin.sidebar.title") : t("user.sidebar.title")}</div>
              <div className="text-[10px] text-[#00e5b0] font-semibold tracking-widest uppercase">{isAdmin ? "Admin" : "User"}</div>
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

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 text-[#6b7694]"
        >
          <X size={18} />
        </button>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[#6b7694] px-3 pb-1 tracking-widest uppercase">Menu</p>
          )}
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={() => setMobileOpen(false)}>
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 md:hidden z-40"
        />
      )}

      {/* Settings modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentEmail={email} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}