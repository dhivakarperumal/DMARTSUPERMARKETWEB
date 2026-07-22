import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  BarChart3,
  X,
  ChevronDown,
  ChevronRight,
  Tag,
  List,
  Layers,
  Truck,
  XCircle,
  Archive,
  Video,
  Gift,
  Star,
  CreditCard,
  CalendarCheck,
  FileText,
  Wallet,
  Home,
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";

// Public assets in Vite should be referenced by absolute path
const basketImage = "/basket.png";
const logoImage = "/logo.png";

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },

  {
    label: "Products",
    icon: Package,
    children: [
      { path: "/admin/products/all", label: "All Products", icon: List },
      // { path: "/admin/products/add", label: "Add New Product", icon: PlusCircle },
      { path: "/admin/products/category", label: "Categories", icon: Layers },
      { path: "/admin/products/stock", label: "Inventory", icon: Archive },
    ],
  },

  {
    label: "Purchases",
    icon: ShoppingBag,
    children: [
      { path: "/admin/purchases/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/admin/purchases/suppliers", label: "Suppliers", icon: Users },
      { path: "/admin/purchases/orders", label: "Purchase Orders", icon: FileText },
      { path: "/admin/purchases/all", label: "Purchase Invoices", icon: ShoppingBag },
      { path: "/admin/purchases/payments", label: "Payments", icon: CreditCard },
      { path: "/admin/purchases/returns", label: "Purchase Returns", icon: Archive },
      { path: "/admin/purchases/reports", label: "Reports", icon: BarChart3 },
      { path: "/admin/purchases/import", label: "Import/Export", icon: Layers },
    ],
  },

  {
    label: "Orders",
    icon: ShoppingCart,
    children: [
      { path: "/admin/orders/new", label: "New Orders", icon: List },
      { path: "/admin/orders/all", label: "All Orders", icon: Archive },
      { path: "/admin/orders/delivery", label: "Delivery Orders", icon: Truck },
      { path: "/admin/orders/cancelled", label: "Cancelled Orders", icon: XCircle },
    ],
  },

  { path: "/admin/users/all", label: "Customers", icon: Users },

  {
    label: "Employee Management",
    icon: Users,
    children: [
      { path: "/admin/staff", label: "All Employees", icon: Users },
      // { path: "/admin/addstaff", label: "Add Employee", icon: PlusCircle },
      { path: "/admin/staff/attendance", label: "Attendance", icon: CalendarCheck },
      { path: "/admin/staff/leave", label: "Leave Management", icon: FileText },
      { path: "/admin/staff/salary", label: "Salary Management", icon: Wallet },
    ],
  },

  { path: "/admin/billing", label: "Billing", icon: CreditCard },

  // {
  //   label: "Dealer",
  //   icon: Handshake,
  //   children: [
  //     // { path: "/admin/dealer", label: "Dashboard", icon: LayoutDashboard },
      
  //     // { path: "/admin/dealer/add", label: "Add Dealer", icon: PlusCircle },
      
  //   ],
  // },

  // { path: "/admin/dealer/all", label: "All Dealers", icon: List },

  { path: "/admin/banners", label: "Offers & Discounts", icon: Gift },
  { path: "/admin/coupons", label: "Coupons", icon: Tag },
  // { path: "/admin/delivery-charges", label: "Delivery Charges", icon: Truck },
  { path: "/admin/reports", label: "Reports", icon: BarChart3 },
  // { path: "/admin/banners", label: "Banners", icon: Image },
  { path: "/admin/reviews", label: "Reviews", icon: Star },
  { path: "/admin/videos", label: "Videos Management", icon: Video },
  { path: "/", label: "Back to Home", icon: Home },
];

/* ================= SIDEBAR ================= */
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { profileName, email } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const prevActiveRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(() => {
    // Auto-open relevant submenu on load
    for (const item of navItems) {
      if (item.children) {
        if (item.children.some(c => location.pathname === c.path || location.pathname.startsWith(c.path + "/"))) {
          return item.label;
        }
      }
    }
    return null;
  });

  /* ================= HELPERS ================= */
  const isActiveRoute = (item) => {
    const p = location.pathname;
    if (item.path === "/" || item.path === "/admin" || item.exact) return p === item.path;
    if (item.children) return item.children.some(c => p === c.path || p.startsWith(c.path + "/"));
    if (item.path) return p === item.path || p.startsWith(item.path + "/");
    return false;
  };

  const toggleMenu = (label) => {
    setOpenMenu(prev => prev === label ? null : label);
  };

  useEffect(() => {
    if (!isOpen) return;

    prevActiveRef.current = document.activeElement;

    const mql = window.matchMedia("(max-width: 1023px)");
    if (mql.matches) document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      sidebarRef.current?.focus?.();
    }, 50);

    const handleKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey);
      if (mql.matches) document.body.style.overflow = "";
      try { prevActiveRef.current?.focus?.(); } catch { /* focus restore failed */ }
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        onClick={onClose}
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        tabIndex={-1}
        role="navigation"
        aria-label="Admin Sidebar"
        className={`
          fixed top-0 left-0 z-50 h-screen
          flex flex-col
          bg-[#042f1a] border-r border-[#042f1a]
          transition-all duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${collapsed ? "w-20" : "w-[19rem]"}
          shadow-[4px_0_20px_rgba(0,0,0,0.2)]
        `}
      >
        {/* ===== LOGO ===== */}
        <div className={`flex items-center gap-3 border-b border-white/10 ${collapsed ? "px-3 py-5 justify-center" : "px-5 py-5"}`}>
          <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden rounded-full bg-white shadow-md border-2 border-white/10">
            <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
          </div>

          {!collapsed && (
            <div className="leading-tight overflow-hidden flex flex-col justify-center">
              <h1 className="text-lg font-black text-white leading-none">
                <span className="text-[#59c33f]">PRIYAM</span>
              </h1>
              <p className="text-[8px] text-gray-300 font-bold tracking-[0.2em] uppercase mt-1">Super Market</p>
            </div>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-white/10 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ===== NAVIGATION ===== */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;

            /* ----- DROPDOWN ITEM ----- */
            if (item.children) {
              const isMenuOpen = openMenu === item.label;
              const isAnyChildActive = isActiveRoute(item);

              return (
                <div key={item.label}>
                  <div className="relative group">
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleMenu(item.label); }}
                    title={collapsed ? item.label : undefined}
                    aria-expanded={isMenuOpen}
                    aria-controls={`submenu-${item.label.replace(/\s+/g, "-")}`}
                    aria-haspopup="true"
                    className={`
                      w-full flex items-center gap-3 rounded-xl transition-all duration-200
                      ${collapsed ? "px-0 py-3 justify-center" : "px-4 py-3"}
                      ${isAnyChildActive
                        ? "bg-[#3a8b28] text-white"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isAnyChildActive ? "text-white" : "text-gray-400"}`} />
                    {!collapsed && (
                      <>
                        <span className={`flex-1 text-left text-sm font-bold`}>{item.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""} ${isAnyChildActive ? "text-white" : "text-gray-400"}`}
                        />
                      </>
                    )}
                  </button>

                  {collapsed && (
                    <div className="sidebar-tooltip hidden group-hover:block">{item.label}</div>
                  )}
                  </div>

                  {/* Sub Menu */}
                  {!collapsed && (
                    <div id={`submenu-${item.label.replace(/\s+/g, "-")}`} aria-hidden={!isMenuOpen} className={`overflow-hidden transition-all duration-300 ${isMenuOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                      <div className="ml-5 pl-4  space-y-1 py-1.5">
                        {item.children.map((sub) => {
                          const isActive = location.pathname === sub.path || (sub.path !== "/admin" && location.pathname.startsWith(sub.path + "/"));
                          return (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              onClick={() => isOpen && onClose()}
                              className={`
                                flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-bold transition-all duration-200
                                ${isActive
                                  ? "text-white bg-white/10"
                                  : "text-gray-400 hover:text-white hover:bg-white/5"
                                }
                              `}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-gray-500"}`} />
                              <span>{sub.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            /* ----- NORMAL ITEM ----- */
            const isActive = isActiveRoute(item);

            return (
              <div key={item.path} className="relative group">
                <NavLink
                  to={item.path}
                  end={item.exact}
                  title={collapsed ? item.label : undefined}
                  onClick={() => {
                    setOpenMenu(null);
                    if (isOpen) onClose();
                  }}
                  className={`
                    flex items-center justify-between rounded-xl transition-all duration-200
                    ${collapsed ? "px-0 py-3 justify-center" : "px-4 py-3"}
                    ${isActive
                      ? "bg-[#1b7f29] text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
                      {!collapsed && <span className="text-sm font-bold">{item.label}</span>}
                  </div>
                  {!collapsed && item.label === "Orders" && (
                      <span className="bg-[#249533] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          32
                      </span>
                  )}
                </NavLink>

                {collapsed && (
                  <div className="sidebar-tooltip hidden group-hover:block">{item.label}</div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ===== BOOST SALES CARD ===== */}
        {!collapsed && (
          <div className="mx-4 mb-4 mt-8 relative bg-white rounded-2xl shadow-xl p-5 pl-2 flex overflow-visible min-h-[140px]">
            {/* Basket Image breaking out of container slightly */}
            <div className="w-[125px] h-[135px] -ml-2 -mt-4 shrink-0 relative z-10 flex items-center drop-shadow-2xl">
              <img src={basketImage} alt="Basket" className="w-full h-full object-contain" />
            </div>
            
            {/* Content */}
            <div className="flex-1 flex flex-col justify-center pl-2 py-2">
              <h4 className="text-[#042f1a] font-bold text-[14px] leading-tight mb-1.5">Boost Your Sales!</h4>
              <p className="text-gray-500 text-[10px] font-medium leading-relaxed mb-4 pr-1">
                Create exciting offers & discounts to attract more customers.
              </p>
              
              <NavLink 
                to="/admin/banners"
                onClick={() => { if (isOpen) onClose(); }}
                className="bg-gradient-to-r from-[#6bba27] to-[#4da828] hover:from-[#5ea322] hover:to-[#429322] text-white text-[11px] font-bold py-2 px-3.5 rounded-lg flex items-center justify-between transition-all shadow-md group w-full"
              >
                <span>Create Offer</span>
                <div className="bg-white rounded-full text-[#4da828] p-1 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </NavLink>
            </div>
          </div>
        )}
        {!collapsed && (
          <div className="mx-4 mb-6 p-2 rounded-xl border border-transparent flex items-center gap-3 bg-transparent cursor-pointer hover:bg-white/5 transition-all">
            <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden border-2 border-[#1b7f29]">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileName || "Admin")}&background=f0faf0&color=3a8b28`} alt={profileName || "Admin"} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-bold text-white truncate">{profileName || "Admin"}</h4>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">{email || "admin@gmail.com"}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        )}

        {/* ===== COLLAPSE TOGGLE ===== */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 rounded-full bg-[#042f1a] border border-white/20 shadow-md items-center justify-center text-gray-400 hover:text-white transition-all z-50"
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
