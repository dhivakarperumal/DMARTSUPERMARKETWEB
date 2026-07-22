import React, { useContext, useEffect, useState } from "react";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useAdmin } from "../PrivateRouter/AdminContext";
import api from "../api";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import {
    TrendingUp, TrendingDown, ShoppingCart, Users, Package,
    AlertTriangle, BarChart2, ChevronDown, ArrowRight,
    Calendar, RefreshCw, DollarSign, ShoppingBag, Star,
    Truck, RotateCcw, UserPlus, Clock, Trophy
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

/* ─────────────── helpers ─────────────── */
const fmtINR = (v) => {
    const n = parseFloat(String(v ?? 0).replace(/[^0-9.]/g, ""));
    if (isNaN(n)) return String(v);
    return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const StatusBadge = ({ s }) => {
    const m = {
        Delivered: "bg-green-100 text-green-700",
        Processing: "bg-orange-100 text-orange-700",
        Shipped: "bg-blue-100 text-blue-700",
        Shipping: "bg-blue-100 text-blue-700",
        "Out for Delivery": "bg-cyan-100 text-cyan-700",
        "Order Placed": "bg-yellow-100 text-yellow-700",
        Cancelled: "bg-red-100 text-red-700",
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${m[s] ?? "bg-gray-100 text-gray-600"}`}>{s}</span>;
};

/* ─────────────── RECHARTS AREA CHART ─────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-sm">
                <p className="font-bold text-gray-800 mb-1">{label}</p>
                <p className="text-[#3a8b28] font-semibold">
                    Sales: ₹{payload[0].value.toLocaleString("en-IN")}
                </p>
            </div>
        );
    }
    return null;
};

const LineChart = ({ data }) => {
    const chartData = data.map(d => ({
        name: d.month,
        Sales: d.revenue ?? d.value ?? 0
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3a8b28" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3a8b28" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="Sales" stroke="#3a8b28" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3a8b28' }} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

/* ─────────────── RECHARTS DONUT ─────────────── */
const Donut = ({ segments, center, sub, size = 160 }) => {
    const colors = ["#3a8b28", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
    const data = segments.map((s, i) => ({ name: s.label || s.name || `Segment ${i}`, value: s.pct || s.value || 1 }));

    return (
        <div style={{ width: size, height: size, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        stroke="none"
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                        formatter={(value) => [`${value}%`, '']}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-800 leading-tight">{center}</span>
                {sub && <span className="text-[10px] text-slate-400 font-semibold">{sub}</span>}
            </div>
        </div>
    );
};

/* ─────────────── SAMPLE DATA ─────────────── */
const SAMPLE_TOP = [
    { name: "Fortune Sunflower Oil 1L", price: "₹135.00", sold: 248 },
    { name: "Aashirvaad Atta 5kg", price: "₹275.00", sold: 186 },
    { name: "Tata Tea Premium 1kg", price: "₹230.00", sold: 162 },
    { name: "Amul Milk 1L", price: "₹60.00", sold: 145 },
    { name: "India Gate Basmati Rice 1kg", price: "₹120.00", sold: 130 },
];
const SAMPLE_LOW = [
    { name: "Maggi 2-Min Noodles", stock: 5 },
    { name: "Sugar 1kg", stock: 8 },
    { name: "Surf Excel 1kg", stock: 3 },
    { name: "Colgate Toothpaste 100g", stock: 7 },
];
const SAMPLE_ORDERS = [
    { id: "#ORD-1250", date: "May 30, 2025", customer: "John Dee", amount: "₹1,250.00", status: "Delivered" },
    { id: "#ORD-1249", date: "May 30, 2025", customer: "Priya Sharma", amount: "₹980.00", status: "Processing" },
    { id: "#ORD-1248", date: "May 30, 2025", customer: "Rahul Verma", amount: "₹1,650.00", status: "Shipped" },
    { id: "#ORD-1247", date: "May 30, 2025", customer: "Sneha Patel", amount: "₹750.00", status: "Cancelled" },
];
const SAMPLE_CAT = [
    { name: "Grocery", rev: "₹58,256.50", pct: 39.3 },
    { name: "Beverages", rev: "₹28,450.00", pct: 19.2 },
    { name: "Dairy & Eggs", rev: "₹24,850.00", pct: 16.8 },
    { name: "Snacks", rev: "₹20,300.00", pct: 13.7 },
    { name: "Others", rev: "₹16,400.00", pct: 11.0 },
];
const SAMPLE_TRENDS = [20000, 35000, 18000, 45000, 32000, 48000, 50000].map((v, i) => ({ revenue: v, month: ["May 24", "May 25", "May 26", "May 27", "May 28", "May 29", "May 30"][i] }));
const segColors = ["#3a8b28", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const catDots = ["bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-orange-500", "bg-purple-500"];

/* ═══════════════════════════════════════ COMPONENT ═══════════════════════════════════════ */
const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { dashboardData, setDashboardCached } = useAdmin();
    const [loading, setLoading] = useState(!dashboardData);

    /* modals kept for backward compat */
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [catName, setCatName] = useState("");
    const [catSaving, setCatSaving] = useState(false);
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);
    const [prodSaving, setProdSaving] = useState(false);
    const [rapidProd, setRapidProd] = useState({ name: "", mrp: "", status: "Active" });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        if (!dashboardData) setLoading(true);
        try {
            const res = await api.get("/dashboard");
            setDashboardCached(res.data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load dashboard");
        } finally { setLoading(false); }
    };

    const handleRapidProductAdd = async (e, cont = false) => {
        if (e) e.preventDefault();
        if (!rapidProd.name || !rapidProd.mrp) return toast.error("Name and MRP are required");
        setProdSaving(true);
        try {
            await api.post("/products", { ...rapidProd, category: "Groceries", total_stock: "0", variants: [] });
            toast.success("Product listed!");
            if (cont) setRapidProd({ name: "", mrp: "", status: "Active" });
            else { setIsProdModalOpen(false); setRapidProd({ name: "", mrp: "", status: "Active" }); }
            fetchData();
        } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
        finally { setProdSaving(false); }
    };

    const handleQuickCategoryAdd = async (e, cont = false) => {
        if (e) e.preventDefault();
        if (!catName) return toast.error("Category name required");
        setCatSaving(true);
        try {
            await api.post("/categories", { name: catName, images: [], subcategory: [] });
            toast.success("Category added!");
            if (cont) setCatName(""); else { setIsCatModalOpen(false); setCatName(""); }
        } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
        finally { setCatSaving(false); }
    };

    /* ── loading / no data ── */
    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#3a8b28]/20 border-t-[#3a8b28] rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-semibold">Loading Dashboard…</p>
            </div>
        </div>
    );

    /* resolved data */
    const stats = dashboardData?.stats ?? [];
    const recentOrders = dashboardData?.recentOrders ?? [];
    const topProducts = dashboardData?.topProducts ?? [];
    const lowStockAlerts = dashboardData?.lowStockAlerts ?? [];
    const categoryAnalytics = dashboardData?.categoryAnalytics ?? [];
    const revenueTrends = dashboardData?.revenueTrends?.length ? dashboardData.revenueTrends : SAMPLE_TRENDS;

    /* stat values */
    const totalSales = stats.find(s => s.label === "Total Sales")?.value ?? "₹0";
    const totalSalesTrend = stats.find(s => s.label === "Total Sales")?.trend ?? "Live data";
    const totalOrders = stats.find(s => s.label === "Total Orders")?.value ?? 0;
    const totalOrdersTrend = stats.find(s => s.label === "Total Orders")?.trend ?? "Live data";
    const totalCustomers = stats.find(s => s.label === "Total Customers")?.value ?? 0;
    const totalCustomersTrend = stats.find(s => s.label === "Total Customers")?.trend ?? "Live data";
    const totalProducts = stats.find(s => s.label === "Total Products")?.value ?? 0;
    const totalProductsTrend = stats.find(s => s.label === "Total Products")?.trend ?? "Live data";
    const totalDeliveries = stats.find(s => s.label === "Total Deliveries")?.value ?? 0;
    const totalDeliveriesTrend = stats.find(s => s.label === "Total Deliveries")?.trend ?? "Live data";
    const ordersToday = stats.find(s => s.label === "Orders Today")?.value ?? 0;
    const ordersTodayTrend = stats.find(s => s.label === "Orders Today")?.trend ?? "Live data";
    const summaryMetrics = dashboardData?.summaryMetrics ?? {};
    const todaysSalesValue = summaryMetrics.todaysSales ?? totalSales;
    const todaysOrdersValue = summaryMetrics.todaysOrders ?? ordersToday;
    const newCustomersValue = summaryMetrics.newCustomers ?? totalCustomers;
    const pendingOrdersValue = summaryMetrics.pendingOrders ?? 0;
    const returnOrdersValue = summaryMetrics.returnOrders ?? 0;
    const todaysRevenue = stats.find(s => s.label === "Today's Revenue")?.value ?? "₹0";
    const todaysRevenueTrend = stats.find(s => s.label === "Today's Revenue")?.trend ?? "Live data";
    const lowStockCount = stats.find(s => s.label === "Low Stock")?.value ?? 0;
    const lowStockTrend = stats.find(s => s.label === "Low Stock")?.trend ?? "Live data";

    const orderNum = parseInt(String(totalOrders).replace(/,/g, "")) || 0;
    const orderSegs = [
        { label: "Delivered", count: Math.round(orderNum * 0.522), pct: 52.2 },
        { label: "Processing", count: Math.round(orderNum * 0.25), pct: 25.0 },
        { label: "Shipped", count: Math.round(orderNum * 0.147), pct: 14.7 },
        { label: "Cancelled", count: Math.round(orderNum * 0.081), pct: 8.1 },
    ];

    const displayTop = topProducts.length ? topProducts.slice(0, 5) : [];
    const displayLow = lowStockAlerts.length ? lowStockAlerts.slice(0, 4) : [];
    const displayOrders = recentOrders.length ? recentOrders.slice(0, 4).map(o => ({
        id: o.id, date: o.date, customer: o.customer, amount: o.amount?.toString().replace("$", "₹"), status: o.status
    })) : [];
    const displayCat = categoryAnalytics.length ? categoryAnalytics.slice(0, 5) : [];

    /* ── RENDER ── */
    return (
        <div className="space-y-4 pb-10 font-sans text-gray-900">
            <Toaster position="top-right" />

            {/* ══ PAGE HEADER ══ */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="relative">
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        Hello, Admin! <span>👋</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Welcome back, <span className="text-[#3a8b28] font-bold">Admin!</span> Here's what's happening with your store today.
                    </p>
                </div>
                {/* <div className="flex items-center gap-2 border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm text-gray-600 font-semibold shadow-sm shrink-0 cursor-pointer hover:shadow-md transition-shadow">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    May 24 - May 30, 2025
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div> */}
            </div>

            {/* ══ STAT CARDS ══ */}
            <style>{`
                @keyframes cardShimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes floatIcon {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-4px) rotate(3deg); }
                }
                @keyframes countUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .stat-card {
                    position: relative;
                    overflow: hidden;
                    border-radius: 20px;
                    padding: 20px;
                    cursor: default;
                    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-6px) scale(1.02);
                }
                .stat-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
                    background-size: 200% auto;
                    opacity: 0;
                    transition: opacity 0.3s;
                    border-radius: inherit;
                    pointer-events: none;
                }
                .stat-card:hover::before {
                    opacity: 1;
                    animation: cardShimmer 0.9s linear;
                }
                .stat-card .stat-icon-wrap {
                    animation: floatIcon 3s ease-in-out infinite;
                }
                .stat-card .stat-value {
                    animation: countUp 0.6s ease both;
                }
                .stat-sparkbar {
                    display: flex;
                    align-items: flex-end;
                    gap: 3px;
                    height: 28px;
                }
                .stat-sparkbar span {
                    flex: 1;
                    border-radius: 3px 3px 0 0;
                    opacity: 0.75;
                    transition: opacity 0.2s;
                }
                .stat-sparkbar span:last-child { opacity: 1; }
                .stat-card:hover .stat-sparkbar span { opacity: 1; }
                .stat-badge-up {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    background: rgba(255,255,255,0.22);
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 999px;
                    padding: 2px 9px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #fff;
                    backdrop-filter: blur(4px);
                }
                .stat-badge-down {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    background: rgba(255,255,255,0.18);
                    border: 1px solid rgba(255,255,255,0.25);
                    border-radius: 999px;
                    padding: 2px 9px;
                    font-size: 11px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.9);
                    backdrop-filter: blur(4px);
                }
                .stat-card-label {
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.82);
                    margin-bottom: 10px;
                }
                .stat-card-value {
                    font-size: clamp(1.3rem, 2.5vw, 1.75rem);
                    font-weight: 900;
                    color: #fff;
                    line-height: 1.1;
                    margin-bottom: 12px;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.12);
                }
                .stat-bg-blob {
                    position: absolute;
                    border-radius: 50%;
                    opacity: 0.18;
                    pointer-events: none;
                }
            `}</style>

            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* ── Total Sales ── */}
                <div className="stat-card" style={{
                    background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                    boxShadow: "0 10px 40px rgba(17,153,142,0.35)"
                }}>
                    <div className="stat-bg-blob" style={{ width: 120, height: 120, background: "#fff", top: -30, right: -30 }} />
                    <div className="stat-bg-blob" style={{ width: 60, height: 60, background: "#fff", bottom: 10, left: -10 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <p className="stat-card-label">Total Sales</p>
                            <div className="stat-icon-wrap" style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: "rgba(255,255,255,0.22)",
                                border: "1.5px solid rgba(255,255,255,0.35)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(6px)"
                            }}>
                                <ShoppingBag style={{ width: 22, height: 22, color: "#fff" }} />
                            </div>
                        </div>
                        <p className="stat-card-value stat-value">{String(totalSales).replace("$", "₹")}</p>
                        <div className="stat-sparkbar" style={{ marginBottom: 10 }}>
                            {[40, 55, 35, 65, 50, 70, 85].map((h, i) => (
                                <span key={i} style={{ height: `${h}%`, background: "rgba(255,255,255,0.6)" }} />
                            ))}
                        </div>
                        <span className="stat-badge-up">
                            <TrendingUp style={{ width: 11, height: 11 }} /> {totalSalesTrend}
                        </span>
                    </div>
                </div>

                {/* ── Total Orders ── */}
                <div className="stat-card" style={{
                    background: "linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)",
                    boxShadow: "0 10px 40px rgba(71,118,230,0.35)"
                }}>
                    <div className="stat-bg-blob" style={{ width: 120, height: 120, background: "#fff", top: -30, right: -30 }} />
                    <div className="stat-bg-blob" style={{ width: 60, height: 60, background: "#fff", bottom: 10, left: -10 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <p className="stat-card-label">Total Orders</p>
                            <div className="stat-icon-wrap" style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: "rgba(255,255,255,0.22)",
                                border: "1.5px solid rgba(255,255,255,0.35)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(6px)"
                            }}>
                                <BarChart2 style={{ width: 22, height: 22, color: "#fff" }} />
                            </div>
                        </div>
                        <p className="stat-card-value stat-value">{String(totalOrders)}</p>
                        <div className="stat-sparkbar" style={{ marginBottom: 10 }}>
                            {[30, 60, 45, 75, 55, 65, 90].map((h, i) => (
                                <span key={i} style={{ height: `${h}%`, background: "rgba(255,255,255,0.6)" }} />
                            ))}
                        </div>
                        <span className="stat-badge-up">
                            <TrendingUp style={{ width: 11, height: 11 }} /> {totalOrdersTrend}
                        </span>
                    </div>
                </div>

                {/* ── Total Customers ── */}
                <div className="stat-card" style={{
                    background: "linear-gradient(135deg, #f953c6 0%, #b91d73 100%)",
                    boxShadow: "0 10px 40px rgba(249,83,198,0.35)"
                }}>
                    <div className="stat-bg-blob" style={{ width: 120, height: 120, background: "#fff", top: -30, right: -30 }} />
                    <div className="stat-bg-blob" style={{ width: 60, height: 60, background: "#fff", bottom: 10, left: -10 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <p className="stat-card-label">Total Customers</p>
                            <div className="stat-icon-wrap" style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: "rgba(255,255,255,0.22)",
                                border: "1.5px solid rgba(255,255,255,0.35)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(6px)"
                            }}>
                                <Users style={{ width: 22, height: 22, color: "#fff" }} />
                            </div>
                        </div>
                        <p className="stat-card-value stat-value">{String(totalCustomers)}</p>
                        <div className="stat-sparkbar" style={{ marginBottom: 10 }}>
                            {[50, 40, 70, 60, 80, 55, 75].map((h, i) => (
                                <span key={i} style={{ height: `${h}%`, background: "rgba(255,255,255,0.6)" }} />
                            ))}
                        </div>
                        <span className="stat-badge-up">
                            <TrendingUp style={{ width: 11, height: 11 }} /> {totalCustomersTrend}
                        </span>
                    </div>
                </div>

                {/* ── Total Products ── */}
                <div className="stat-card" style={{
                    background: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
                    boxShadow: "0 10px 40px rgba(247,151,30,0.35)"
                }}>
                    <div className="stat-bg-blob" style={{ width: 120, height: 120, background: "#fff", top: -30, right: -30 }} />
                    <div className="stat-bg-blob" style={{ width: 60, height: 60, background: "#fff", bottom: 10, left: -10 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <p className="stat-card-label" style={{ color: "rgba(0,0,0,0.6)" }}>Total Products</p>
                            <div className="stat-icon-wrap" style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: "rgba(0,0,0,0.1)",
                                border: "1.5px solid rgba(0,0,0,0.12)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(6px)"
                            }}>
                                <Package style={{ width: 22, height: 22, color: "rgba(0,0,0,0.65)" }} />
                            </div>
                        </div>
                        <p className="stat-card-value stat-value" style={{ color: "rgba(0,0,0,0.8)", textShadow: "none" }}>{String(totalProducts)}</p>
                        <div className="stat-sparkbar" style={{ marginBottom: 10 }}>
                            {[80, 65, 72, 58, 68, 62, 55].map((h, i) => (
                                <span key={i} style={{ height: `${h}%`, background: "rgba(0,0,0,0.2)" }} />
                            ))}
                        </div>
                        <span className="stat-badge-down" style={{ color: "rgba(0,0,0,0.65)", background: "rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.12)" }}>
                            <TrendingDown style={{ width: 11, height: 11 }} /> {totalProductsTrend}
                        </span>
                    </div>
                </div>

            </div>

            {/* ══ STAT ROW 2 : Today Metrics (4 cards) ══ */}
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* ── Total Deliveries ── */}
                <div className="stat-card" style={{
                    background: "linear-gradient(135deg, #4f00bc 0%, #29ABE2 100%)",
                    boxShadow: "0 10px 40px rgba(79,0,188,0.35)"
                }}>
                    <div className="stat-bg-blob" style={{ width: 130, height: 130, background: "#fff", top: -35, right: -35 }} />
                    <div className="stat-bg-blob" style={{ width: 65, height: 65, background: "#fff", bottom: 8, left: -12 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <p className="stat-card-label">Total Deliveries</p>
                            <div className="stat-icon-wrap" style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: "rgba(255,255,255,0.22)",
                                border: "1.5px solid rgba(255,255,255,0.35)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(6px)"
                            }}>
                                <Truck style={{ width: 22, height: 22, color: "#fff" }} />
                            </div>
                        </div>
                        <p className="stat-card-value stat-value">{String(totalDeliveries)}</p>
                        <div className="stat-sparkbar" style={{ marginBottom: 10 }}>
                            {[55, 70, 60, 80, 65, 75, 90].map((h, i) => (
                                <span key={i} style={{ height: `${h}%`, background: "rgba(255,255,255,0.6)" }} />
                            ))}
                        </div>
                        <span className="stat-badge-up">
                            <TrendingUp style={{ width: 11, height: 11 }} /> {totalDeliveriesTrend}
                        </span>
                    </div>
                </div>

                {/* ── Orders Today ── */}
                <div className="stat-card" style={{
                    background: "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)",
                    boxShadow: "0 10px 40px rgba(255,106,0,0.38)"
                }}>
                    <div className="stat-bg-blob" style={{ width: 130, height: 130, background: "#fff", top: -35, right: -35 }} />
                    <div className="stat-bg-blob" style={{ width: 65, height: 65, background: "#fff", bottom: 8, left: -12 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <p className="stat-card-label">Orders Today</p>
                            <div className="stat-icon-wrap" style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: "rgba(255,255,255,0.22)",
                                border: "1.5px solid rgba(255,255,255,0.35)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(6px)"
                            }}>
                                <Clock style={{ width: 22, height: 22, color: "#fff" }} />
                            </div>
                        </div>
                        <p className="stat-card-value stat-value">{String(ordersToday)}</p>
                        <div className="stat-sparkbar" style={{ marginBottom: 10 }}>
                            {[20, 45, 30, 60, 50, 55, 72].map((h, i) => (
                                <span key={i} style={{ height: `${h}%`, background: "rgba(255,255,255,0.6)" }} />
                            ))}
                        </div>
                        <span className="stat-badge-up">
                            <TrendingUp style={{ width: 11, height: 11 }} /> {ordersTodayTrend}
                        </span>
                    </div>
                </div>

                {/* ── Today's Revenue ── */}
                <div className="stat-card" style={{
                    background: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
                    boxShadow: "0 10px 40px rgba(19,78,94,0.40)"
                }}>
                    <div className="stat-bg-blob" style={{ width: 130, height: 130, background: "#a5d6a7", top: -35, right: -35 }} />
                    <div className="stat-bg-blob" style={{ width: 65, height: 65, background: "#a5d6a7", bottom: 8, left: -12 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <p className="stat-card-label">Today's Revenue</p>
                            <div className="stat-icon-wrap" style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: "rgba(165,214,167,0.25)",
                                border: "1.5px solid rgba(165,214,167,0.4)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(6px)"
                            }}>
                                <DollarSign style={{ width: 22, height: 22, color: "#a5d6a7" }} />
                            </div>
                        </div>
                        <p className="stat-card-value stat-value">{String(todaysRevenue)}</p>
                        <div className="stat-sparkbar" style={{ marginBottom: 10 }}>
                            {[45, 65, 55, 80, 60, 75, 88].map((h, i) => (
                                <span key={i} style={{ height: `${h}%`, background: "rgba(165,214,167,0.7)" }} />
                            ))}
                        </div>
                        <span className="stat-badge-up" style={{ background: "rgba(165,214,167,0.2)", border: "1px solid rgba(165,214,167,0.35)" }}>
                            <TrendingUp style={{ width: 11, height: 11 }} /> {todaysRevenueTrend}
                        </span>
                    </div>
                </div>

                {/* ── Low Stock Items ── */}
                <div className="stat-card" style={{
                    background: "linear-gradient(135deg, #f85032 0%, #e73827 50%, #c0392b 100%)",
                    boxShadow: "0 10px 40px rgba(248,80,50,0.35)"
                }}>
                    <div className="stat-bg-blob" style={{ width: 130, height: 130, background: "#fff", top: -35, right: -35 }} />
                    <div className="stat-bg-blob" style={{ width: 65, height: 65, background: "#fff", bottom: 8, left: -12 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <p className="stat-card-label">Low Stock Items</p>
                            <div className="stat-icon-wrap" style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: "rgba(255,255,255,0.22)",
                                border: "1.5px solid rgba(255,255,255,0.35)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(6px)"
                            }}>
                                <AlertTriangle style={{ width: 22, height: 22, color: "#fff" }} />
                            </div>
                        </div>
                        <p className="stat-card-value stat-value">{String(lowStockCount)}</p>
                        <div className="stat-sparkbar" style={{ marginBottom: 10 }}>
                            {[30, 50, 45, 65, 55, 70, 60].map((h, i) => (
                                <span key={i} style={{ height: `${h}%`, background: "rgba(255,255,255,0.6)" }} />
                            ))}
                        </div>
                        <span className="stat-badge-down">
                            <TrendingDown style={{ width: 11, height: 11 }} /> {lowStockTrend}
                        </span>
                    </div>
                </div>

            </div>

            {/* ══ QUICK ACCESS ══ */}
            <style>{`
                .qa-section-title {
                    font-size: 17px;
                    font-weight: 900;
                    color: #1e293b;
                    letter-spacing: -0.3px;
                }
                .qa-section-sub {
                    font-size: 12px;
                    color: #94a3b8;
                    font-weight: 600;
                    margin-top: 1px;
                }
                .qa-card {
                    position: relative;
                    border-radius: 18px;
                    padding: 18px 16px 14px;
                    cursor: pointer;
                    overflow: hidden;
                    text-decoration: none;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
                    border: 1px solid rgba(255,255,255,0.15);
                }
                .qa-card:hover {
                    transform: translateY(-5px) scale(1.03);
                }
                .qa-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .qa-card:hover::after { opacity: 1; }
                .qa-icon-box {
                    width: 46px;
                    height: 46px;
                    border-radius: 13px;
                    background: rgba(255,255,255,0.2);
                    border: 1.5px solid rgba(255,255,255,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(6px);
                    flex-shrink: 0;
                }
                .qa-label {
                    font-size: 12px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: 0.02em;
                    line-height: 1.3;
                }
                .qa-arrow {
                    margin-top: auto;
                    width: 26px;
                    height: 26px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.18);
                    border: 1px solid rgba(255,255,255,0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                .qa-card:hover .qa-arrow {
                    background: rgba(255,255,255,0.32);
                }
                .qa-bg-circle {
                    position: absolute;
                    border-radius: 50%;
                    opacity: 0.15;
                    pointer-events: none;
                }
            `}</style>

            {/* <div style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderRadius: 24, padding: "20px 20px 22px", border: "1px solid #e2e8f0", boxShadow: "0 2px 20px rgba(0,0,0,0.04)" }}>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                        <p className="qa-section-title">⚡ Quick Access</p>
                        <p className="qa-section-sub">Jump to any section instantly</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#e2e8f0", borderRadius: 999, padding: "3px 10px" }}>10 shortcuts</span>
                </div>

              
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>

                    
                    <Link to="/admin/products/add" className="qa-card" style={{ background: "linear-gradient(135deg, #11998e, #38ef7d)", boxShadow: "0 8px 24px rgba(17,153,142,0.3)" }}>
                        <div className="qa-bg-circle" style={{ width: 90, height: 90, background: "#fff", top: -20, right: -20 }} />
                        <div className="qa-icon-box"><Package style={{ width: 22, height: 22, color: "#fff" }} /></div>
                        <span className="qa-label">Add Product</span>
                        <div className="qa-arrow"><ArrowRight style={{ width: 13, height: 13, color: "#fff" }} /></div>
                    </Link>

                  
                    <Link to="/admin/orders/all" className="qa-card" style={{ background: "linear-gradient(135deg, #4776e6, #8e54e9)", boxShadow: "0 8px 24px rgba(71,118,230,0.3)" }}>
                        <div className="qa-bg-circle" style={{ width: 90, height: 90, background: "#fff", top: -20, right: -20 }} />
                        <div className="qa-icon-box"><ShoppingCart style={{ width: 22, height: 22, color: "#fff" }} /></div>
                        <span className="qa-label">All Orders</span>
                        <div className="qa-arrow"><ArrowRight style={{ width: 13, height: 13, color: "#fff" }} /></div>
                    </Link>

                    

                    <Link to="/admin/users/all" className="qa-card" style={{ background: "linear-gradient(135deg, #f7971e, #ffd200)", boxShadow: "0 8px 24px rgba(247,151,30,0.3)" }}>
                        <div className="qa-bg-circle" style={{ width: 90, height: 90, background: "#fff", top: -20, right: -20 }} />
                        <div className="qa-icon-box"><Users style={{ width: 22, height: 22, color: "rgba(0,0,0,0.6)" }} /></div>
                        <span className="qa-label" style={{ color: "rgba(0,0,0,0.75)" }}>All Users</span>
                        <div className="qa-arrow" style={{ background: "rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.12)" }}><ArrowRight style={{ width: 13, height: 13, color: "rgba(0,0,0,0.6)" }} /></div>
                    </Link>

                    
                    <Link to="/admin/products/category" className="qa-card" style={{ background: "linear-gradient(135deg, #2c3e50, #4ca1af)", boxShadow: "0 8px 24px rgba(44,62,80,0.3)" }}>
                        <div className="qa-bg-circle" style={{ width: 90, height: 90, background: "#4ca1af", top: -20, right: -20 }} />
                        <div className="qa-icon-box"><BarChart2 style={{ width: 22, height: 22, color: "#fff" }} /></div>
                        <span className="qa-label">Categories</span>
                        <div className="qa-arrow"><ArrowRight style={{ width: 13, height: 13, color: "#fff" }} /></div>
                    </Link>

                  
                    <Link to="/admin/products/stock" className="qa-card" style={{ background: "linear-gradient(135deg, #134e5e, #71b280)", boxShadow: "0 8px 24px rgba(19,78,94,0.3)" }}>
                        <div className="qa-bg-circle" style={{ width: 90, height: 90, background: "#71b280", top: -20, right: -20 }} />
                        <div className="qa-icon-box"><Package style={{ width: 22, height: 22, color: "#fff" }} /></div>
                        <span className="qa-label">Stock Details</span>
                        <div className="qa-arrow"><ArrowRight style={{ width: 13, height: 13, color: "#fff" }} /></div>
                    </Link>

                    <Link to="/admin/billing" className="qa-card" style={{ background: "linear-gradient(135deg, #005c97, #363795)", boxShadow: "0 8px 24px rgba(0,92,151,0.3)" }}>
                        <div className="qa-bg-circle" style={{ width: 90, height: 90, background: "#363795", top: -20, right: -20 }} />
                        <div className="qa-icon-box"><DollarSign style={{ width: 22, height: 22, color: "#fff" }} /></div>
                        <span className="qa-label">Billing</span>
                        <div className="qa-arrow"><ArrowRight style={{ width: 13, height: 13, color: "#fff" }} /></div>
                    </Link>

                    <Link to="/admin/coupons" className="qa-card" style={{ background: "linear-gradient(135deg, #c94b4b, #4b134f)", boxShadow: "0 8px 24px rgba(201,75,75,0.3)" }}>
                        <div className="qa-bg-circle" style={{ width: 90, height: 90, background: "#4b134f", top: -20, right: -20 }} />
                        <div className="qa-icon-box"><Star style={{ width: 22, height: 22, color: "#fff" }} /></div>
                        <span className="qa-label">Coupons</span>
                        <div className="qa-arrow"><ArrowRight style={{ width: 13, height: 13, color: "#fff" }} /></div>
                    </Link>

                
                    <Link to="/admin/dealer/all" className="qa-card" style={{ background: "linear-gradient(135deg, #0f2027, #2c5364)", boxShadow: "0 8px 24px rgba(15,32,39,0.35)" }}>
                        <div className="qa-bg-circle" style={{ width: 90, height: 90, background: "#4fc3f7", top: -20, right: -20 }} />
                        <div className="qa-icon-box" style={{ background: "rgba(79,195,247,0.25)", border: "1.5px solid rgba(79,195,247,0.4)" }}><Truck style={{ width: 22, height: 22, color: "#4fc3f7" }} /></div>
                        <span className="qa-label">Dealers</span>
                        <div className="qa-arrow"><ArrowRight style={{ width: 13, height: 13, color: "#fff" }} /></div>
                    </Link>

                    

                </div>
            </div> */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                {/* Sales Overview */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {/* Sales Overview */}
                    <div className="xl:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-black text-gray-800">Sales Overview</h2>
                            <button className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 font-semibold hover:bg-gray-50">
                                This Week <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-5 mb-2 text-xs text-gray-500 font-semibold">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block w-5 h-0.5 bg-[#3a8b28] rounded" />
                                This Week
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block w-5 border-t border-dashed border-gray-400" />
                                Last Week
                            </span>
                        </div>
                        {/* Chart Area */}
                        <div className="w-full mt-2" style={{ height: 200 }}>
                            <LineChart data={revenueTrends} />
                        </div>
                        {/* Bottom stats */}
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                    <BarChart2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold">Total Sales</p>
                                    <p className="text-sm font-black text-gray-800">{String(totalSales).replace("$", "₹")}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                    <RefreshCw className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold">Average Order Value</p>
                                    <p className="text-sm font-black text-gray-800">₹1,186.53</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Overview */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {/* Orders Overview */}
                    <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-black text-gray-800">Orders Overview</h2>
                            <button className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 font-semibold hover:bg-gray-50">
                                This Week <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex justify-center my-2">
                            <Donut segments={orderSegs} center={String(totalOrders)} sub="Total Orders" size={160} />
                        </div>
                        <div className="space-y-2 mt-2">
                            {orderSegs.map((seg, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: segColors[i] }} />
                                        <span className="text-gray-600 font-semibold">{seg.label}</span>
                                    </div>
                                    <span className="font-bold text-gray-700">{seg.count} <span className="text-gray-400 font-medium">({seg.pct}%)</span></span>
                                </div>
                            ))}
                        </div>
                        <Link to="/admin/orders/all" className="flex items-center gap-1 mt-4 text-xs text-[#3a8b28] font-bold hover:underline">
                            View all orders <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                </div>

            </div>


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">

                {/* Top Selling Products */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {/* Top Selling Products */}
                    <div className="xl:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-black text-gray-800">Top Selling Products</h2>
                            <button className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 font-semibold hover:bg-gray-50">
                                This Week <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="space-y-3 flex-1">
                            {displayTop.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 overflow-hidden shrink-0 flex items-center justify-center">
                                        {item.img
                                            ? <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                            : <Package className="w-5 h-5 text-green-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                                        <p className="text-[10px] text-gray-400">{item.price ?? item.rev?.toString().replace("$", "₹")}</p>
                                    </div>
                                    <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 border border-green-100">
                                        {item.sold ?? item.sales} sold
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Link to="/admin/products/all" className="flex items-center gap-1 mt-4 text-xs text-[#3a8b28] font-bold hover:underline">
                            View all products <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {/* Low Stock Alert */}
                    <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-black text-orange-500">Low Stock Alert</h2>
                            <button className="text-xs text-[#3a8b28] font-bold hover:underline">View all</button>
                        </div>
                        <div className="space-y-3">
                            {displayLow.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 overflow-hidden shrink-0 flex items-center justify-center">
                                        {item.img
                                            ? <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                            : <Package className="w-5 h-5 text-orange-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                                        <p className="text-[10px] text-gray-400">Current Stock: {item.stock ?? item.qty}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg shrink-0">
                                        Low Stock
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {/* Recent Orders */}
                    <div className="xl:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-black text-gray-800">Recent Orders</h2>
                            <button className="text-xs text-[#3a8b28] font-bold hover:underline">View all</button>
                        </div>
                        <div className="space-y-0">
                            {displayOrders.map((o, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                                    <div className="min-w-0 w-28">
                                        <p className="text-xs font-bold text-gray-700">{o.id}</p>
                                        <p className="text-[10px] text-gray-400">{o.date}</p>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-700 flex-1 truncate">{o.customer}</p>
                                    <p className="text-xs font-black text-gray-800 shrink-0">{o.amount}</p>
                                    <div className="shrink-0">
                                        <StatusBadge s={o.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sales by Category */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {/* Sales by Category */}
                    <div className="xl:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-black text-gray-800">Sales by Category</h2>
                            <button className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 font-semibold hover:bg-gray-50">
                                This Week <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="shrink-0">
                                <Donut
                                    segments={displayCat.map((c, i) => ({ pct: c.pct }))}
                                    center="₹1,48,256"
                                    sub="Total Sales"
                                    size={130}
                                />
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                                {displayCat.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${catDots[i]}`} />
                                            <span className="text-[11px] text-gray-600 font-semibold truncate">{cat.name}</span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] font-bold text-gray-700">{cat.rev?.toString().replace("$", "₹")}</span>
                                            <span className="text-[10px] text-gray-400 ml-1">({cat.pct}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Link to="/admin/reports" className="flex items-center gap-1 mt-4 text-xs text-[#3a8b28] font-bold hover:underline">
                            View full report <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

            </div>

            {/* ══ BOTTOM STATS BAR ══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                            <BarChart2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold">Today's Sales</p>
                            <p className="text-sm font-black text-gray-800">{String(todaysSalesValue)}</p>
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-gray-100" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold">Today's Orders</p>
                            <p className="text-sm font-black text-gray-800">{String(todaysOrdersValue)}</p>
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-gray-100" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold">New Customers</p>
                            <p className="text-sm font-black text-gray-800">{String(newCustomersValue)}</p>
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-gray-100" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold">Pending Orders</p>
                            <p className="text-sm font-black text-gray-800">{String(pendingOrdersValue)}</p>
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-gray-100" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400 shrink-0">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold">Return Orders</p>
                            <p className="text-sm font-black text-gray-800">{String(returnOrdersValue)}</p>
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-3 bg-green-50 rounded-xl px-4 py-2.5 border border-green-100 ml-auto">
                        <div>
                            <p className="text-sm font-black text-gray-800 flex items-center gap-1">Great Job! 🏆</p>
                            <p className="text-[10px] text-gray-500 font-semibold">You're doing great today!</p>
                        </div>
                        <span className="text-3xl">🌿</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
