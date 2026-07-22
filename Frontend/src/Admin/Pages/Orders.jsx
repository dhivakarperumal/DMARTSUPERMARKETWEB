import React, { useState, useEffect, useContext } from "react";
import { useAdmin } from "../../PrivateRouter/AdminContext";
import { Link } from "react-router-dom";
import {
    FiSearch,
    FiFilter,
    FiEye,
    FiTruck,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiShoppingBag,
    FiDownload,
    FiMoreVertical,
    FiPlus,
    FiPackage,
    FiPrinter,
    FiChevronDown
} from "react-icons/fi";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";

const Orders = ({ statusFilter = "All", dateFilter = "All" }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const { ordersCache, setOrdersCache } = useAdmin();
    const [orders, setOrders] = useState(ordersCache[statusFilter] || []);
    const [loading, setLoading] = useState(!ordersCache[statusFilter]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        orderId: null,
        status: "",
        tracking: "",
        courier: "",
        reason: ""
    });

    const [activeStatus, setActiveStatus] = useState(statusFilter);

    useEffect(() => {
        setActiveStatus(statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [activeStatus]);

    const fetchOrders = async () => {
        if (!ordersCache[activeStatus]) setLoading(true);
        try {
            const res = await api.get(`/orders?status=${activeStatus}`);
            const data = res.data || [];
            setOrders(data);
            setOrdersCache(prev => ({ ...prev, [activeStatus]: data }));
        } catch (error) {
            console.error("Fetch Orders Error:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStatusUpdate = async (orderId, newStatus) => {
        if (newStatus === "Shipping" || newStatus === "Cancelled") {
            setModalData({
                orderId,
                status: newStatus,
                tracking: "",
                courier: "",
                reason: ""
            });
            setShowModal(true);
            return;
        }

        performStatusUpdate(orderId, { status: newStatus });
    };

    const performStatusUpdate = async (orderId, updateData) => {
        setLoading(true);
        try {
            await api.put(`/orders/${orderId}/status`, updateData);
            toast.success(`Pipeline synchronized to: ${updateData.status}`);
            fetchOrders();
        } catch (error) {
            console.error("Status Sync Error:", error);
            toast.error("Failed to sync pipeline status");
        } finally {
            setLoading(false);
        }
    };

    const handleModalSubmit = (e) => {
        e.preventDefault();
        const updateData = { status: modalData.status };

        if (modalData.status === "Shipping") {
            if (!modalData.tracking || !modalData.courier) {
                return toast.error("Logistics data incomplete");
            }
            updateData.tracking_number = modalData.tracking;
            updateData.courier_name = modalData.courier;
            updateData.shipped_at = new Date().toISOString();
        } else if (modalData.status === "Cancelled") {
            if (!modalData.reason) {
                return toast.error("Cancellation rationale required");
            }
            updateData.cancellation_reason = modalData.reason;
            updateData.cancelled_at = new Date().toISOString();
        }

        performStatusUpdate(modalData.orderId, updateData);
        setShowModal(false);
    };

    const filteredOrders = orders.filter(order => {
        const query = String(searchTerm || "").toLowerCase();
        const matchesSearch =
            String(order?.customer_name || "").toLowerCase().includes(query) ||
            String(order?.customer_email || "").toLowerCase().includes(query) ||
            String(order?.user_id || "").toLowerCase().includes(query) ||
            String(order?.id || "").includes(searchTerm);
            
        let matchesDate = true;
        if (dateFilter === "today") {
            const today = new Date();
            const orderDate = new Date(order.created_at);
            matchesDate = orderDate.toDateString() === today.toDateString();
        }
        
        let matchesStatus = true;
        if (activeStatus !== "All") {
            matchesStatus = order.status === activeStatus;
        }
            
        return matchesSearch && matchesDate && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 when search or status filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeStatus]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "Order Placed": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Packing": return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case "Shipping": return "bg-amber-100 text-amber-700 border-amber-200";
            case "Out for Delivery": return "bg-cyan-100 text-cyan-700 border-cyan-200";
            case "Delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
            case "New": return "bg-gray-100 text-gray-500 border-gray-200";
            case "Processing": return "bg-indigo-50 text-indigo-400 border-indigo-100";
            case "Shipped": return "bg-amber-50 text-amber-500 border-amber-100";
            default: return "bg-gray-50 text-gray-500 border-gray-100";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Order Placed": return <FiShoppingBag className="w-3.5 h-3.5" />;
            case "Packing": return <FiPackage className="w-3.5 h-3.5" />;
            case "Shipping": return <FiTruck className="w-3.5 h-3.5" />;
            case "Out for Delivery": return <FiTruck className="w-3.5 h-3.5" />;
            case "Delivered": return <FiCheckCircle className="w-3.5 h-3.5" />;
            case "Cancelled": return <FiXCircle className="w-3.5 h-3.5" />;
            case "New": return <FiShoppingBag className="w-3.5 h-3.5" />;
            case "Processing": return <FiClock className="w-3.5 h-3.5" />;
            case "Shipped": return <FiTruck className="w-3.5 h-3.5" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Toaster position="top-right" />
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>

                </div>
                <div className="flex items-center gap-3">

                    <Link
                        to="/admin/orders/create"
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
                    >
                        <FiPlus className="w-4 h-4" /> Create Order
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Orders", value: filteredOrders.length, icon: <FiPackage />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", status: "All" },
                    { label: "Pending", value: orders.filter(o => ['Order Placed', 'Processing', 'New'].includes(o.status)).length, icon: <FiClock />, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", status: "Order Placed" },
                    { label: "In Transit", value: orders.filter(o => ['Shipping', 'Out for Delivery', 'Shipped', 'Packing'].includes(o.status)).length, icon: <FiTruck />, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", status: "Shipping" },
                    { label: "Delivered", value: orders.filter(o => o.status === 'Delivered').length, icon: <FiCheckCircle />, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", status: "Delivered" }
                ].map((stat, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveStatus(stat.status)}
                        className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4 group hover:shadow-md transition-all text-left w-full
                        ${activeStatus === stat.status ? 'border-blue-500 bg-blue-50/10' : 'border-gray-100'}`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm border ${stat.bg} ${stat.color} ${stat.border} group-hover:scale-105 transition-transform shrink-0`}>
                            {stat.icon}
                        </div>
                        <div className="truncate">
                            <p className="text-xs font-semibold text-gray-500 truncate mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{loading ? '-' : stat.value}</h3>
                        </div>
                    </button>
                ))}
            </div>

            {/* Orders Table Container */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                {/* Search and Filters */}
                <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {['All', 'Order Placed', 'Packing', 'Shipping', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveStatus(status)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
                                ${activeStatus === status
                                        ? 'bg-gray-800 text-white shadow-md shadow-gray-800/20'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full xl:max-w-xs">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-gray-400 text-xs font-semibold">Loading orders...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-[#1b7f29] border-b border-gray-100">
                                    <th className="px-5 py-4 text-xs font-semibold text-white uppercase tracking-wider">Order</th>
                                    <th className="px-5 py-4 text-xs font-semibold text-white uppercase tracking-wider">Customer</th>
                                    <th className="px-5 py-4 text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-4 text-xs font-semibold text-white uppercase tracking-wider">Payment</th>
                                    <th className="px-5 py-4 text-xs font-semibold text-white uppercase tracking-wider">Total</th>
                                    <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {currentItems.length > 0 ? (
                                    currentItems.map((order) => (
                                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-5 py-4 align-top">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-gray-900 font-bold">#ORD-0{order.id}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                                        {order.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-900 font-semibold">{order.customer_name || 'Guest'}</p>
                                                        <p className="text-xs text-gray-500">{order.customer_phone || 'No phone'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <div className="relative inline-flex items-center">
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleQuickStatusUpdate(order.id, e.target.value)}
                                                            className={`appearance-none cursor-pointer pl-8 pr-8 py-1.5 rounded-lg text-xs font-semibold border border-transparent outline-none transition-all hover:border-gray-300 focus:ring-2 focus:ring-blue-100 ${getStatusStyle(order.status)}`}
                                                        >
                                                            {(() => {
                                                                const flow = ["Order Placed", "Packing", "Shipping", "Out for Delivery", "Delivered"];
                                                                const currentIndex = flow.indexOf(order.status);
                                                                const options = currentIndex === -1 
                                                                    ? [...flow, "Cancelled", order.status] 
                                                                    : [...flow.slice(currentIndex), ...(currentIndex < 2 ? ["Cancelled"] : [])];
                                                                
                                                                return Array.from(new Set(options)).map(status => (
                                                                    <option key={status} value={status}>{status}</option>
                                                                ));
                                                            })()}
                                                        </select>
                                                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                                                            {getStatusIcon(order.status)}
                                                        </div>
                                                        <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-60" />
                                                    </div>

                                                    {/* Tracking Info */}
                                                    {order.status === 'Shipping' && order.tracking_number && (
                                                        <div className="flex flex-col gap-0.5 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100/50 mt-1 max-w-[200px]">
                                                            <p className="text-xs font-semibold text-amber-700 truncate" title={`${order.courier_name}: ${order.tracking_number}`}>
                                                                {order.courier_name}: {order.tracking_number}
                                                            </p>
                                                            {order.shipped_at && (
                                                                <p className="text-[10px] text-amber-600">
                                                                    {new Date(order.shipped_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Cancellation Info */}
                                                    {order.status === 'Cancelled' && (
                                                        <div className="flex flex-col gap-0.5 px-3 py-2 bg-red-50 rounded-lg border border-red-100/50 mt-1 max-w-[200px]">
                                                            <p className="text-xs font-semibold text-red-700 truncate" title={order.cancellation_reason}>
                                                                {order.cancellation_reason || 'No reason'}
                                                            </p>
                                                            {order.cancelled_at && (
                                                                <p className="text-[10px] text-red-600">
                                                                    {new Date(order.cancelled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <span className="text-gray-600 text-xs font-medium px-2 py-1 rounded-md bg-gray-100 border border-gray-200">
                                                    {order.payment_method || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <span className="font-bold text-gray-900">₹{parseFloat(order.total_amount || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-5 py-4 align-top text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        state={{ autoPrint: true }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Print Invoice"
                                                    >
                                                        <FiPrinter className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-16 text-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                                                <FiPackage className="w-6 h-6" />
                                            </div>
                                            <p className="text-gray-500 font-medium text-sm">No orders found matching your criteria</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between bg-gray-50/30 gap-4">

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-blue-600 disabled:opacity-50 transition-all border border-gray-200 rounded-lg bg-white"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1 overflow-x-auto max-w-[120px] sm:max-w-none hide-scrollbar">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-gray-600 hover:bg-gray-100 bg-white border border-gray-200"}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-blue-600 disabled:opacity-50 transition-all border border-gray-200 rounded-lg bg-white"
                                >
                                    Next
                                </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Logistics Pipeline Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`p-8 ${modalData.status === 'Cancelled' ? 'bg-red-600' : 'bg-slate-900'} text-white`}>
                            <h3 className="text-xl font-black tracking-tight">{modalData.status} Pipeline Meta</h3>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1 italic">Order Ref: #ORD-0{modalData.orderId}</p>
                        </div>

                        <form onSubmit={handleModalSubmit} className="p-8 space-y-6">
                            {modalData.status === 'Shipping' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Docket Number / AWB</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 transition-all outline-none font-bold"
                                            placeholder="Enter Tracking ID..."
                                            value={modalData.tracking}
                                            onChange={(e) => setModalData(p => ({ ...p, tracking: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Courier Intelligence Unit</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 transition-all outline-none font-bold"
                                            placeholder="e.g. BlueDart, Delhivery..."
                                            value={modalData.courier}
                                            onChange={(e) => setModalData(p => ({ ...p, courier: e.target.value }))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Cancellation Rationale</label>
                                    <textarea
                                        required
                                        rows="4"
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500/20 transition-all outline-none font-bold resize-none"
                                        placeholder="Reason for order termination..."
                                        value={modalData.reason}
                                        onChange={(e) => setModalData(p => ({ ...p, reason: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-gray-100 text-gray-400 hover:bg-gray-50 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition-all active:scale-95 ${modalData.status === 'Cancelled' ? 'bg-red-600 shadow-red-500/20 hover:bg-red-500' : 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-500'}`}
                                >
                                    Sync Pipeline
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
