import React, { useState, useEffect } from "react";
import api from "../../../api";
import { FiRotateCcw, FiPlus, FiSearch, FiX, FiCheck } from "react-icons/fi";
import { toast } from "react-hot-toast";

const REASONS = ["Damaged Goods","Wrong Items Delivered","Expired Products","Quality Issues","Overstock","Supplier Agreement","Other"];
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const statusColor = (s) => ({ Approved:"bg-emerald-100 text-emerald-700 border-emerald-200", Rejected:"bg-red-100 text-red-700 border-red-200", Pending:"bg-amber-100 text-amber-700 border-amber-200" }[s] || "bg-gray-100 text-gray-600");

const PurchaseReturns = () => {
  const [returns, setReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [form, setForm] = useState({ supplier_id: "", return_date: new Date().toISOString().split('T')[0], reason: "", notes: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [retRes, invRes, supRes] = await Promise.all([
        api.get("/purchases/returns"), api.get("/purchases"), api.get("/purchases/suppliers")
      ]);
      if (retRes.data.success) setReturns(retRes.data.returns);
      if (invRes.data.success) setInvoices(invRes.data.purchases.filter(i => i.payment_status !== 'Unpaid' || true));
      if (supRes.data.success) setSuppliers(supRes.data.suppliers);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const loadInvoiceItems = async (invoiceId) => {
    try {
      const res = await api.get(`/purchases/${invoiceId}/detail`);
      if (res.data.success) {
        setInvoiceDetail(res.data);
        setReturnItems((res.data.items||[]).map(item => ({ ...item, return_quantity: 0, total_price: 0, _checked: false })));
        setForm(prev => ({ ...prev, supplier_id: res.data.purchase?.supplier_id || "" }));
      }
    } catch { toast.error("Failed to load invoice items"); }
  };

  const toggleItem = (idx, checked) => {
    setReturnItems(prev => {
      const updated = [...prev];
      updated[idx]._checked = checked;
      if (!checked) { updated[idx].return_quantity = 0; updated[idx].total_price = 0; }
      else { updated[idx].return_quantity = updated[idx].quantity; updated[idx].total_price = parseFloat(updated[idx].total_price || updated[idx].quantity * updated[idx].unit_price); }
      return updated;
    });
  };

  const updateReturnQty = (idx, qty) => {
    setReturnItems(prev => {
      const updated = [...prev];
      const rQty = Math.min(parseFloat(qty)||0, parseFloat(updated[idx].quantity)||0);
      updated[idx].return_quantity = rQty;
      updated[idx].total_price = rQty * parseFloat(updated[idx].unit_price||0);
      return updated;
    });
  };

  const totalReturnAmount = returnItems.filter(i=>i._checked).reduce((s,i) => s + parseFloat(i.total_price||0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id) return toast.error("Select a supplier");
    if (!form.reason) return toast.error("Select a return reason");
    const checkedItems = returnItems.filter(i => i._checked && parseFloat(i.return_quantity) > 0);
    if (checkedItems.length === 0) return toast.error("Select at least one item to return");
    try {
      const res = await api.post("/purchases/returns", {
        ...form,
        purchase_id: selectedInvoice?.id || null,
        items: checkedItems.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.return_quantity, unit_price: i.unit_price, total_price: i.total_price })),
        created_by: "Admin"
      });
      if (res.data.success) {
        toast.success(`Return Created: ${res.data.return_number}`);
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Error creating return"); }
  };

  const filtered = returns.filter(r => {
    const q = search.toLowerCase();
    return !q || (r.return_number||"").toLowerCase().includes(q) || (r.supplier_name||"").toLowerCase().includes(q);
  });

  const totalReturns = returns.reduce((s,r) => s + parseFloat(r.total_amount||0), 0);

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiRotateCcw size={20} className="text-white" />
            </div>
            Purchase Returns
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">
            {returns.length} returns • {fmt(totalReturns)} total returned
          </p>
        </div>
        <button onClick={() => { setSelectedInvoice(null); setInvoiceDetail(null); setReturnItems([]); setForm({ supplier_id:"", return_date: new Date().toISOString().split('T')[0], reason:"", notes:"" }); setIsModalOpen(true); }}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-rose-200 transition-all">
          <FiPlus size={18} /> New Return
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Returns", value: returns.length, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Pending Approval", value: returns.filter(r=>r.status==='Pending').length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Amount", value: fmt(totalReturns), color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((c,i) => (
          <div key={i} className={`${c.bg} rounded-2xl p-5 border border-gray-100`}>
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by return number or supplier..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none shadow-sm focus:ring-2 focus:ring-rose-400" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <FiRotateCcw size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-500">No Returns Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <th className="py-4 px-5">Return Number</th>
                  <th className="py-4 px-4">Supplier</th>
                  <th className="py-4 px-4">Linked Invoice</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Reason</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                  <th className="py-4 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ret => (
                  <tr key={ret.id} className="border-b border-gray-50 hover:bg-rose-50/20 transition-colors">
                    <td className="py-4 px-5"><p className="text-sm font-bold text-slate-800">{ret.return_number}</p></td>
                    <td className="py-4 px-4 text-xs font-bold text-slate-700">{ret.supplier_name || '—'}</td>
                    <td className="py-4 px-4 text-xs text-indigo-600 font-bold">{ret.grn_number || '—'}</td>
                    <td className="py-4 px-4 text-xs text-gray-500">{ret.return_date ? new Date(ret.return_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-4 px-4 text-xs text-gray-500">{ret.reason || '—'}</td>
                    <td className="py-4 px-4 text-right text-sm font-black text-rose-600">{fmt(ret.total_amount)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${statusColor(ret.status)}`}>{ret.status}</span>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl flex-shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FiRotateCcw className="text-rose-500" /> New Purchase Return
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><FiX size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form id="return-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Header */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link to Invoice (Optional)</label>
                    <select value={selectedInvoice?.id||""} onChange={e => {
                      const inv = invoices.find(i=>i.id.toString()===e.target.value);
                      setSelectedInvoice(inv||null);
                      if(inv) loadInvoiceItems(inv.id);
                      else { setInvoiceDetail(null); setReturnItems([]); }
                    }} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400">
                      <option value="">No Invoice (Direct Return)</option>
                      {invoices.map(i => <option key={i.id} value={i.id}>{i.grn_number} — {i.supplier_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier <span className="text-red-500">*</span></label>
                    <select required value={form.supplier_id} onChange={e=>setForm(p=>({...p,supplier_id:e.target.value}))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400">
                      <option value="" disabled>Select...</option>
                      {suppliers.map(s=><option key={s.id} value={s.id}>{s.supplier_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return Date</label>
                    <input type="date" value={form.return_date} onChange={e=>setForm(p=>({...p,return_date:e.target.value}))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-400" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason <span className="text-red-500">*</span></label>
                    <select required value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400">
                      <option value="" disabled>Select reason...</option>
                      {REASONS.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</label>
                    <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Optional notes"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-400" />
                  </div>
                </div>

                {/* Items from linked invoice */}
                {invoiceDetail && returnItems.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-3">Select Items to Return</h3>
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 text-[10px] text-gray-400 uppercase tracking-widest">
                          <tr>
                            <th className="p-3 w-10"></th>
                            <th className="p-3">Product</th>
                            <th className="p-3 w-24">Received Qty</th>
                            <th className="p-3 w-28">Return Qty</th>
                            <th className="p-3 w-24 text-right">Unit Price</th>
                            <th className="p-3 w-28 text-right">Return Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {returnItems.map((item, idx) => (
                            <tr key={idx} className="border-t border-gray-100 bg-white">
                              <td className="p-3"><input type="checkbox" checked={item._checked} onChange={e=>toggleItem(idx, e.target.checked)} className="w-4 h-4 accent-rose-600 cursor-pointer" /></td>
                              <td className="p-3 font-bold text-slate-800">{item.product_name || '—'}</td>
                              <td className="p-3 text-gray-500">{item.quantity}</td>
                              <td className="p-3">
                                <input type="number" disabled={!item._checked} min="0" step="0.001" max={item.quantity}
                                  value={item.return_quantity||0} onChange={e=>updateReturnQty(idx,e.target.value)}
                                  className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg outline-none disabled:opacity-40" />
                              </td>
                              <td className="p-3 text-right text-gray-500">{fmt(item.unit_price)}</td>
                              <td className="p-3 text-right font-black text-rose-600">{item._checked ? fmt(item.total_price) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end mt-2">
                      <div className="bg-rose-50 border border-rose-100 rounded-xl px-5 py-2.5 flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-600">Total Return Amount:</span>
                        <span className="text-lg font-black text-rose-600">{fmt(totalReturnAmount)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                    <FiRotateCcw size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-bold">Select a linked invoice above to auto-populate items, or submit without items for a manual return.</p>
                  </div>
                )}
              </form>
            </div>
            <div className="p-5 border-t border-gray-100 bg-white rounded-b-3xl flex justify-between items-center flex-shrink-0">
              {totalReturnAmount > 0 && (
                <div className="text-sm font-black text-rose-600">Return: {fmt(totalReturnAmount)}</div>
              )}
              <div className="flex gap-3 ml-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" form="return-form" className="px-7 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 flex items-center gap-2">
                  <FiCheck size={16} /> Create Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturns;
