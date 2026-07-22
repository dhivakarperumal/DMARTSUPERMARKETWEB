import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import {
    FiDownload,
    FiFilter,
    FiSearch,
    FiMoreVertical,
    FiCreditCard,
    FiFileText,
    FiTrendingUp,
    FiPlus,
    FiList,
    FiGrid,
    FiChevronLeft,
    FiChevronRight,
    FiShoppingBag,
    FiTruck
} from "react-icons/fi";

const Billing = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // New states for requested features
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get("/orders");
                const orderData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                // Fetch ALL orders, don't filter just for shop here
                setOrders(orderData);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case "Paid": return "bg-emerald-100 text-emerald-700";
            case "Delivered": return "bg-blue-100 text-blue-700";
            case "Pending": return "bg-amber-100 text-amber-700";
            case "Overdue": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    // Calculate Amount - delivery amount only calculated for online
    const calculateAmount = (order) => {
        let baseAmount = parseFloat(order.total_amount) || 0;
        const type = (order.order_type || "Shop").toString().toLowerCase();
        
        if (type === "online") {
            const delivery = parseFloat(order.delivery_charge || order.delivery_fee || 0);
            baseAmount += delivery;
        }
        
        return baseAmount.toFixed(2);
    };

    // Filtering & Searching Logic
    const filteredOrders = orders.filter((order) => {
        const type = (order.order_type || "Shop").toString().toLowerCase();
        
        // Always enforce Shop only
        if (type !== "shop") {
            return false;
        }
        
        // 2. Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesId = order.order_id?.toString().toLowerCase().includes(term);
            const matchesName = order.customer_name?.toLowerCase().includes(term);
            if (!matchesId && !matchesName) return false;
        }

        return true;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    // Reset pagination to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Calculate Dynamic Stats for Shop Orders
    const shopOrders = orders.filter((o) => {
        const type = (o.order_type || "Shop").toString().toLowerCase();
        return type === "shop";
    });

    const stats = shopOrders.reduce((acc, order) => {
        const amount = parseFloat(order.total_amount) || 0;
        const status = order.status || "Paid";
        
        if (status === "Paid" || status === "Delivered") {
            acc.revenue += amount;
        } else if (status === "Pending") {
            acc.pending += amount;
            acc.unpaidCount += 1;
        } else if (status === "Overdue") {
            acc.overdue += amount;
            acc.unpaidCount += 1;
        }
        return acc;
    }, { revenue: 0, pending: 0, overdue: 0, unpaidCount: 0 });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Billing & Orders</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Manage all your Shop and Online billing</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                        <FiFileText /> Generate Report
                    </button>
                    <button 
                        onClick={() => navigate("/admin/billing/create")}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100">
                        <FiPlus /> New Bill
                    </button>
                </div>
            </div>

            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Total Revenue</p>
                        <h2 className="text-4xl font-black text-slate-800">₹{stats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</h2>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-emerald-500 font-bold text-sm">
                        <FiTrendingUp /> Shop Orders Only
                    </div>
                </div>
                <div className="bg-blue-600 p-8 rounded-[2rem] shadow-xl shadow-blue-100 flex flex-col justify-between text-white">
                    <div>
                        <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-4">Pending Payouts</p>
                        <h2 className="text-4xl font-black">₹{stats.pending.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}</h2>
                    </div>
                    <p className="mt-6 text-xs font-bold opacity-80 uppercase tracking-widest">Available to collect</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Unpaid Invoices</p>
                        <h2 className="text-4xl font-black text-slate-800">{stats.unpaidCount}</h2>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-red-500 font-bold text-sm">
                        Total ₹{stats.overdue.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })} overdue
                    </div>
                </div>
            </div>

            {/* Invoices Section */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-800 shrink-0">Recent Orders</h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by ID or Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm w-full"
                            />
                        </div>
                        <div className="flex bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shrink-0">
                            <button 
                                onClick={() => setViewMode("table")}
                                className={`p-2.5 transition-colors ${viewMode === "table" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-blue-500"}`}
                                title="Table View"
                            >
                                <FiList size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode("card")}
                                className={`p-2.5 transition-colors ${viewMode === "card" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-blue-500"}`}
                                title="Card View"
                            >
                                <FiGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    {loading ? (
                        <div className="text-center py-20 font-bold text-gray-400 animate-pulse">Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-20 font-bold text-gray-400">No orders found matching criteria</div>
                    ) : viewMode === "table" ? (
                        /* TABLE MODE */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#1b7f29]">
                                        <th className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider">Order</th>
                                        <th className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider">Type</th>
                                        <th className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider">Date</th>
                                        <th className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider">Customer</th>
                                        <th className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider">Payment</th>
                                        <th className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider">Status</th>
                                        <th className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider">Amount</th>
                                        <th className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {currentItems.map((order) => {
                                        const type = (order.order_type || "Shop").toString();
                                        const isOnline = type.toLowerCase() === "online";
                                        
                                        return (
                                            <tr key={order.id} className="hover:bg-blue-50/20 transition-colors group">
                                                <td className="px-8 py-6 font-bold text-slate-800">{order.order_id}</td>
                                                <td className="px-8 py-6">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {isOnline ? <FiTruck size={12} /> : <FiShoppingBag size={12} />}
                                                        {type}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                                <td className="px-8 py-6 font-bold text-slate-700">{order.customer_name || 'N/A'}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                        <FiCreditCard /> {order.payment_method || 'Cash'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                                                        {order.status || 'Paid'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-slate-800">
                                                    ₹{calculateAmount(order)}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-all" title="Download">
                                                            <FiDownload size={16} />
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
                                                            <FiMoreVertical size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* CARD MODE */
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-gray-50/30">
                            {currentItems.map((order) => {
                                const type = (order.order_type || "Shop").toString();
                                const isOnline = type.toLowerCase() === "online";
                                
                                return (
                                    <div key={order.id} className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold mb-3 ${isOnline ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {isOnline ? <FiTruck size={10} /> : <FiShoppingBag size={10} />}
                                                    {type}
                                                </span>
                                                <h4 className="text-lg font-black text-slate-800">{order.order_id}</h4>
                                                <p className="text-xs font-bold text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                                                {order.status || 'Paid'}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-3 mt-5">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Customer</span>
                                                <span className="font-bold text-slate-700">{order.customer_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Payment</span>
                                                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                                    <FiCreditCard className="text-gray-400" /> {order.payment_method || 'Cash'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <button className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors">
                                                    <FiDownload size={16} />
                                                </button>
                                                <button className="p-2.5 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
                                                    <FiMoreVertical size={16} />
                                                </button>
                                            </div>
                                            <span className="text-xl font-black text-slate-800">₹{calculateAmount(order)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 0 && (
                    <div className="p-4 md:p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                        <span className="text-sm font-bold text-gray-400">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-100 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <FiChevronLeft size={18} />
                            </button>
                            
                            <div className="flex items-center gap-1 px-2">
                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const pageNum = idx + 1;
                                    if (
                                        totalPages <= 7 ||
                                        pageNum === 1 || 
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                                                    currentPage === pageNum 
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-slate-800'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        (pageNum === 2 && currentPage > 3) ||
                                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                    ) {
                                        return <span key={pageNum} className="w-6 text-center text-gray-400">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-100 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <FiChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Billing;
