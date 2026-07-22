import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import {
    FiTruck,
    FiPlus,
    FiSearch,
    FiPhone,
    FiMail,
    FiMapPin,
    FiStar,
    FiMoreVertical,
    FiPackage,
    FiCheck,
    FiUpload,
    FiDownload
    ,FiList, FiGrid
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Dealers = () => {
    const navigate = useNavigate();
    const [dealers, setDealers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'

    // Mock history data
    const recentOrders = [
        { id: "#INV-2024-001", date: "2024-03-01", items: "Basmati Rice 5kg x 5", amount: "₹45,000", status: "Paid" },
        { id: "#INV-2024-042", date: "2024-02-15", items: "Sunflower Oil 1L x 12", amount: "₹18,000", status: "Paid" },
        { id: "#INV-2023-118", date: "2024-01-20", items: "Aashirvaad Atta 10kg x 2", amount: "₹4,200", status: "Pending" },
    ];

    useEffect(() => {
        fetchDealers();
    }, []);

    const fetchDealers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/dealers");
            // Backend returns { success: true, data: [...], count }
            // Accept both shapes: direct array or wrapped in .data
            const raw = res.data?.data || res.data || [];
            // Normalize backend fields to frontend shape
            const normalized = raw.map(d => ({
                id: d.id,
                name: d.dealerName || d.name || d.companyName || "Unknown",
                contact: d.contactPerson || d.contact || d.companyName || "",
                location: d.city ? `${d.city}${d.state ? ', ' + d.state : ''}` : (d.location || ""),
                email: d.email || "",
                phone: d.mobileNumber || d.phone || d.whatsappNumber || "",
                image: d.profileImage || d.image || "",
                status: d.status || "Pending",
                rating: d.rating || 0,
                orders: d.orders || 0
            }));
            setDealers(normalized);
        } catch (error) {
            console.error("Fetch Dealers Error:", error);
            toast.error("Failed to load dealers");
        } finally {
            setLoading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState("");
    const filteredDealers = dealers.filter(dealer =>
    (dealer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.location?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleContact = (dealer) => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 800)),
            {
                loading: `Opening secure chat with ${dealer.name}...`,
                success: `Connected to ${dealer.contact}!`,
                error: 'Connection failed',
            }
        );
    };

    const handleViewHistory = (dealer) => {
        setSelectedDealer(dealer);
        setShowHistory(true);
    };

    const handleImportExcel = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                toast.loading(`Importing ${file.name}...`);
                setTimeout(() => {
                    toast.dismiss();
                    toast.success("All partners imported successfully!");
                }, 1500);
            }
        };
        input.click();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Premium": return "bg-amber-100 text-amber-700 border-amber-200";
            case "Verified": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Pending": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-100 text-gray-500 border-gray-100";
        }
    };

    const historyModal = showHistory && selectedDealer ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl mx-auto rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <FiPackage size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 italic">{selectedDealer.name}</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Transaction History & Invoices</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowHistory(false)}
                        className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {recentOrders.map((h, i) => (
                            <div key={i} className="group p-5 bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-100 rounded-3xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-gray-50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FiDownload size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{h.id}</p>
                                        <p className="text-xs text-gray-400 font-bold italic">{h.items}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-800 italic">{h.amount}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{h.date}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${h.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {h.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-50">
                    <button
                        onClick={() => {
                            setShowHistory(false);
                            navigate(`/admin/invoices/add?dealerId=${selectedDealer.id}`);
                        }}
                        className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                        Create New Invoice for Partner
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />
            {/* Page Header */}
            <div className="flex items-center justify-between gap-4">
                {/* Left: Search */}
                <div className="flex-1 max-w-full lg:max-w-xs">
                    <div className="relative w-full">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search dealers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Right: Mode toggle + actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-xl transition-colors ${viewMode === 'card' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            title="Card view"
                        >
                            <FiGrid />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-xl transition-colors ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            title="Table view"
                        >
                            <FiList />
                        </button>
                    </div>

                    <button
                        onClick={handleImportExcel}
                        className="hidden sm:flex items-center justify-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-all hover:bg-gray-50 active:scale-95 shadow-sm"
                    >
                        <FiUpload className="text-blue-500" /> Import
                    </button>

                    <button
                        onClick={() => navigate("/admin/dealer/add")}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                        <FiPlus /> New
                    </button>
                </div>
            </div>

            {/* Dealers List / Grid */}
            <div>
                {viewMode === 'table' ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left bg-gray-50">
                                    <th className="px-4 py-3 w-16 text-center">S No</th>
                                    <th className="px-4 py-3 text-center">Name</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-8" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                            <td className="px-4 py-4"><div className="h-8 bg-gray-100 rounded w-20" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredDealers.map((dealer, index) => (
                                        <tr key={dealer.id} className="border-t border-gray-50 hover:bg-gray-50">
                                            <td className="px-4 py-4 text-xs font-bold text-gray-500 text-center">#{String(index + 1).padStart(2, '0')}</td>
                                            <td className="px-4 py-4 flex items-center justify-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                                                    {dealer.image ? (<img src={dealer.image} alt={dealer.name} className="w-full h-full object-cover" />) : (<span className="text-sm font-bold text-blue-600">{dealer.name?.charAt(0)}</span>)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{dealer.name}</div>
                                                    <div className="text-[11px] text-gray-400">{dealer.status}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">{dealer.contact}</td>
                                            <td className="px-4 py-4">{dealer.location}</td>
                                            <td className="px-4 py-4"><span className="truncate block max-w-[12rem]">{dealer.email}</span></td>
                                            <td className="px-4 py-4">{dealer.phone}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleContact(dealer)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Contact</button>
                                                    <button onClick={() => navigate(`/admin/invoices/add?dealerId=${dealer.id}`)} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">Invoice</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="animate-pulse bg-white rounded-[2rem] border border-gray-100 p-6 h-80 shadow-sm">
                                    <div className="flex gap-4 mb-6">
                                        <div className="w-16 h-16 bg-gray-200 rounded-2xl shrink-0"></div>
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredDealers.map((dealer) => (
                            <div key={dealer.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                                            {dealer.image ? (
                                                <img src={dealer.image} alt={dealer.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <span className="text-xl font-black text-blue-600 bg-blue-50 w-full h-full flex items-center justify-center capitalize">{dealer.name?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{dealer.name}</h3>
                                            <span className={`mt-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(dealer.status)}`}>
                                                {dealer.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toast.error("Quick actions not configured yet.")}
                                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                                    >
                                        <FiMoreVertical />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2.5 pt-4">
                                        <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                            <FiMapPin className="text-blue-500" /> {dealer.location}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 font-medium overflow-hidden">
                                            <FiMail className="text-blue-500" /> <span className="truncate">{dealer.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                            <FiPhone className="text-blue-500" /> {dealer.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => handleContact(dealer)}
                                        className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold text-blue-600 transition-all border border-blue-100"
                                    >
                                        Contact
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/invoices/add?dealerId=${dealer.id}`)}
                                        className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-emerald-600 transition-all border border-emerald-100"
                                    >
                                        Invoice
                                    </button>
                                    <button
                                        onClick={() => handleViewHistory(dealer)}
                                        className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 transition-all border border-gray-100"
                                    >
                                        View History
                                    </button>
                                </div>
                            </div>
                        ))}

                {/* Invite Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-200">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute -left-10 -top-10 w-24 h-24 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-6 backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                        <FiTruck />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Expand Your Network</h3>
                    <p className="text-white/70 text-sm mb-8 px-4">Invite more dealers and manage all collections in one place.</p>
                    <button
                        onClick={() => navigate("/admin/dealer/add")}
                        className="w-full py-3.5 bg-white text-blue-600 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-2xl active:scale-95 transition-all"
                    >
                        Invite Partner
                    </button>
                </div>
                </div>
                )}
            </div>

            {historyModal}
        </div>
    );
};

export default Dealers;
