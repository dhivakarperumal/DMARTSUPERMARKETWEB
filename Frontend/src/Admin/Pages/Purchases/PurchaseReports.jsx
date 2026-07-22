import React, { useState, useEffect } from "react";
import api from "../../../api";
import { FiBarChart2, FiSearch, FiDownload, FiFilter, FiCalendar } from "react-icons/fi";
import { toast } from "react-hot-toast";

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const PurchaseReports = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    supplier_id: "",
    payment_status: "",
    purchase_type: ""
  });
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)));
      const [repRes, supRes] = await Promise.all([
        api.get(`/purchases/reports/purchases?${params}`),
        api.get("/purchases/suppliers")
      ]);
      if (repRes.data.success) { setData(repRes.data.data); setSummary(repRes.data.summary); }
      if (supRes.data.success) setSuppliers(supRes.data.suppliers);
    } catch { toast.error("Failed to load report"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleFilter = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const exportCSV = () => {
    const header = ["GRN Number","Supplier","Invoice No","Date","Net Amount","Paid","Balance","Status","Type"];
    const rows = data.map(d => [d.grn_number, d.supplier_name, d.supplier_invoice_no, d.invoice_date, d.net_amount, d.paid_amount, d.balance_amount, d.payment_status, d.purchase_type]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c||''}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'purchase_report.csv';
    a.click();
  };

  const statusColor = (s) => ({ Paid:"text-emerald-600", "Partially Paid":"text-amber-600", Unpaid:"text-red-600" }[s] || "text-gray-500");
  const paginated = data.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(data.length / PER_PAGE);

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiBarChart2 size={20} className="text-white" />
            </div>
            Purchase Reports
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">
            Filter, analyze, and export purchase data
          </p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-violet-300 hover:text-violet-600 transition-all shadow-sm">
          <FiDownload size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FiFilter size={12}/> Filters</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "From", name: "from", type: "date" },
            { label: "To", name: "to", type: "date" },
          ].map(f => (
            <div key={f.name} className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.label}</label>
              <input type={f.type} name={f.name} value={filters[f.name]} onChange={handleFilter}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier</label>
            <select name="supplier_id" value={filters.supplier_id} onChange={handleFilter}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Status</label>
            <select name="payment_status" value={filters.payment_status} onChange={handleFilter}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">All</option>
              <option>Paid</option><option>Partially Paid</option><option>Unpaid</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">&nbsp;</label>
            <button onClick={fetchReports} className="w-full px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors">
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Invoices", value: summary.count, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Total Amount", value: fmt(summary.totalAmount), color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Total Paid", value: fmt(summary.totalPaid), color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Balance", value: fmt(summary.totalBalance), color: "text-red-600", bg: "bg-red-50" },
          ].map((c, i) => (
            <div key={i} className={`${c.bg} rounded-2xl p-4 border border-gray-100`}>
              <p className={`text-lg font-black ${c.color}`}>{c.value}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <FiBarChart2 size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-500">No Data Found</p>
            <p className="text-xs font-bold text-gray-400 mt-1">Adjust filters and click Apply.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                    <th className="py-4 px-5">GRN / Invoice</th>
                    <th className="py-4 px-4">Supplier</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4 text-right">Net Amount</th>
                    <th className="py-4 px-4 text-right">Paid</th>
                    <th className="py-4 px-4 text-right">Balance</th>
                    <th className="py-4 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(row => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-violet-50/20 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="text-xs font-bold text-slate-800">{row.grn_number}</p>
                        <p className="text-[10px] text-gray-400">{row.supplier_invoice_no}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-700">{row.supplier_name || '—'}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">{row.invoice_date ? new Date(row.invoice_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="py-3.5 px-4"><span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{row.purchase_type || '—'}</span></td>
                      <td className="py-3.5 px-4 text-right text-sm font-black text-slate-800">{fmt(row.net_amount)}</td>
                      <td className="py-3.5 px-4 text-right text-xs font-bold text-emerald-600">{fmt(row.paid_amount)}</td>
                      <td className="py-3.5 px-4 text-right text-xs font-bold text-red-600">{fmt(row.balance_amount)}</td>
                      <td className="py-3.5 px-4"><span className={`text-[10px] font-black uppercase ${statusColor(row.payment_status)}`}>{row.payment_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
                <p className="text-xs font-bold text-gray-400">Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, data.length)} of {data.length}</p>
                <div className="flex gap-2">
                  <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 text-xs font-bold bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition-colors">Prev</button>
                  <span className="px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-lg">{page}</span>
                  <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 text-xs font-bold bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PurchaseReports;
