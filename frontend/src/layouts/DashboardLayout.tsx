import { useState, useMemo, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Users, Receipt, LogOut, Settings, Globe, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [isMobile,       setIsMobile]       = useState(window.innerWidth < 768);

  const { i18n, t } = useTranslation();

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const toggleLanguage = () => {
    const next = i18n.language === "en" ? "gr" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const navItems: NavItem[] = [
    { to: isAdmin ? "/admin/dashboard" : "/user/dashboard", label: t("sidebar.dashboard"), icon: <LayoutDashboard size={16} /> },
    { to: isAdmin ? "/admin/products"  : "/user/products",  label: t("sidebar.products"),  icon: <Package size={16} /> },
    { to: isAdmin ? "/admin/invoices"  : "/user/invoices",  label: t("sidebar.invoices"),  icon: <Receipt size={16} /> },
    ...(isAdmin ? [{ to: "/admin/users", label: t("sidebar.users"), icon: <Users size={16} /> }] : []),
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 py-2 px-3 rounded-md text-sm transition-colors duration-150 ${
      isActive
        ? "bg-[#3b82f6]/10 text-[#3b82f6] font-medium"
        : "text-[#71717a] hover:bg-[#1c1c1e] hover:text-[#fafafa]"
    }`;

  return (
    <div className="flex h-screen w-full bg-[#09090b] overflow-hidden">

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 bg-[#111113] border-b border-[#27272a] flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="text-[#71717a] hover:text-[#fafafa] p-1.5 rounded-md hover:bg-[#1c1c1e] transition-colors">
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#3b82f6] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
            </svg>
          </div>
          <span className="text-[#fafafa] font-semibold text-sm">Nexus</span>
        </div>
        <button onClick={toggleLanguage} className="text-[#71717a] hover:text-[#fafafa] p-1.5 rounded-md hover:bg-[#1c1c1e] transition-colors">
          <Globe size={16} />
        </button>
      </div>

      {/* Language toggle (desktop) */}
      <button
        onClick={toggleLanguage}
        className="hidden md:flex fixed top-4 right-4 z-50 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#71717a] hover:text-[#fafafa] border border-[#27272a] bg-[#111113] hover:border-[#3f3f46] transition-colors"
      >
        <Globe size={13} />
        {i18n.language === "en" ? "🇬🇷 Ελληνικά" : "🇺🇸 English"}
      </button>

      {/* Sidebar */}
      <aside
        style={{ transform: (!isMobile || mobileOpen) ? "translateX(0)" : "translateX(-100%)" }}
        className={`fixed top-0 left-0 h-screen bg-[#111113] border-r border-[#27272a] flex flex-col transition-transform duration-250 ease-in-out z-50 ${collapsed ? "w-14" : "w-56"}`}
      >
        {/* Logo */}
        <div className={`h-14 border-b border-[#27272a] flex items-center gap-2.5 flex-shrink-0 ${collapsed ? "justify-center px-0" : "px-4"}`}>
          <div className="w-7 h-7 rounded-md bg-[#3b82f6] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-semibold text-[#fafafa] text-sm tracking-tight">Nexus</span>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex absolute -right-3 top-[52px] w-6 h-6 rounded-full bg-[#111113] border border-[#27272a] text-[#71717a] items-center justify-center hover:text-[#fafafa] transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)} className="md:hidden absolute top-3.5 right-3.5 text-[#71717a] hover:text-[#fafafa] transition-colors">
          <X size={16} />
        </button>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto mt-1">
          {!collapsed && (
            <p className="text-[10px] font-medium text-[#52525b] px-3 pb-1 pt-1 uppercase tracking-widest">
              Navigation
            </p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[#27272a] space-y-0.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-md text-sm text-[#71717a] hover:bg-[#1c1c1e] hover:text-[#fafafa] transition-colors ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? t("sidebar.settings") : undefined}
          >
            <Settings size={16} className="flex-shrink-0" />
            {!collapsed && <span>{t("sidebar.settings")}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-md text-sm text-[#71717a] hover:bg-[#ef4444]/8 hover:text-[#ef4444] transition-colors ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? t("sidebar.logout") : undefined}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>{t("sidebar.logout")}</span>}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-2.5 mt-2 px-3 py-2.5 rounded-md bg-[#161618]">
              <div className="w-6 h-6 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] text-xs font-semibold flex-shrink-0">
                {email ? email[0].toUpperCase() : "?"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-[#fafafa] truncate">{email || "Unknown"}</p>
                <p className="text-[10px] text-[#52525b]">{isAdmin ? "Admin" : "Member"}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/50 md:hidden z-40" />
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentEmail={email} />

      {/* Main content */}
      <main
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          left: isMobile ? 0 : collapsed ? "3.5rem" : "14rem",
          paddingTop: isMobile ? "3rem" : 0,
          overflowY: "auto",
          transition: "left 0.25s ease-in-out",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
