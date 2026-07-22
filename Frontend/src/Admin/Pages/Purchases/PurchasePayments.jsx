import React, { useState, useEffect } from "react";
import api from "../../../api";
import { FiCreditCard, FiPlus, FiSearch, FiX, FiCheck } from "react-icons/fi";
import { toast } from "react-hot-toast";

const METHODS = ["Cash","UPI","Debit Card","Credit Card","Bank Transfer","Cheque"];
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const PurchasePayments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState({ payment_date: new Date().toISOString().split('T')[0], payment_method: "Cash", amount: "", transaction_number: "", reference_number: "", remarks: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, invRes] = await Promise.all([api.get("/purchases/payments"), api.get("/purchases")]);
      if (payRes.data.success) setPayments(payRes.data.payments);
      if (invRes.data.success) setInvoices(invRes.data.purchases.filter(i => i.payment_status !== "Paid"));
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return toast.error("Select an invoice");
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error("Enter a valid amount");
    try {
      const res = await api.post("/purchases/payments", { ...form, purchase_id: selectedInvoice.id, created_by: "Admin" });
      if (res.data.success) {
        toast.success(`Payment recorded! New balance: ${fmt(res.data.new_balance)}`);
        setIsModalOpen(false);
        setSelectedInvoice(null);
        setForm({ payment_date: new Date().toISOString().split('T')[0], payment_method: "Cash", amount: "", transaction_number: "", reference_number: "", remarks: "" });
        fetchData();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Payment failed"); }
  };

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return !q || (p.grn_number||"").toLowerCase().includes(q) || (p.supplier_name||"").toLowerCase().includes(q);
  });

  const methodColor = (m) => {
    const map = { Cash: "bg-emerald-100 text-emerald-700", UPI: "bg-blue-100 text-blue-700", "Bank Transfer": "bg-indigo-100 text-indigo-700", Cheque: "bg-amber-100 text-amber-700" };
    return map[m] || "bg-gray-100 text-gray-600";
  };

  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount||0), 0);

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiCreditCard size={20} className="text-white" />
            </div>
            Supplier Payments
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">
            {payments.length} payments • {fmt(totalPaid)} total paid
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-200 transition-all">
          <FiPlus size={18} /> Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Paid", value: fmt(totalPaid), color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Cash Payments", value: fmt(payments.filter(p=>p.payment_method==='Cash').reduce((s,p)=>s+parseFloat(p.amount||0),0)), color: "text-green-600", bg: "bg-green-50" },
          { label: "UPI Payments", value: fmt(payments.filter(p=>p.payment_method==='UPI').reduce((s,p)=>s+parseFloat(p.amount||0),0)), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Invoices", value: invoices.length, color: "text-red-600", bg: "bg-red-50" },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} rounded-2xl p-5 border border-gray-100`}>
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-md mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by GRN or supplier..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none shadow-sm focus:ring-2 focus:ring-emerald-400" />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <FiCreditCard size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-500">No Payments Recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <th className="py-4 px-5">Invoice / GRN</th>
                  <th className="py-4 px-4">Supplier</th>
                  <th className="py-4 px-4">Payment Date</th>
                  <th className="py-4 px-4">Method</th>
                  <th className="py-4 px-4">Transaction No.</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(pay => (
                  <tr key={pay.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="py-4 px-5">
                      <p className="text-sm font-bold text-slate-800">{pay.grn_number}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase mt-0.5">Invoice: {pay.supplier_invoice_no || '—'}</p>
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-slate-700">{pay.supplier_name || '—'}</td>
                    <td className="py-4 px-4 text-xs text-gray-500">{pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${methodColor(pay.payment_method)}`}>{pay.payment_method}</span>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-gray-500">{pay.transaction_number || '—'}</td>
                    <td className="py-4 px-4 text-right"><span className="text-sm font-black text-emerald-600">{fmt(pay.amount)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><FiCreditCard className="text-emerald-500" /> Record Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Invoice (Unpaid/Partial) <span className="text-red-500">*</span></label>
                <select required value={selectedInvoice?.id || ""} onChange={e => setSelectedInvoice(invoices.find(i => i.id.toString() === e.target.value) || null)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="" disabled>Select Invoice...</option>
                  {invoices.map(i => <option key={i.id} value={i.id}>{i.grn_number} — {i.supplier_name} — Balance: {fmt(i.balance_amount)}</option>)}
                </select>
              </div>
              {selectedInvoice && (
                <div className="bg-emerald-50 rounded-xl p-3 text-xs font-bold text-emerald-700 flex justify-between">
                  <span>Outstanding Balance</span>
                  <span className="text-base font-black">{fmt(selectedInvoice.balance_amount)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Date</label>
                  <input type="date" value={form.payment_date} onChange={e => setForm(p => ({...p, payment_date: e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</label>
                  <select value={form.payment_method} onChange={e => setForm(p => ({...p, payment_method: e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400">
                    {METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" required min="0.01" step="0.01" max={selectedInvoice?.balance_amount || undefined}
                  value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction No.</label>
                  <input value={form.transaction_number} onChange={e => setForm(p => ({...p, transaction_number: e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference No.</label>
                  <input value={form.reference_number} onChange={e => setForm(p => ({...p, reference_number: e.target.value}))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks</label>
                <textarea rows={2} value={form.remarks} onChange={e => setForm(p => ({...p, remarks: e.target.value}))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 flex items-center gap-2">
                  <FiCheck size={16} /> Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePayments;
