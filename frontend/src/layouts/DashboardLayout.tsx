import React from "react";
import { NavLink, Outlet, useNavigate} from "react-router-dom";
import { LayoutDashboard, Package, Users, Receipt, LogOut, Settings, Globe } from "lucide-react";
import SettingsModal from "../components/Settings";
import { useTranslation } from "react-i18next";

export default function DashboardLayout() {
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const isAdmin = role === "ADMIN";
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
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

    return (
        <div className="flex h-screen w-full bg-white">
            {/*Language switch button*/}
            <button
                onClick={toggleLanguage}
                className="fixed top-4 right-4 z-550 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg shadow font-semibold"
            >
                <Globe size={18} />
                {i18n.language === "en" ? "🇬🇷 Ελληνικά" : "🇺🇸 English"}
            </button>
            {/*Sidebar*/}
            {/*Mobile menu button*/}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 absolute top-4 left-4 bg-gray-800 text-white rounded z-50"
            >
                ☰
            </button>
            <aside className={`
            fixed md:relative top-0 left-0 h-screen bg-gray-800 text-white flex flex-col transform transition-transform duration-300 ease-in-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
            ${collapsed ? "md:w-20" : "md:w-64"} w-64 z-50`}
            >
                <button
                    onClick={() => {
                        if (window.innerWidth < 768) {
                            setMobileOpen(false);
                        } else {
                            setCollapsed(!collapsed);
                        }
                    }}
                    className="absolute top-4 right-[-12px] bg-gray-800 text-white p-1 rounded-full shadow hover:bg-gray-700 transition"
                >
                    {collapsed ? "<" : ">"}
                </button>
                <div className="p-6 text-x1 font-bold border-b border-gray-700 ">
                    {collapsed ? "" : isAdmin ? t("admin.sidebar.title") : t("user.sidebar.title")}
                </div>
                <nav className="flex-1 p-4 space-y-4">
                    {/*Dashboard Section*/}
                    <div>
                        <NavLink to={isAdmin ? "/admin/dashboard" : "/user/dashboard"} className={({isActive}) => `flex items-center gap-3 py-2 px-4 rounded transition-colors duration-200 ${isActive
                            ? "bg-gray-700 text-white font-semibold"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}><LayoutDashboard size={18} />
                        <span className={`${collapsed ? "hidden" : "inline"}`}>
                            {t("sidebar.dashboard")}
                        </span>
                        </NavLink>
                        <NavLink to={isAdmin ? "/admin/products" : "/user/products"} className={({isActive}) => `flex items-center gap-3 py-2 px-4 rounded transition-colors duration-200 ${isActive
                            ? "bg-gray-700 text-white font-semibold"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}><Package size={18} />
                        <span className={`${collapsed ? "hidden" : "inline"}`}>
                            {t("sidebar.products")}
                        </span>
                        </NavLink>
                        {isAdmin && (<NavLink to="/admin/users" className={({isActive}) => `flex items-center gap-3 py-2 px-4 rounded transition-colors duration-200 ${isActive
                            ? "bg-gray-700 text-white font-semibold"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}><Users size={18} />
                        <span className={`${collapsed ? "hidden" : "inline"}`}>
                            {t("sidebar.users")}
                        </span>
                        </NavLink>)}
                        <NavLink to={isAdmin ? "/admin/invoices" : "/user/invoices"} className={({isActive}) => `flex items-center gap-3 py-2 px-4 rounded transition-colors duration-200 ${isActive
                            ? "bg-gray-700 text-white font-semibold"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}><Receipt size={18} />
                        <span className={`${collapsed ? "hidden" : "inline"}`}>
                            {t("sidebar.invoices")}
                        </span>
                        </NavLink>
                    </div>
                </nav>
                <div className="flex flex-col gap-1 p-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="inline-flex items-center gap-3 mb-2 py-2 px-4 rounded-xl hover:bg-gray-10 transition-all duration-200"
                    >
                        <Settings size={18}/>
                        {!collapsed && <span>{t("sidebar.settings")}</span>}
                    </button>
                    <SettingsModal 
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        currentEmail="{userEmail}"
                    />
                        <button onClick={handleLogout}
                        className="inline-flex items-center gap-3 mb-2 py-2 px-4 bg-red-500 rounded-xl hover:bg-red-600 transition-all duration-200"><LogOut size={18} />
                        {!collapsed && <span>{t("sidebar.logout")}</span>}
                    </button>
                </div>
            </aside>
            {/*Overlay when mobile menu is open*/}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
                ></div>
            )}
            {/*Main Content*/}
            <main className="flex-1 overflow-y-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}