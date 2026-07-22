import React, { useState, useEffect } from "react";
import api from "../../../api";
import {
  FiShoppingBag, FiTrendingUp, FiUsers, FiClock,
  FiCheckCircle, FiAlertCircle, FiDollarSign, FiRefreshCw,
  FiPackage, FiArrowUp, FiArrowDown
} from "react-icons/fi";

/* ─── Mini Bar Chart (pure CSS) ─── */
const BarChart = ({ data, color = "#6366f1" }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-400 text-center py-4">No data</div>;
  }

  const normalized = data.map((item) => ({
    ...item,
    value: Number(item.value ?? item.total ?? 0) || 0,
    label: item.name || item.month || '—'
  }));

  const max = Math.max(...normalized.map((d) => d.value), 1);
  const hasAnyValue = normalized.some((d) => d.value > 0);
  if (!hasAnyValue) {
    return <div className="text-xs text-gray-400 text-center py-4">No purchase value data</div>;
  }

  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {normalized.map((item, i) => {
        const pct = Math.max((item.value / max) * 100, 6);
        return (
          <div key={i} className="flex flex-col items-center flex-1 group relative min-w-[24px]">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none z-10 transition-opacity">
              {item.label}: ₹{item.value.toLocaleString('en-IN')}
            </div>
            <div
              className="w-full rounded-t-xl transition-all duration-500"
              style={{ height: `${pct}%`, backgroundColor: color, opacity: 0.92 }}
            />
            <span className="text-[10px] text-gray-400 mt-2 truncate w-full text-center">
              {item.label.slice(0, 5)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ label, value, sub, icon: Icon, color, trend }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow group`}>
    <div className="flex justify-between items-start mb-3">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
        <Icon size={18} className="text-white" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend >= 0 ? <FiArrowUp size={10}/> : <FiArrowDown size={10}/>}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-2xl font-black text-slate-800 leading-tight">{value}</p>
    <p className="text-xs font-bold text-gray-500 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

const PurchaseDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/purchases/dashboard/stats");
      if (res.data.success) {
        setStats(res.data.stats);
        setCharts(res.data.charts);
      }
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-red-100 p-12 text-center shadow-xl max-w-md">
          <FiAlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Dashboard Error</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button onClick={fetchStats} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const s = stats || {};

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiShoppingBag size={20} className="text-white" />
            </div>
            Purchase Dashboard
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">
            Real-time purchase analytics &amp; insights
          </p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
          <FiRefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ─── KPI Cards Row 1 ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Purchases" value={fmt(s.today?.amount)} sub={`${fmtNum(s.today?.count)} invoices`} icon={FiShoppingBag} color="bg-gradient-to-br from-indigo-500 to-indigo-600" />
        <StatCard label="This Week" value={fmt(s.week?.amount)} sub={`${fmtNum(s.week?.count)} invoices`} icon={FiTrendingUp} color="bg-gradient-to-br from-violet-500 to-violet-600" />
        <StatCard label="This Month" value={fmt(s.month?.amount)} sub={`${fmtNum(s.month?.count)} invoices`} icon={FiPackage} color="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard label="Total Purchases" value={fmt(s.total?.amount)} sub={`${fmtNum(s.total?.count)} all time`} icon={FiDollarSign} color="bg-gradient-to-br from-cyan-500 to-cyan-600" />
      </div>

      {/* ─── KPI Cards Row 2 ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Outstanding Balance" value={fmt(s.outstanding)} sub="Due to suppliers" icon={FiAlertCircle} color="bg-gradient-to-br from-red-500 to-red-600" />
        <StatCard label="Total Paid" value={fmt(s.paid)} sub="Across all invoices" icon={FiCheckCircle} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <StatCard label="Pending Orders" value={fmtNum(s.pendingPOs)} sub="Purchase orders" icon={FiClock} color="bg-gradient-to-br from-amber-500 to-amber-600" />
        <StatCard label="Total Suppliers" value={fmtNum(s.suppliers)} sub="Active suppliers" icon={FiUsers} color="bg-gradient-to-br from-pink-500 to-pink-600" />
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Monthly Trend */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800">Monthly Purchase Trend</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Last 6 months</p>
            </div>
            <FiTrendingUp className="text-indigo-400" size={20} />
          </div>
          <BarChart data={(charts?.monthlyTrend || []).map(m => ({ name: m.month, value: m.total }))} color="#6366f1" />
        </div>

        {/* Top Suppliers */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-800">Top Suppliers</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">By purchase value</p>
          </div>
          {(charts?.supplierWise || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <FiUsers size={32} className="text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 font-bold">No supplier data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(charts?.supplierWise || []).slice(0, 6).map((s, i) => {
                const max = charts?.supplierWise?.[0]?.value || 1;
                const pct = Math.max((s.value / max) * 100, 4);
                const colors = ['bg-indigo-500','bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-pink-500'];
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[60%]">{s.name}</span>
                      <span className="text-[10px] font-black text-gray-500">{fmt(s.value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${colors[i % colors.length]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Top Products + Summary ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Top Products */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-sm font-black text-slate-800">Top Purchased Products</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">By quantity received</p>
          </div>
          {(charts?.topProducts || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <FiPackage size={32} className="text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 font-bold">No product data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(charts?.topProducts || []).slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.name || 'Unknown Product'}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Qty: {fmtNum(p.qty)} • {fmt(p.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Summary */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-800 mb-5">Financial Summary</h3>
          <div className="space-y-4">
            {[
              { label: "Total Purchase Value", value: fmt(s.total?.amount), color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Total Amount Paid", value: fmt(s.paid), color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Outstanding / Unpaid", value: fmt(s.outstanding), color: "text-red-600", bg: "bg-red-50" },
              { label: "Purchase Returns", value: `${fmtNum(s.returns?.count)} (${fmt(s.returns?.amount)})`, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Total Suppliers", value: fmtNum(s.suppliers), color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Pending POs", value: fmtNum(s.pendingPOs), color: "text-violet-600", bg: "bg-violet-50" },
            ].map((item, i) => (
              <div key={i} className={`flex justify-between items-center p-3 ${item.bg} rounded-xl`}>
                <span className="text-xs font-bold text-slate-700">{item.label}</span>
                <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PurchaseDashboard;
