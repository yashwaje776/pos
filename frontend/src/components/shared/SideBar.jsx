import {
  BarChart3,
  Home,
  Menu,
  ShoppingCart,
  Table2,
  Plus,
  Users,
  ChefHat,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CreateOrderModal from "../orderspage/CreateOrderModal";

/* ================= ROLES ================= */
const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  WAITER: "waiter",
  CASHIER: "cashier",
  KITCHEN: "kitchen",
};

/* ================= SIDEBAR ITEM ================= */
const SidebarItem = React.memo(
  ({ icon, label, to, collapsed, onClick }) => (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl 
        transition-all duration-200 text-sm font-medium border
        ${isActive
          ? "bg-yellow-500/10 text-yellow-400 border-yellow-400/30"
          : "text-zinc-400 border-transparent hover:bg-white/5"
        }`
      }
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
);

/* ================= MENU CONFIG ================= */
const MENU_ITEMS = [
  {
    icon: <Home size={18} />,
    label: "Dashboard",
    to: "/",
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER],
  },
  {
    icon: <ShoppingCart size={18} />,
    label: "Orders",
    to: "/orders",
    roles: [
      ROLES.ADMIN,
      ROLES.MANAGER,
      ROLES.CASHIER,
      ROLES.WAITER,
      ROLES.KITCHEN,
    ],
  },
  {
    icon: <Table2 size={18} />,
    label: "Tables",
    to: "/tables",
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER],
  },
  {
    icon: <ChefHat size={18} />,
    label: "Kitchen",
    to: "/kitchen",
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN],
  },
  {
    icon: <Receipt size={18} />,
    label: "Billing",
    to: "/billing",
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  },
  {
    icon: <Menu size={18} />,
    label: "Menu",
    to: "/menu",
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    icon: <Users size={18} />,
    label: "Staff",
    to: "/staff",
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    icon: <BarChart3 size={18} />,
    label: "Analytics",
    to: "/analytics",
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
];

/* ================= MAIN ================= */
const SideBar = () => {
  const user = useSelector((state) => state.user?.user);
  const role = user?.role || ROLES.WAITER;

  const navigate = useNavigate();

  /* ================= COLLAPSE STATE ================= */
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sidebarCollapsed", collapsed);
    } catch { }
  }, [collapsed]);

  /* ================= UI STATE ================= */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ================= FILTERED MENU ================= */
  const filteredMenu = useMemo(() => {
    return MENU_ITEMS.filter((item) => item.roles.includes(role));
  }, [role]);

  /* ================= HANDLERS ================= */
  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleNavigate = useCallback(() => {
    navigate("/");
    setMobileOpen(false);
  }, [navigate]);

  const handleAddOrder = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  /* ================= ESC CLOSE MOBILE ================= */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* ================= MOBILE BUTTON ================= */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-lg"
      >
        <Menu size={20} />
      </button>

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen border-r border-zinc-800 p-4 flex flex-col
        bg-zinc-900/80 backdrop-blur-xl transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        sm:translate-x-0 sm:static`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div
            className={`flex items-center cursor-pointer ${collapsed ? "justify-center w-full" : "gap-2 ml-2"
              }`}
            onClick={handleNavigate}
          >
            <ChefHat className="text-yellow-400" size={22} />
            {!collapsed && <h1 className="text-lg font-bold">Restro</h1>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hidden sm:block"
            >
              {collapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 sm:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================= MENU ================= */}
        <nav className="space-y-2 flex-1">
          {filteredMenu.map((item) => (
            <SidebarItem
              key={item.to}
              {...item}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* ================= ADD ORDER ================= */}
        {[ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER].includes(role) && (
          <button
            onClick={handleAddOrder}
            className="mt-4 flex items-center justify-center gap-2 
            bg-yellow-500 text-white rounded-xl py-3 hover:bg-yellow-600 transition"
          >
            <Plus size={18} />
            {!collapsed && "Add Order"}
          </button>
        )}
      </aside>

      {/* ================= OVERLAY ================= */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
        />
      )}

      {/* ================= MODAL ================= */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default SideBar;