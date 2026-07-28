import React, { useContext, useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";

import {
  Menu,
  X,
  User,
  Heart,
  ShoppingCart,
  Package,
  Search,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  Trash2
} from "lucide-react";
import logo from "/images/logo.png";
import PageContainer from "./PageContainer";
import api, { getProductImageUrl } from "../../api";
import { toast } from "react-hot-toast";
import { FiHome, FiShoppingBag, FiGrid, FiFileText, FiPhone, FiChevronRight, FiTag } from "react-icons/fi";
import { normalizeApiData } from "../../utils/normalizeApiData";

const Navbar = () => {

  const { user, logout } = useContext(AuthContext);
  const { cart, wishlist, removeFromCart, removeFromWishlist, updateCartQuantity, budgetMode, budgetAmount, updateBudget } = useContext(StoreContext);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);

  const [localBudgetMode, setLocalBudgetMode] = useState(budgetMode);
  const [localBudgetAmount, setLocalBudgetAmount] = useState(budgetAmount);

  useEffect(() => {
    setLocalBudgetMode(budgetMode);
    setLocalBudgetAmount(budgetAmount);
  }, [budgetMode, budgetAmount]);

  const handleBudgetModeChange = (mode) => {
    setLocalBudgetMode(mode);
    if (!mode) {
      updateBudget(false, localBudgetAmount);
    } else {
      updateBudget(true, localBudgetAmount);
    }
  };

  const handleBudgetAmountSave = () => {
    if (localBudgetAmount <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    updateBudget(true, localBudgetAmount);
  };
  const [mobilePages, setMobilePages] = useState(false);
  const navigate = useNavigate();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState(null); // 'cart' | 'wishlist' | null
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [categoryMenu, setCategoryMenu] = useState(false);
  const [pagesMenu, setPagesMenu] = useState(false);
  const [mobileCategory, setMobileCategory] = useState(false);

  const menuRef = useRef();
  const categoryRef = useRef();
  const pagesRef = useRef();

  const confirmLogout = () => {
    logout();
    setLogoutConfirm(false);
    setUserMenu(false);
    navigate("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {

    const handler = (e) => {

      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenu(false);
      }

      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryMenu(false);
      }

      if (pagesRef.current && !pagesRef.current.contains(e.target)) {
        setPagesMenu(false);
      }

    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);

  }, []);

  // Fetch categories — only show those marked show_in_navbar
  useEffect(() => {

    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const categoriesData = normalizeApiData(res.data);
        setAllCategories(categoriesData);
        // Filter: only show categories where show_in_navbar is true (or not set, default visible)
        const visible = categoriesData.filter(c => c.show_in_navbar !== false);
        setCategories(visible);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCategories();

  }, []);

  const cartTotal = cart.reduce((acc, item) => {
    const price = item.offer_price || item.price || 0;
    const qty = item.quantity || 1;
    return acc + price * qty;
  }, 0);

  const isOverBudget = budgetMode && cartTotal > budgetAmount;
  const isAtBudget = budgetMode && cartTotal === budgetAmount;
  const isUnderBudget = budgetMode && cartTotal < budgetAmount;

  return (
    <div className="sticky top-0 z-40 bg-white pt-1 border-b border-gray-100">

      {/* Top Header - White */}
      <div className="relative z-[80] bg-white border-b border-gray-100 overflow-visible">
        <PageContainer>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center justify-between w-full md:w-auto">
              <img
                src={logo}
                alt="Supermarket Logo"
                className="h-10 md:h-18 object-contain"
              />
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden text-green-800"
              >
                {mobileMenu ? <X size={28} /> : <Menu size={28} />}
              </button>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 w-full max-w-3xl flex items-center border-2 border-gray-200 rounded-md overflow-hidden">
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                className="flex-1 px-4 py-2.5 text-sm outline-none w-full"
              />
              {/* <div className="border-l border-gray-300 hidden md:flex items-center px-4 bg-gray-50 h-full cursor-pointer hover:bg-gray-100 transition">
                <span className="text-sm text-gray-600 mr-2 whitespace-nowrap">All Categories</span>
                <ChevronDown size={16} className="text-gray-500" />
              </div> */}
              <button className="bg-green-800 text-white px-6 py-2.5 hover:bg-green-900 transition flex items-center justify-center">
                <Search size={20} />
              </button>
            </div>

            {/* Right Action Icons (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-8 flex-shrink-0">

              {/* Account Dropdown */}
              <div className="relative" ref={menuRef}>
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setUserMenu(!userMenu)}
                >
                  <User className="text-gray-700 group-hover:text-green-800 transition" size={26} />
                  <div>
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1 group-hover:text-green-800 transition">
                      My Account <ChevronDown size={14} className="text-gray-500" />
                    </p>
                    <p className="text-xs text-gray-500">Hello, {user ? user.username : 'Sign In'}</p>
                  </div>
                </div>

                {userMenu && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-[9999]">
                    {user ? (
                      <>
                        <Link to="/account" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-800" onClick={() => setUserMenu(false)}>
                          My Profile
                        </Link>
                        <Link to="/ordersmain" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-800" onClick={() => setUserMenu(false)}>
                          Orders
                        </Link>
                        {user.role === "admin" && (
                          <Link to="admin" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-800" onClick={() => setUserMenu(false)}>
                            Admin Panel
                          </Link>
                        )}
                        <button onClick={() => setLogoutConfirm(true)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-medium">
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-800" onClick={() => setUserMenu(false)}>
                          Sign In
                        </Link>
                        <Link to="/register" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-800" onClick={() => setUserMenu(false)}>
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <button
                type="button"
                onClick={() => setSidebarPanel("wishlist")}
                className="flex items-center gap-3 group text-left"
              >
                <div className="relative">
                  <Heart className="text-gray-700 group-hover:text-green-800 transition" size={26} />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {wishlist.length}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-green-800 transition">Wishlist</p>
                  <p className="text-xs text-gray-500">{wishlist.length} items</p>
                </div>
              </button>

              {/* Cart */}
              <button
                type="button"
                onClick={() => setSidebarPanel("cart")}
                className="flex items-center gap-3 group text-left"
              >
                <div className="relative">
                  <ShoppingCart className="text-gray-700 group-hover:text-green-800 transition" size={26} />
                  {cart.length > 0 && (
                    <span className="absolute -top-3 -right-3 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {cart.length}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-1 group-hover:text-green-800 transition">
                    Cart
                  </p>
                  <p className="text-xs text-gray-500">₹{cartTotal.toLocaleString()}</p>
                </div>
              </button>

            </div>
          </div>
        </PageContainer>
      </div>

      {/* =======================
    PREMIUM CART/WISHLIST SIDEBAR
======================= */}
      {sidebarPanel && (
        <div className="fixed inset-0 z-[100] flex">

          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarPanel(null)}
          />

          {/* Sidebar */}
          <aside className="relative ml-auto h-full w-full max-w-md bg-[#f7f9f7] shadow-[0_0_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-[slideIn_.3s_ease]">

            {/* Yellow Top Border */}
            <div className="h-1.5 bg-[#ffc107]" />

            {/* Header */}
            <div className="bg-[#0e6827] text-white px-6 py-5">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">

                    {sidebarPanel === "cart" ? (
                      <ShoppingCart size={24} />
                    ) : (
                      <Heart size={24} />
                    )}

                  </div>

                  <div>

                    <h2 className="text-lg font-bold">

                      {sidebarPanel === "cart"
                        ? "Shopping Cart"
                        : "My Wishlist"}

                    </h2>

                    <p className="text-xs text-green-100 mt-1">

                      {sidebarPanel === "cart"
                        ? `${cart.length} Item${cart.length !== 1 ? "s" : ""}`
                        : `${wishlist.length} Saved Item${wishlist.length !== 1 ? "s" : ""}`}

                    </p>

                  </div>

                </div>

                <button
                  onClick={() => setSidebarPanel(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                >
                  <X size={22} />
                </button>

              </div>

            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0 m-5">

              {sidebarPanel === "cart" ? (


                <>
                  {/* Budget Settings - Always Show */}
                  <div
                    className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >

                    {/* Header */}
                    <button
                      type="button"
                      onClick={() => setShowBudgetSettings(!showBudgetSettings)}
                      className="w-full flex items-center justify-between p-4"
                    >
                      <h3 className="text-sm font-bold text-slate-900">
                        Budget Settings
                      </h3>

                      {showBudgetSettings ? (
                        <ChevronUp size={20} className="text-[#0e6827]" />
                      ) : (
                        <ChevronDown size={20} className="text-[#0e6827]" />
                      )}
                    </button>

                    {/* Content */}
                    {showBudgetSettings && (
                      <div className="px-4 pb-4 border-t border-green-100">

                        {/* Same Line */}
                        <div className="mt-4 flex items-center gap-6">

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="navBudgetMode"
                              checked={!localBudgetMode}
                              onChange={() => handleBudgetModeChange(false)}
                              className="text-green-600"
                            />
                            <span className="text-sm font-medium">
                              Without Budget
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="navBudgetMode"
                              checked={localBudgetMode}
                              onChange={() => handleBudgetModeChange(true)}
                              className="text-green-600"
                            />
                            <span className="text-sm font-medium">
                              With Budget
                            </span>
                          </label>

                        </div>

                        {localBudgetMode && (
                          <div className="mt-4 flex gap-2">

                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                ₹
                              </span>

                              <input
                                type="number"
                                value={localBudgetAmount}
                                onChange={(e) =>
                                  setLocalBudgetAmount(Number(e.target.value))
                                }
                                placeholder="Enter Budget"
                                className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                              />
                            </div>

                            <button
                              onClick={handleBudgetAmountSave}
                              className="px-4 rounded-lg bg-[#0e6827] text-white font-semibold hover:bg-[#168637]"
                            >
                              Save
                            </button>

                          </div>
                        )}

                      </div>
                    )}

                  </div>

                  {/* Empty Cart */}
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-lg p-10">
                      <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-6">
                        <ShoppingCart
                          size={42}
                          className="text-[#0e6827]"
                        />
                      </div>

                      <h3 className="text-lg font-bold text-[#0e6827]">
                        Your Cart is Empty
                      </h3>

                      <p className="text-sm text-gray-500 mt-2 leading-6">
                        Looks like you haven't added anything yet.
                        Start shopping and fill your cart with fresh groceries.
                      </p>

                      <button
                        onClick={() => {
                          setSidebarPanel(null);
                          navigate("/shop");
                        }}
                        className="mt-8 bg-[#ffc107] hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
                      >
                        Continue Shopping
                      </button>
                    </div>


                  ) : (
                    <>
                      <div
                        className="flex-1 overflow-y-auto p-5 space-y-5"
                        onClick={() => {
                          if (showBudgetSettings) {
                            setShowBudgetSettings(false);
                          }
                        }}
                      >

                        {/* Cart Items Start Here */}

                        {cart.map((item) => {
                          const name =
                            item.name ||
                            item.product_name ||
                            item.productName ||
                            "Product";

                          const image =
                            getProductImageUrl(item) ||
                            item.image ||
                            item.product_image ||
                            "/placeholder.png";

                          const price =
                            item.offer_price ||
                            item.price ||
                            0;

                          return (
                            <div
                              key={item.id || item._id || item.product_id}
                              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-green-100 overflow-hidden"
                            >
                              <div className="flex gap-4 p-4">

                                {/* Product Image */}
                                <div className="relative">
                                  <img
                                    src={image}
                                    alt={name}
                                    className="h-24 w-24 rounded-xl border-2 border-green-100 object-cover bg-white"
                                    onError={(e) => {
                                      e.target.src = "/placeholder.png";
                                    }}
                                  />

                                  <div className="absolute -top-2 -right-2 bg-[#ffc107] text-black text-[10px] font-bold px-2 py-1 rounded-full shadow">
                                    Fresh
                                  </div>
                                </div>

                                {/* Product Details */}
                                <div className="flex-1 flex flex-col justify-between">

                                  <div>

                                    <div className="flex items-start justify-between gap-3">

                                      <div>

                                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-5">
                                          {name}
                                        </h3>

                                        <p className="mt-1 text-sm font-bold text-[#0e6827]">
                                          ₹{price}
                                        </p>

                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeFromCart(
                                            item.id ||
                                            item._id ||
                                            item.product_id
                                          )
                                        }
                                        className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center"
                                      >
                                        <Trash2 size={18} />
                                      </button>

                                    </div>

                                  </div>

                                  {/* Quantity */}
                                  <div className="mt-5 flex items-center justify-between">

                                    <div className="flex items-center bg-green-50 rounded-xl p-1">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateCartQuantity(
                                            item.id ||
                                            item._id ||
                                            item.product_id,
                                            Math.max(
                                              1,
                                              (item.quantity || 1) - 1
                                            )
                                          )
                                        }
                                        className="h-7 w-7 rounded-lg bg-[#0e6827] text-white hover:bg-green-700 transition flex items-center justify-center"
                                      >
                                        <Minus size={15} />
                                      </button>

                                      <span className="w-10 text-center text-sm font-semibold text-[#0e6827]">
                                        {item.quantity || 1}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateCartQuantity(
                                            item.id ||
                                            item._id ||
                                            item.product_id,
                                            (item.quantity || 1) + 1
                                          )
                                        }
                                        disabled={(item.quantity || 1) >= (item.total_stock ?? item.stock_quantity ?? 0)}
                                        className={`h-7 w-7 rounded-lg transition flex items-center justify-center ${
                                          (item.quantity || 1) >= (item.total_stock ?? item.stock_quantity ?? 0)
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#0e6827] text-white hover:bg-green-700'
                                        }`}
                                      >
                                        <Plus size={15} />
                                      </button>

                                    </div>

                                    <div className="text-right">

                                      <p className="text-xs text-gray-500">
                                        Total
                                      </p>

                                      <p className="text-base font-bold text-[#0e6827]">
                                        ₹
                                        {(
                                          price *
                                          (item.quantity || 1)
                                        ).toLocaleString()}
                                      </p>

                                    </div>

                                  </div>

                                </div>

                              </div>
                            </div>
                          );
                        })}

                      </div>

                      {/* Fixed Bottom */}
                      <div className="border-t border-green-200 bg-white p-5 shadow-[0_-6px_20px_rgba(0,0,0,0.08)]">

                        <div className="rounded-2xl bg-[#0e6827] text-white p-5">

                          <div className="flex justify-between items-center">

                            <span className="text-sm text-green-100">
                              Cart Subtotal
                            </span>

                            <span className="text-2xl font-bold text-[#ffc107]">
                              ₹{cartTotal.toLocaleString()}
                            </span>

                          </div>

                          {budgetMode && (
                            <div className="mt-4 bg-white/10 rounded-xl p-3 border border-white/20">
                              <div className="flex justify-between text-xs mb-2">
                                <span className="font-medium text-green-100">Budget Usage</span>
                                <span className="font-bold text-white">₹{cartTotal} / ₹{budgetAmount}</span>
                              </div>
                              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red-400' : isAtBudget ? 'bg-amber-400' : 'bg-white'}`}
                                  style={{ width: `${Math.min((cartTotal / (budgetAmount || 1)) * 100, 100)}%` }}
                                />
                              </div>
                              <div className="mt-2 text-[10px] font-medium leading-tight">
                                {isOverBudget ? (
                                  <span className="text-red-300">You have exceeded your budget by ₹{cartTotal - budgetAmount}. Please remove items.</span>
                                ) : isAtBudget ? (
                                  <span className="text-amber-300">You have reached your budget limit.</span>
                                ) : (
                                  <span className="text-green-200">You can still buy items worth ₹{budgetAmount - cartTotal}.</span>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSidebarPanel(null);
                              navigate("/checkout");
                            }}
                            disabled={isOverBudget}
                            className={`mt-4 w-full rounded-xl py-3 text-sm font-bold transition ${isOverBudget ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-[#ffc107] text-black hover:bg-yellow-400'}`}
                          >
                            Proceed to Checkout →
                          </button>

                        </div>

                      </div>
                    </>
                  )}

                </>
              ) : (
                <>
                  {wishlist.length === 0 ? (

                    <div className="flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-lg p-10 mt-6">

                      <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-6">

                        <Heart
                          size={42}
                          className="text-red-500"
                        />

                      </div>

                      <h3 className="text-lg font-bold text-[#0e6827]">
                        Your Wishlist is Empty
                      </h3>

                      <p className="mt-3 text-gray-500 leading-relaxed">
                        Save products you love and they'll appear
                        here for quick access anytime.
                      </p>

                      <button
                        onClick={() => {
                          setSidebarPanel(null);
                          navigate("/shop");
                        }}
                        className="mt-8 bg-[#ffc107] hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
                      >
                        Browse Products
                      </button>

                    </div>

                  ) : (

                    <div className="px-5 py-5 space-y-5">

                      {wishlist.map((item) => {

                        const name =
                          item.name ||
                          item.product_name ||
                          item.productName ||
                          "Product";

                        const image = getProductImageUrl(item) || "/placeholder.png";

                        const price =
                          item.offer_price ||
                          item.price ||
                          0;

                        return (

                          <div
                            key={item.id || item._id || item.product_id}
                            className="bg-white rounded-2xl border border-green-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                          >

                            <div className="flex gap-4 p-4">

                              {/* Image */}
                              <img
                                src={image}
                                alt={name}
                                className="h-24 w-24 rounded-xl border-2 border-green-100 object-cover bg-white"
                                onError={(e) => {
                                  e.target.src = "/placeholder.png";
                                }}
                              />

                              {/* Details */}
                              <div className="flex-1 flex flex-col justify-between">

                                <div className="flex items-start justify-between">

                                  <div>

                                    <h3 className="font-bold text-gray-800 line-clamp-2">
                                      {name}
                                    </h3>

                                    <p className="mt-2 text-sm font-bold text-[#0e6827]">
                                      ₹{price}
                                    </p>

                                  </div>

                                  <button
                                    onClick={() =>
                                      removeFromWishlist(
                                        item.id ||
                                        item._id ||
                                        item.product_id
                                      )
                                    }
                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center"
                                  >
                                    <Trash2 size={18} />
                                  </button>

                                </div>

                                {/* <button
                                  onClick={() => {
                                    setSidebarPanel(null);
                                    navigate(
                                      `/products/${item.id || item.product_id}`
                                    );
                                  }}
                                  className="mt-5 w-full rounded-xl bg-[#0e6827] py-3 text-white font-semibold hover:bg-green-700 transition"
                                >
                                  View Product
                                </button> */}

                              </div>

                            </div>

                          </div>

                        );

                      })}

                    </div>

                  )}
                </>
              )}

            </div>

          </aside>

        </div>
      )}

      {/* Bottom Header - Green Navbar */}
      <div className="hidden md:block">
        <div className="sticky top-0 z-30 bg-[#0e6827] border-[#0b511d] shadow-md">
          <PageContainer>
            <div className="grid grid-cols-3 items-center h-10">

              <div className="flex justify-start items-center h-full gap-4">
                {/* Categories Dropdown Button */}
                <div className="relative h-full" ref={categoryRef}>
                  <button
                    onClick={() => {
                      setCategoryMenu(!categoryMenu);
                      setPagesMenu(false);
                    }}
                    className="bg-[#ffc107] text-black flex items-center gap-2 px-4 h-full text-sm font-semibold hover:bg-[#e0a800] transition cursor-pointer"
                  >
                    <Menu size={18} />
                    <span>All Categories</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${categoryMenu ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {categoryMenu && (
                    <div className="absolute top-full left-0 w-64 bg-white border border-gray-200 shadow-xl overflow-hidden z-50">
                      {allCategories.length > 0 ? allCategories.map((cat) => (
                        <NavLink
                          key={cat.id}
                          to={`/category/${cat.slug || cat.name}`}
                          onClick={() => setCategoryMenu(false)}
                          className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-800 border-b border-gray-100 last:border-none transition"
                        >
                          {cat.name}
                        </NavLink>
                      )) : (
                        <div className="px-5 py-3 text-sm text-gray-500">No categories found</div>
                      )}
                    </div>
                  )}
                </div>


              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-6 text-[13px] font-semibold text-white tracking-wide">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? "text-yellow-400" : "hover:text-yellow-400 transition"
                  }
                >
                  Home
                </NavLink>

                <NavLink
                  to="/shop"
                  className={({ isActive }) =>
                    isActive ? "text-yellow-400" : "hover:text-yellow-400 transition"
                  }
                >
                  Shop
                </NavLink>

                {categories.slice(0, 4).map((cat) => (
                  <NavLink
                    key={cat.id}
                    to={`/category/${cat.slug || cat.name}`}
                    className="hover:text-yellow-400 transition whitespace-nowrap"
                  >
                    {cat.name}
                  </NavLink>
                ))}

                <div className="relative" ref={pagesRef}>
                  <button
                    onClick={() => {
                      setPagesMenu(!pagesMenu);
                      setCategoryMenu(false);
                    }}
                    className="flex items-center gap-1 hover:text-yellow-400 transition"
                  >
                    More <ChevronDown size={14} />
                  </button>

                  {pagesMenu && (
                    <div className="absolute top-full left-0 w-44 bg-white shadow-xl z-50 border border-gray-100">
                      <NavLink
                        to="/about"
                        onClick={() => setPagesMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        About
                      </NavLink>

                      <NavLink
                        to="/contactus"
                        onClick={() => setPagesMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Contact Us
                      </NavLink>

                      <NavLink
                        to="/termsandconditions"
                        onClick={() => setPagesMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Terms
                      </NavLink>
                    </div>
                  )}
                </div>
              </div>

              {/* Hot Deals */}
              <div className="flex justify-end">
                <Link to="/combo" className="bg-[#e53935] text-white flex items-center gap-1.5 px-4 py-1.5 rounded text-[13px] font-bold hover:bg-red-700 transition shadow-sm h-8">
                  Combo <span className="text-sm">🔥</span>
                </Link>
              </div>

            </div>
          </PageContainer>
        </div>
      </div>

      {/* Logout Modal */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">

          <div className="relative w-[92%] max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-[zoomIn_.25s_ease]">

            {/* Top Yellow Line */}
            <div className="h-1.5 bg-[#ffc107]" />

            {/* Header */}
            <div className="bg-[#0e6827] px-6 py-5 text-white">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <User size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Confirm Logout
                  </h2>

                  <p className="mt-1 text-sm text-green-100">
                    You are about to sign out of your account.
                  </p>
                </div>

              </div>

            </div>

            {/* Body */}
            <div className="px-6 py-7 text-center">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                <User size={36} className="text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-gray-800">
                Are you sure?
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                You'll need to sign in again to access your account and continue shopping.
              </p>

              <div className="mt-8 flex gap-4">

                <button
                  onClick={() => setLogoutConfirm(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 font-semibold text-gray-700 transition hover:border-[#0e6827] hover:bg-green-50 hover:text-[#0e6827]"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmLogout}
                  className="flex-1 rounded-xl bg-[#ffc107] py-3 font-bold text-black shadow-lg transition hover:scale-105 hover:bg-yellow-400"
                >
                  Logout
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* Mobile Menu Sidebar */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />

          <div className="absolute top-0 left-0 h-full w-[85%] max-w-[320px] bg-white shadow-2xl overflow-y-auto flex flex-col">

            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-green-800 text-white">
              <div className="flex items-center gap-3">
                <User size={24} />
                <div>
                  <h3 className="font-bold text-sm">{user ? user.username : 'Guest'}</h3>
                  <p className="text-xs text-green-200">{user ? 'My Account' : 'Sign in to sync'}</p>
                </div>
              </div>
              <X size={24} className="cursor-pointer" onClick={() => setMobileMenu(false)} />
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Mobile Main Menu */}
              {!mobileCategory && !mobilePages && (
                <div className="p-4 flex flex-col gap-2">
                  <NavLink to="/" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition font-medium">
                    <FiHome size={18} /> Home
                  </NavLink>

                  <NavLink to="/shop" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition font-medium">
                    <FiShoppingBag size={18} /> Shop
                  </NavLink>

                  <button onClick={() => setMobileCategory(true)} className="flex items-center justify-between px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition font-medium w-full">
                    <div className="flex items-center gap-3">
                      <FiGrid size={18} /> Categories
                    </div>
                    <FiChevronRight size={18} />
                  </button>

                  <button onClick={() => setMobilePages(true)} className="flex items-center justify-between px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition font-medium w-full">
                    <div className="flex items-center gap-3">
                      <FiFileText size={18} /> Pages
                    </div>
                    <FiChevronRight size={18} />
                  </button>

                  <div className="my-2 border-t border-gray-100"></div>

                  <Link to="/cart" onClick={() => setMobileMenu(false)} className="flex items-center justify-between px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition font-medium">
                    <div className="flex items-center gap-3">
                      <ShoppingCart size={18} /> Cart
                    </div>
                    {cart.length > 0 && <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">{cart.length}</span>}
                  </Link>

                  <Link to="/wishlist" onClick={() => setMobileMenu(false)} className="flex items-center justify-between px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition font-medium">
                    <div className="flex items-center gap-3">
                      <Heart size={18} /> Wishlist
                    </div>
                    {wishlist.length > 0 && <span className="bg-green-800 text-white px-2 py-0.5 rounded-full text-xs">{wishlist.length}</span>}
                  </Link>

                  <div className="my-2 border-t border-gray-100"></div>

                  {user ? (
                    <button onClick={() => setLogoutConfirm(true)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 transition font-medium w-full">
                      <User size={18} /> Logout
                    </button>
                  ) : (
                    <Link to="/login" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-green-700 bg-green-50 hover:bg-green-100 transition font-medium">
                      <User size={18} /> Sign In
                    </Link>
                  )}
                </div>
              )}

              {/* Mobile Category Menu */}
              {mobileCategory && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 font-medium text-gray-700">
                    <button onClick={() => setMobileCategory(false)} className="p-1 hover:bg-gray-200 rounded-md">←</button>
                    All Categories
                  </div>
                  <div className="p-2">
                    {allCategories.map((cat) => (
                      <NavLink
                        key={cat.id}
                        to={`/category/${cat.slug || cat.name}`}
                        onClick={() => setMobileMenu(false)}
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 border-b border-gray-50 hover:bg-green-50 hover:text-green-800 transition"
                      >
                        <div className="flex items-center gap-3">
                          <FiTag size={16} /> {cat.name}
                        </div>
                        <FiChevronRight size={16} className="text-gray-400" />
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Pages Menu */}
              {mobilePages && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 font-medium text-gray-700">
                    <button onClick={() => setMobilePages(false)} className="p-1 hover:bg-gray-200 rounded-md">←</button>
                    Pages
                  </div>
                  <div className="p-2">
                    <NavLink to="/about" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 border-b border-gray-50 hover:bg-green-50 hover:text-green-800 transition">
                      <FiFileText size={16} /> About Us
                    </NavLink>
                    <NavLink to="/contactus" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 border-b border-gray-50 hover:bg-green-50 hover:text-green-800 transition">
                      <FiPhone size={16} /> Contact Us
                    </NavLink>
                    <NavLink to="/termsandconditions" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition">
                      <FiFileText size={16} /> Terms And Conditions
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;