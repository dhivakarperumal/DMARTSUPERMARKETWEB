import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import {
  FiBarChart2, FiPieChart, FiTrendingUp, FiPackage, FiUsers,
  FiShoppingCart, FiDownload, FiPrinter, FiSearch, FiFilter,
  FiCalendar, FiRefreshCw, FiArrowUp, FiArrowDown, FiBox,
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiDollarSign,
  FiFileText, FiGrid, FiTruck, FiDatabase, FiStar
} from "react-icons/fi";

/* ──────────────────────────────────────────────
   Utility helpers
────────────────────────────────────────────── */
const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => parseFloat(n || 0).toLocaleString("en-IN");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ──────────────────────────────────────────────
   Export helpers
────────────────────────────────────────────── */
const exportCSV = (filename, headers, rows) => {
  const lines = [headers.join(",")];
  rows.forEach((r) => lines.push(headers.map((h) => `"${r[h] ?? ""}"`).join(",")));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
};

const printSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>Print</title>
    <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}h2{margin-bottom:16px}</style>
    </head><body>`);
  w.document.write(el.innerHTML);
  w.document.write("</body></html>");
  w.document.close();
  w.print();
};

/* ──────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, color = "blue", trend }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colors[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${trend >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
            {trend >= 0 ? <FiArrowUp className="inline" /> : <FiArrowDown className="inline" />} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-xl font-black text-slate-800">{value}</h3>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
};

const DateRangeBar = ({ range, setRange, customFrom, setCustomFrom, customTo, setCustomTo, onRefresh, loading }) => (
  <div className="flex flex-wrap items-center gap-2">
    {["today", "yesterday", "week", "month", "custom"].map((r) => (
      <button
        key={r}
        onClick={() => setRange(r)}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${range === r ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100"}`}
      >
        {r === "week" ? "This Week" : r === "month" ? "This Month" : r.charAt(0).toUpperCase() + r.slice(1)}
      </button>
    ))}
    {range === "custom" && (
      <>
        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-gray-400 text-xs">to</span>
        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </>
    )}
    <button onClick={onRefresh} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
      <FiRefreshCw className={loading ? "animate-spin" : ""} size={12} /> Refresh
    </button>
  </div>
);

const Table = ({ id, headers, rows, renderRow, emptyMsg = "No records found" }) => (
  <div id={id} className="overflow-x-auto">
    <table className="min-w-full text-xs">
      <thead>
        <tr className="bg-[#1b7f29]">
          {headers.map((h) => (
            <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length} className="text-center py-12 text-gray-400 font-bold">{emptyMsg}</td></tr>
        ) : rows.map((row, i) => renderRow(row, i))}
      </tbody>
    </table>
  </div>
);

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  const map = {
    paid: "bg-emerald-50 text-emerald-600",
    active: "bg-emerald-50 text-emerald-600",
    completed: "bg-emerald-50 text-emerald-600",
    delivered: "bg-emerald-50 text-emerald-600",
    pending: "bg-amber-50 text-amber-600",
    processing: "bg-blue-50 text-blue-600",
    cancelled: "bg-red-50 text-red-500",
    inactive: "bg-gray-100 text-gray-500",
    unpaid: "bg-red-50 text-red-500",
    suspended: "bg-red-50 text-red-500",
  };
  const cls = map[s] || "bg-gray-100 text-gray-500";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cls}`}>{status || "—"}</span>
  );
};

/* ══════════════════════════════════════════════
   TAB PANELS
══════════════════════════════════════════════ */

/* ─── Sales ─── */
const SalesReport = () => {
  const [data, setData] = useState({ data: [], summary: {}, monthly: [] });
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [filters, setFilters] = useState({ invoice_number: "", customer_name: "", payment_method: "", payment_status: "", order_status: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/sales", {
        params: { range, from: customFrom, to: customTo, ...filters },
      });
      setData(res.data);
    } catch { toast.error("Failed to load sales report"); }
    finally { setLoading(false); }
  }, [range, customFrom, customTo, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data.summary;

  const handleExport = () => {
    exportCSV("sales_report",
      ["order_id", "customer_name", "customer_phone", "payment_method", "payment_status", "status", "total_amount", "created_at"],
      data.data
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start">
        <DateRangeBar range={range} setRange={setRange} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} onRefresh={fetchData} loading={loading} />
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm">
            <FiDownload size={13} /> Export CSV
          </button>
          <button onClick={() => printSection("sales-table")} className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm">
            <FiPrinter size={13} /> Print
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FiShoppingCart />} label="Total Orders" value={fmtNum(s.total_orders)} color="blue" />
        <StatCard icon={<FiDollarSign />} label="Total Revenue" value={fmt(s.total_revenue)} color="green" />
        <StatCard icon={<FiTrendingUp />} label="Avg. Order Value" value={fmt(s.avg_order_value)} color="purple" />
        <StatCard icon={<FiXCircle />} label="Cancelled Orders" value={fmtNum(s.cancelled_count)} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <input placeholder="Invoice / Order #" value={filters.invoice_number}
            onChange={(e) => setFilters((f) => ({ ...f, invoice_number: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Customer Name" value={filters.customer_name}
            onChange={(e) => setFilters((f) => ({ ...f, customer_name: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={filters.payment_method}
            onChange={(e) => setFilters((f) => ({ ...f, payment_method: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Payment Methods</option>
            {["Cash", "UPI", "Card", "Online", "Offline"].map((m) => <option key={m}>{m}</option>)}
          </select>
          <select value={filters.payment_status}
            onChange={(e) => setFilters((f) => ({ ...f, payment_status: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Payment Status</option>
            {["pending", "paid", "failed"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.order_status}
            onChange={(e) => setFilters((f) => ({ ...f, order_status: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Order Status</option>
            {["Order Placed", "Processing", "Delivered", "Cancelled", "Paid"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={fetchData} className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
          <FiSearch size={12} /> Apply Filters
        </button>
      </div>

      {/* Monthly chart */}
      {data.monthly?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 mb-6 uppercase tracking-widest">Monthly Revenue Trend</h3>
          <div className="h-40 flex items-end gap-2">
            {data.monthly.map((m, i) => {
              const maxRev = Math.max(...data.monthly.map((x) => x.revenue));
              const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${m.month}: ${fmt(m.revenue)}`}>
                  <div className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600" style={{ height: `${Math.max(pct, 3)}%` }}></div>
                  <span className="text-[9px] font-bold text-gray-300 rotate-0">{m.month?.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Sales Records</h3>
          <span className="text-xs text-gray-400 font-bold">{data.data.length} records</span>
        </div>
        {loading ? <div className="py-16 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div> :
          <Table
            id="sales-table"
            headers={["Invoice #", "Customer", "Phone", "Payment Method", "Payment Status", "Order Status", "Amount", "Date"]}
            rows={data.data}
            renderRow={(r, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-blue-600">{r.order_id}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{r.customer_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.customer_phone}</td>
                <td className="px-4 py-3 text-gray-600">{r.payment_method}</td>
                <td className="px-4 py-3"><StatusBadge status={r.payment_status} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 font-bold text-emerald-600">{fmt(r.total_amount)}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
              </tr>
            )}
          />
        }
      </div>
    </div>
  );
};

/* ─── Products ─── */
const ProductsReport = () => {
  const [data, setData] = useState({ data: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/products", { params: { search, category, status } });
      setData(res.data);
    } catch { toast.error("Failed to load products report"); }
    finally { setLoading(false); }
  }, [search, category, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data.summary;
  const sorted = [...(data.data || [])];
  const bestSelling = [...sorted].sort((a, b) => b.total_sold - a.total_sold).slice(0, 5);
  const leastSelling = [...sorted].sort((a, b) => a.total_sold - b.total_sold).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
          </div>
          <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option>Active</option><option>Inactive</option>
          </select>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
            <FiSearch size={12} /> Search
          </button>
        </div>
        <button onClick={() => exportCSV("products_report", ["name", "product_code", "category", "stock", "selling_price", "total_sold", "total_revenue", "status"], data.data)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all">
          <FiDownload size={13} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={<FiPackage />} label="Total Products" value={fmtNum(s.total_products)} color="blue" />
        <StatCard icon={<FiCheckCircle />} label="Active" value={fmtNum(s.active_products)} color="green" />
        <StatCard icon={<FiXCircle />} label="Inactive" value={fmtNum(s.inactive_products)} color="red" />
        <StatCard icon={<FiAlertTriangle />} label="Low Stock" value={fmtNum(s.low_stock)} color="orange" />
        <StatCard icon={<FiBox />} label="Out of Stock" value={fmtNum(s.out_of_stock)} color="red" />
        <StatCard icon={<FiDollarSign />} label="Inventory Value" value={fmt(s.inventory_value)} color="purple" />
      </div>

      {/* Best / Least Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <FiStar className="text-amber-500" />
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Best Selling Products</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {bestSelling.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-amber-100 text-amber-600 text-[10px] font-black rounded-full flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-600">{fmt(p.total_revenue)}</p>
                  <p className="text-[10px] text-gray-400">{fmtNum(p.total_sold)} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <FiArrowDown className="text-red-400" />
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Least Selling Products</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {leastSelling.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-red-100 text-red-500 text-[10px] font-black rounded-full flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-600">{fmt(p.total_revenue)}</p>
                  <p className="text-[10px] text-gray-400">{fmtNum(p.total_sold)} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All products table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">All Products</h3>
          <span className="text-xs text-gray-400 font-bold">{data.data.length} records</span>
        </div>
        {loading ? <div className="py-16 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div> :
          <Table
            headers={["#", "Product", "Code", "Category", "MRP", "Price", "Stock", "Sold", "Revenue", "Status"]}
            rows={data.data}
            renderRow={(p, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-bold">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-700 max-w-[150px] truncate">{p.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{p.product_code}</td>
                <td className="px-4 py-3 text-gray-500">{p.category}</td>
                <td className="px-4 py-3 text-gray-400 line-through">{fmt(p.mrp)}</td>
                <td className="px-4 py-3 font-bold text-slate-700">{fmt(p.selling_price)}</td>
                <td className="px-4 py-3">
                  <span className={`font-black text-xs ${p.stock === 0 ? "text-red-500" : p.stock <= 10 ? "text-amber-500" : "text-emerald-600"}`}>{fmtNum(p.stock)}</span>
                </td>
                <td className="px-4 py-3 font-bold text-blue-600">{fmtNum(p.total_sold)}</td>
                <td className="px-4 py-3 font-bold text-emerald-600">{fmt(p.total_revenue)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
              </tr>
            )}
          />
        }
      </div>
    </div>
  );
};

/* ─── Category ─── */
const CategoryReport = () => {
  const [data, setData] = useState({ data: [], summary: {} });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/categories");
      setData(res.data);
    } catch { toast.error("Failed to load category report"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = data.data.reduce((acc, c) => acc + parseFloat(c.total_revenue || 0), 0);
  const best = data.data[0];
  const worst = data.data[data.data.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2">
          <StatCard icon={<FiGrid />} label="Total Categories" value={fmtNum(data.summary.total_categories)} color="blue" />
          {best && <StatCard icon={<FiStar />} label="Best Category" value={best.name} sub={fmt(best.total_revenue)} color="green" />}
          {worst && <StatCard icon={<FiArrowDown />} label="Low Performing" value={worst.name} sub={fmt(worst.total_revenue)} color="red" />}
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV("category_report", ["name", "total_products", "total_sold", "total_revenue", "stock_value"], data.data)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all">
            <FiDownload size={13} /> Export CSV
          </button>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Revenue bars */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6">Revenue by Category</h3>
        <div className="space-y-4">
          {data.data.map((cat, i) => {
            const pct = totalRevenue > 0 ? ((cat.total_revenue / totalRevenue) * 100).toFixed(1) : 0;
            const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500", "bg-amber-500"];
            return (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`}></span>
                    <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                    <span className="text-[10px] text-gray-400">{cat.total_products} products</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-700">{fmt(cat.total_revenue)}</span>
                    <span className="text-[10px] text-gray-400 ml-2">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                  <div className={`${colors[i % colors.length]} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Category Details</h3>
        </div>
        {loading ? <div className="py-16 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div> :
          <Table
            headers={["#", "Category", "Products", "Units Sold", "Revenue", "Stock Value", "Performance"]}
            rows={data.data}
            renderRow={(c, i) => {
              const pct = totalRevenue > 0 ? ((c.total_revenue / totalRevenue) * 100).toFixed(1) : 0;
              return (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-bold">{i + 1}</td>
                  <td className="px-4 py-3 font-black text-slate-700">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtNum(c.total_products)}</td>
                  <td className="px-4 py-3 text-blue-600 font-bold">{fmtNum(c.total_sold)}</td>
                  <td className="px-4 py-3 font-black text-emerald-600">{fmt(c.total_revenue)}</td>
                  <td className="px-4 py-3 text-purple-600 font-bold">{fmt(c.stock_value)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${i === 0 ? "bg-emerald-50 text-emerald-600" : i >= data.data.length - 2 ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600"}`}>
                      {i === 0 ? "Best" : i >= data.data.length - 2 ? "Low" : `${pct}%`}
                    </span>
                  </td>
                </tr>
              );
            }}
          />
        }
      </div>
    </div>
  );
};

/* ─── Customers ─── */
const CustomerReport = () => {
  const [data, setData] = useState({ data: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/customers", { params: { range, from: customFrom, to: customTo, search } });
      setData(res.data);
    } catch { toast.error("Failed to load customer report"); }
    finally { setLoading(false); }
  }, [range, customFrom, customTo, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start">
        <DateRangeBar range={range} setRange={setRange} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} onRefresh={fetchData} loading={loading} />
        <div className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => exportCSV("customer_report", ["customer_name", "customer_email", "customer_phone", "total_orders", "total_spending", "last_purchase"], data.data)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all">
            <FiDownload size={13} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<FiUsers />} label="Total Customers" value={fmtNum(s.total_customers)} color="blue" />
        <StatCard icon={<FiUserPlus />} label="New Customers (30d)" value={fmtNum(s.new_customers)} color="green" />
        <StatCard icon={<FiRepeat />} label="Repeat Customers" value={fmtNum(s.repeat_customers)} color="purple" />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Customer Purchase History</h3>
          <span className="text-xs text-gray-400 font-bold">{data.data.length} customers</span>
        </div>
        {loading ? <div className="py-16 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div> :
          <Table
            headers={["#", "Customer", "Email", "Phone", "Total Orders", "Total Spending", "Last Purchase", "Completed"]}
            rows={data.data}
            renderRow={(c, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-bold">{i + 1}</td>
                <td className="px-4 py-3 font-black text-slate-700">{c.customer_name}</td>
                <td className="px-4 py-3 text-gray-500 text-[10px]">{c.customer_email}</td>
                <td className="px-4 py-3 text-gray-500">{c.customer_phone}</td>
                <td className="px-4 py-3 font-bold text-blue-600">{fmtNum(c.total_orders)}</td>
                <td className="px-4 py-3 font-black text-emerald-600">{fmt(c.total_spending)}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(c.last_purchase)}</td>
                <td className="px-4 py-3 font-bold text-slate-600">{fmtNum(c.completed_orders)}</td>
              </tr>
            )}
          />
        }
      </div>
    </div>
  );
};

// Simple icons not in fi set
const FiUserPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
const FiRepeat = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;

/* ─── Inventory ─── */
const InventoryReport = () => {
  const [data, setData] = useState({ data: [], summary: {}, stockMovement: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/inventory", { params: { search, category, stock_status: stockStatus } });
      setData(res.data);
    } catch { toast.error("Failed to load inventory report"); }
    finally { setLoading(false); }
  }, [search, category, stockStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input placeholder="Search product..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Stock Status</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
            <FiFilter size={12} /> Filter
          </button>
        </div>
        <button onClick={() => exportCSV("inventory_report", ["name", "product_code", "category", "stock_quantity", "selling_price", "stock_value", "expiry_date", "status"], data.data)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all">
          <FiDownload size={13} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={<FiDatabase />} label="Total Stock" value={fmtNum(s.total_stock)} color="blue" />
        <StatCard icon={<FiCheckCircle />} label="Available" value={fmtNum(s.available_stock)} color="green" />
        <StatCard icon={<FiAlertTriangle />} label="Low Stock" value={fmtNum(s.low_stock)} color="orange" />
        <StatCard icon={<FiXCircle />} label="Out of Stock" value={fmtNum(s.out_of_stock)} color="red" />
        <StatCard icon={<FiPackage />} label="Total Products" value={fmtNum(s.total_products)} color="indigo" />
        <StatCard icon={<FiDollarSign />} label="Inventory Value" value={fmt(s.inventory_value)} color="purple" />
      </div>

      {/* Stock Movement */}
      {data.stockMovement?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Stock Movement — Top Sold (Last 30 Days)</h3>
          </div>
          <Table
            headers={["Product", "Code", "Units Sold", "Revenue"]}
            rows={data.stockMovement}
            renderRow={(p, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-700">{p.name}</td>
                <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{p.product_code}</td>
                <td className="px-4 py-3 font-bold text-blue-600">{fmtNum(p.units_sold)}</td>
                <td className="px-4 py-3 font-bold text-emerald-600">{fmt(p.revenue)}</td>
              </tr>
            )}
          />
        </div>
      )}

      {/* Full inventory table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Current Stock</h3>
          <span className="text-xs text-gray-400 font-bold">{data.data.length} products</span>
        </div>
        {loading ? <div className="py-16 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div> :
          <Table
            headers={["#", "Product", "Code", "Category", "Stock Qty", "Price", "Stock Value", "Expiry", "Status"]}
            rows={data.data}
            renderRow={(p, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-bold">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-700 max-w-[140px] truncate">{p.name}</td>
                <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{p.product_code}</td>
                <td className="px-4 py-3 text-gray-500">{p.category}</td>
                <td className="px-4 py-3">
                  <span className={`font-black text-sm ${p.stock_quantity === 0 ? "text-red-500" : p.stock_quantity <= 10 ? "text-amber-500" : "text-emerald-600"}`}>
                    {fmtNum(p.stock_quantity)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 font-bold">{fmt(p.selling_price)}</td>
                <td className="px-4 py-3 font-bold text-purple-600">{fmt(p.stock_value)}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.expiry_date ? fmtDate(p.expiry_date) : "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
              </tr>
            )}
          />
        }
      </div>
    </div>
  );
};

/* ─── Purchase ─── */
const PurchaseReport = () => {
  const [data, setData] = useState({ data: [], summary: {}, supplierSummary: [] });
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [supplier, setSupplier] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/purchases", { params: { range, from: customFrom, to: customTo, supplier, payment_status: paymentStatus } });
      setData(res.data);
    } catch { toast.error("Failed to load purchase report"); }
    finally { setLoading(false); }
  }, [range, customFrom, customTo, supplier, paymentStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start">
        <DateRangeBar range={range} setRange={setRange} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} onRefresh={fetchData} loading={loading} />
        <div className="flex gap-2">
          <button onClick={() => exportCSV("purchase_report", ["invoice_id", "invoice_date", "supplier_name", "supplier_company", "total_amount", "payment_status", "status"], data.data)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all">
            <FiDownload size={13} /> Export CSV
          </button>
          <button onClick={() => printSection("purchase-table")} className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all">
            <FiPrinter size={13} /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={<FiFileText />} label="Total Purchases" value={fmtNum(s.total_purchases)} color="blue" />
        <StatCard icon={<FiDollarSign />} label="Total Amount" value={fmt(s.total_amount)} color="green" />
        <StatCard icon={<FiTruck />} label="Suppliers" value={fmtNum(s.total_suppliers)} color="purple" />
        <StatCard icon={<FiCheckCircle />} label="Paid" value={fmtNum(s.paid_count)} color="green" />
        <StatCard icon={<FiAlertTriangle />} label="Pending" value={fmtNum(s.pending_count)} color="orange" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input placeholder="Supplier name..." value={supplier} onChange={(e) => setSupplier(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
            <FiSearch size={12} /> Apply
          </button>
        </div>
      </div>

      {/* Supplier Summary */}
      {data.supplierSummary?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Supplier-wise Purchases</h3>
          </div>
          <Table
            headers={["Supplier", "Company", "Total Invoices", "Total Spent"]}
            rows={data.supplierSummary}
            renderRow={(s, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-black text-slate-700">{s.supplier_name || "Unknown"}</td>
                <td className="px-4 py-3 text-gray-500">{s.companyName}</td>
                <td className="px-4 py-3 font-bold text-blue-600">{fmtNum(s.total_invoices)}</td>
                <td className="px-4 py-3 font-black text-emerald-600">{fmt(s.total_spent)}</td>
              </tr>
            )}
          />
        </div>
      )}

      {/* Purchase table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Purchase Records</h3>
          <span className="text-xs text-gray-400 font-bold">{data.data.length} records</span>
        </div>
        {loading ? <div className="py-16 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div> :
          <Table
            id="purchase-table"
            headers={["Invoice #", "Date", "Supplier", "Company", "Items", "Qty", "Total Amount", "Payment", "Status"]}
            rows={data.data}
            renderRow={(p, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-blue-600">{p.invoice_id}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(p.invoice_date)}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{p.supplier_name || "Unknown"}</td>
                <td className="px-4 py-3 text-gray-400">{p.supplier_company}</td>
                <td className="px-4 py-3 text-gray-600">{fmtNum(p.item_count)}</td>
                <td className="px-4 py-3 text-gray-600">{fmtNum(p.total_qty)}</td>
                <td className="px-4 py-3 font-black text-emerald-600">{fmt(p.total_amount)}</td>
                <td className="px-4 py-3">{p.payment_method}</td>
                <td className="px-4 py-3"><StatusBadge status={p.payment_status} /></td>
              </tr>
            )}
          />
        }
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN REPORTS PAGE
══════════════════════════════════════════════ */
const TABS = [
  { id: "sales", label: "Sales", icon: <FiShoppingCart /> },
  { id: "products", label: "Products", icon: <FiPackage /> },
  { id: "categories", label: "Categories", icon: <FiGrid /> },
  { id: "customers", label: "Customers", icon: <FiUsers /> },
  { id: "inventory", label: "Inventory", icon: <FiDatabase /> },
  { id: "purchases", label: "Purchases", icon: <FiTruck /> },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">Comprehensive business intelligence across all modules</p>
        </div>
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <FiBarChart2 size={18} />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:text-slate-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Panel */}
      <div className="transition-all duration-300">
        {activeTab === "sales" && <SalesReport />}
        {activeTab === "products" && <ProductsReport />}
        {activeTab === "categories" && <CategoryReport />}
        {activeTab === "customers" && <CustomerReport />}
        {activeTab === "inventory" && <InventoryReport />}
        {activeTab === "purchases" && <PurchaseReport />}
      </div>
    </div>
  );
};

export default Reports;
