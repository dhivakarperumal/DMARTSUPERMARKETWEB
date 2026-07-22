import React, { useState, useEffect } from "react";
import api from "../../../api";
import { FiFileText, FiPlus, FiSearch, FiEdit2, FiX, FiCheck } from "react-icons/fi";
import { toast } from "react-hot-toast";

const STATUSES = ["Draft","Pending","Approved","Ordered","Partially Received","Fully Received","Cancelled"];
const statusColor = (s) => ({
  Draft:"bg-gray-100 text-gray-600 border-gray-200", Pending:"bg-amber-100 text-amber-700 border-amber-200",
  Approved:"bg-blue-100 text-blue-700 border-blue-200", Ordered:"bg-indigo-100 text-indigo-700 border-indigo-200",
  "Partially Received":"bg-orange-100 text-orange-700 border-orange-200",
  "Fully Received":"bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled:"bg-red-100 text-red-700 border-red-200"
}[s] || "bg-gray-100 text-gray-600");

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [form, setForm] = useState({ supplier_id: "", expected_delivery_date: "", warehouse: "Main Warehouse", buyer: "", notes: "", status: "Pending" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordRes, supRes] = await Promise.all([api.get("/purchases/orders"), api.get("/purchases/suppliers")]);
      if (ordRes.data.success) setOrders(ordRes.data.orders);
      if (supRes.data.success) setSuppliers(supRes.data.suppliers.filter(s => s.status === 'Active'));
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditOrder(null);
    setForm({ supplier_id: "", expected_delivery_date: "", warehouse: "Main Warehouse", buyer: "", notes: "", status: "Pending" });
    setIsModalOpen(true);
  };

  const openEdit = (ord) => {
    setEditOrder(ord);
    setForm({ supplier_id: ord.supplier_id, expected_delivery_date: ord.expected_delivery_date?.split('T')[0]||"", warehouse: ord.warehouse||"Main Warehouse", buyer: ord.buyer||"", notes: ord.notes||"", status: ord.status });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id) return toast.error("Please select a supplier");
    try {
      if (editOrder) {
        await api.put(`/purchases/orders/${editOrder.id}`, form);
        toast.success("Purchase Order updated!");
      } else {
        const res = await api.post("/purchases/orders", form);
        toast.success(`PO Created: ${res.data.po_number}`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Error saving PO"); }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || (o.po_number||"").toLowerCase().includes(q) || (o.supplier_name||"").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = STATUSES.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc; }, {});

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiFileText size={20} className="text-white" />
            </div>
            Purchase Orders
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">
            {orders.length} total • {counts["Pending"]||0} pending • {counts["Approved"]||0} approved
          </p>
        </div>
        <button onClick={openAdd} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-amber-200 transition-all transform hover:-translate-y-0.5">
          <FiPlus size={18} /> New Purchase Order
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-6">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(statusFilter===s ? "All" : s)}
            className={`p-3 rounded-2xl border text-center transition-all ${statusFilter===s ? 'ring-2 ring-amber-400 shadow-md' : 'hover:shadow-sm'} ${statusColor(s)} bg-white`}>
            <p className="text-lg font-black">{counts[s]||0}</p>
            <p className="text-[9px] font-black uppercase leading-tight mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by PO number or supplier..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none shadow-sm focus:ring-2 focus:ring-amber-400" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <FiFileText size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-500">No Purchase Orders Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <th className="py-4 px-5">PO Number</th>
                  <th className="py-4 px-4">Supplier</th>
                  <th className="py-4 px-4">PO Date</th>
                  <th className="py-4 px-4">Expected Delivery</th>
                  <th className="py-4 px-4">Warehouse</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ord => (
                  <tr key={ord.id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors group">
                    <td className="py-4 px-5">
                      <p className="text-sm font-bold text-slate-800">{ord.po_number}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase mt-0.5">Buyer: {ord.buyer || '—'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-bold text-slate-700">{ord.supplier_name || '—'}</p>
                      <p className="text-[10px] text-gray-400">{ord.supplier_code}</p>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500">{ord.purchase_date ? new Date(ord.purchase_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-4 px-4">
                      {ord.expected_delivery_date ? (
                        <span className={`text-xs font-bold ${new Date(ord.expected_delivery_date) < new Date() && !['Fully Received','Cancelled'].includes(ord.status) ? 'text-red-600' : 'text-slate-700'}`}>
                          {new Date(ord.expected_delivery_date).toLocaleDateString('en-IN')}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500">{ord.warehouse || '—'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColor(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => openEdit(ord)} className="p-2 bg-white rounded-lg border border-gray-200 text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-all shadow-sm">
                        <FiEdit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FiFileText className="text-amber-500" /> {editOrder ? "Edit Purchase Order" : "New Purchase Order"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier <span className="text-red-500">*</span></label>
                  <select required value={form.supplier_id} onChange={e=>setForm(p=>({...p,supplier_id:e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="" disabled>Select Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name} ({s.supplier_code})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected Delivery</label>
                  <input type="date" value={form.expected_delivery_date} onChange={e=>setForm(p=>({...p,expected_delivery_date:e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Warehouse</label>
                  <input value={form.warehouse} onChange={e=>setForm(p=>({...p,warehouse:e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Buyer</label>
                  <input value={form.buyer} onChange={e=>setForm(p=>({...p,buyer:e.target.value}))} placeholder="Optional"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-7 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-200 flex items-center gap-2">
                  <FiCheck size={16} /> {editOrder ? "Save Changes" : "Create PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
