import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import {
  FiDollarSign, FiCheck, FiRefreshCw, FiEdit2, FiTrash2,
  FiDownload, FiEye, FiUsers, FiClock, FiSearch, FiX, FiPlus
} from "react-icons/fi";

/* ─── helpers ─── */
const fmt = v => `₹${parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const Status_Color = {
  Pending:    "bg-amber-50 text-amber-600 border border-amber-200",
  Processing: "bg-blue-50 text-blue-600 border border-blue-200",
  Paid:       "bg-emerald-50 text-emerald-600 border border-emerald-200",
};

const Avatar = ({ name, photo }) => (
  photo
    ? <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow" />
    : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow">
        {(name || "?")[0].toUpperCase()}
      </div>
);

/* ── Modal ── */
const Modal = ({ title, onClose, children, size = "md" }) => createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className={`bg-white rounded-3xl shadow-2xl w-full ${size === "lg" ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h3 className="text-lg font-black text-slate-800">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all">
          <FiX size={14} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>,
  document.body
);

/* ── salary form ── */
const SalaryForm = ({ initial, employees, onSave, onClose }) => {
  const [form, setForm] = useState({
    employee_id: "", salary_month: new Date().toISOString().slice(0, 7),
    basic_salary: "", hra: "", da: "", travel_allowance: "", medical_allowance: "",
    incentive: "", bonus: "", overtime_amount: "", other_allowances: "",
    pf: "", esi: "", professional_tax: "", loan_deduction: "",
    advance_salary: "", leave_deduction: "", other_deductions: "",
    working_days: 26, present_days: "", leave_days: "", overtime_hours: 0, remarks: "",
    ...(initial || {})
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const gross = ["basic_salary","hra","da","travel_allowance","medical_allowance","incentive","bonus","overtime_amount","other_allowances"].reduce((s, k) => s + parseFloat(form[k] || 0), 0);
  const deductions = ["pf","esi","professional_tax","loan_deduction","advance_salary","leave_deduction","other_deductions"].reduce((s, k) => s + parseFloat(form[k] || 0), 0);
  const net = gross - deductions;

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const FieldRow = ({ label, k }) => (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</label>
      <input type="number" min={0} step={0.01} value={form[k] || ""} onChange={e => set(k, e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Employee *</label>
          <select required value={form.employee_id} onChange={e => set("employee_id", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Month *</label>
          <input type="month" required value={form.salary_month} onChange={e => set("salary_month", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      <div>
        <p className="text-xs font-black text-slate-700 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">Earnings</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[["Basic Salary","basic_salary"],["HRA","hra"],["DA","da"],
            ["Travel Allow.","travel_allowance"],["Medical Allow.","medical_allowance"],
            ["Incentive","incentive"],["Bonus","bonus"],["Overtime","overtime_amount"],["Others","other_allowances"]].map(([l, k]) => (
            <FieldRow key={k} label={l} k={k} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-black text-slate-700 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">Deductions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[["PF","pf"],["ESI","esi"],["Prof. Tax","professional_tax"],
            ["Loan","loan_deduction"],["Advance","advance_salary"],["Leave Ded.","leave_deduction"],["Others","other_deductions"]].map(([l, k]) => (
            <FieldRow key={k} label={l} k={k} />
          ))}
        </div>
      </div>

      {/* summary strip */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 flex justify-between items-center text-white">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold">Gross</p>
          <p className="text-base font-black">{fmt(gross)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-red-300 font-bold">Deductions</p>
          <p className="text-base font-black text-red-300">{fmt(deductions)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-emerald-300 font-bold">Net Salary</p>
          <p className="text-xl font-black text-emerald-300">{fmt(net)}</p>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Remarks</label>
        <textarea rows={2} value={form.remarks} onChange={e => set("remarks", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-black hover:bg-green-700 transition-all disabled:opacity-60">
          {saving ? "Saving..." : "Save Salary"}
        </button>
      </div>
    </form>
  );
};

/* ── Pay Modal ── */
const PayModal = ({ record, onPay, onClose }) => {
  const [form, setForm] = useState({ payment_method: "Bank Transfer", payment_reference: "", payment_date: new Date().toISOString().slice(0, 10), remarks: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 font-bold">{record?.employee_name}</p>
          <p className="text-xs text-gray-400">{record?.salary_month}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Net Salary</p>
          <p className="text-xl font-black text-emerald-600">{fmt(record?.net_salary)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Method</label>
          <select value={form.payment_method} onChange={e => set("payment_method", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {["Cash","Bank Transfer","UPI","Cheque"].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Date</label>
          <input type="date" value={form.payment_date} onChange={e => set("payment_date", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reference Number</label>
        <input value={form.payment_reference} onChange={e => set("payment_reference", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Remarks</label>
        <textarea rows={2} value={form.remarks} onChange={e => set("remarks", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
      </div>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={async () => { setSaving(true); try { await onPay(form); } finally { setSaving(false); } }} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-60">
          {saving ? "Processing..." : "Mark as Paid"}
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
const SalaryManagement = () => {
  const navigate = useNavigate();
  const [salaries, setSalaries]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashData, setDashData]   = useState({});
  const [loading, setLoading]     = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [payRecord, setPayRecord] = useState(null);
  const [filters, setFilters]     = useState({
    month: new Date().toISOString().slice(0, 7), status: "", search: ""
  });

  const loadSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        api.get("/salary", { params: { month: filters.month, status: filters.status } }),
        api.get("/salary/summary", { params: { month: filters.month } }),
      ]);
      setSalaries(sRes.data.data || []);
      setDashData(dRes.data.data || {});
    } catch { toast.error("Failed to load salary data"); }
    finally { setLoading(false); }
  }, [filters.month, filters.status]);

  useEffect(() => {
    api.get("/staff").then(r => setEmployees(r.data || [])).catch(() => {});
  }, []);
  useEffect(() => { loadSalaries(); }, [loadSalaries]);

  /* ── auto calculate ── */
  const calculateSalary = async () => {
    if (!window.confirm(`Auto-calculate salary for all employees for ${filters.month}?`)) return;
    setCalcLoading(true);
    try {
      const r = await api.post("/salary/calculate", { salary_month: filters.month });
      toast.success(r.data.message || "Calculated!");
      loadSalaries();
    } catch (err) { toast.error(err.response?.data?.message || "Calculation failed"); }
    finally { setCalcLoading(false); }
  };

  /* ── save salary ── */
  const handleSave = async (form) => {
    try {
      await api.post("/salary", form);
      toast.success("Salary saved!");
      setShowForm(false); setEditing(null);
      loadSalaries();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
  };

  /* ── pay salary ── */
  const handlePay = async (payForm) => {
    try {
      await api.put(`/salary/pay/${payRecord.id}`, payForm);
      toast.success("Salary marked as paid!");
      setPayRecord(null);
      loadSalaries();
    } catch (err) { toast.error(err.response?.data?.message || "Payment failed"); }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this salary record?")) return;
    try { await api.delete(`/salary/${id}`); toast.success("Deleted"); loadSalaries(); }
    catch { toast.error("Delete failed"); }
  };

  const filtered = salaries.filter(s =>
    (s.employee_name || "").toLowerCase().includes(filters.search.toLowerCase())
  );

  /* ─── render ─── */
  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Salary Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Process, track and pay employee salaries</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-sm font-black text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
            <FiPlus size={13} /> Add Salary
          </button>
          <button onClick={calculateSalary} disabled={calcLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60">
            {calcLoading ? <FiRefreshCw size={13} className="animate-spin" /> : <FiRefreshCw size={13} />}
            Auto Calculate
          </button>
          <button onClick={() => navigate("/admin/staff")}
            className="px-4 py-2.5 bg-white border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
            ← Back
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Total Payroll", fmt(dashData.total_payroll), "text-slate-700", "bg-slate-50"],
          ["Paid", fmt(dashData.paid_amount), "text-emerald-600", "bg-emerald-50"],
          ["Pending", fmt(dashData.pending_amount), "text-amber-600", "bg-amber-50"],
          [`Employees`, `${dashData.paid_count || 0} / ${dashData.total_employees || 0}`, "text-blue-600", "bg-blue-50"],
        ].map(([l, v, tc, bg]) => (
          <div key={l} className={`${bg} rounded-2xl p-5 border border-white`}>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{l}</p>
            <h3 className={`text-xl font-black mt-1 ${tc}`}>{v}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input placeholder="Search employee..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <input type="month" value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-500" />
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Status</option>
          <option>Pending</option><option>Processing</option><option>Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-[#1b7f29] border-b border-[#dce9df]">
                  {["Employee","Month","Gross","Deductions","Net Salary","Status","Payment","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-gray-400 font-bold">
                    No salary records. Click "Auto Calculate" to generate from attendance.
                  </td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.employee_name} photo={s.employee_photo} />
                        <div>
                          <p className="font-black text-slate-800">{s.employee_name}</p>
                          <p className="text-[10px] text-gray-400">{s.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-600">{s.salary_month}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{fmt(s.gross_salary)}</td>
                    <td className="px-4 py-3 font-bold text-red-500">-{fmt(s.total_deductions)}</td>
                    <td className="px-4 py-3 font-black text-emerald-600 text-sm">{fmt(s.net_salary)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${Status_Color[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-[10px]">
                      {s.payment_method && <span className="font-bold text-gray-600">{s.payment_method}</span>}
                      {s.payment_date && <span className="block text-[9px]">{fmtDate(s.payment_date)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/admin/staff/salary/payslip/${s.id}`)} title="View Payslip"
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all">
                          <FiEye size={12} />
                        </button>
                        {s.status !== "Paid" && (
                          <button onClick={() => setPayRecord(s)} title="Mark Paid"
                            className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-all">
                            <FiCheck size={12} />
                          </button>
                        )}
                        <button onClick={() => { setEditing(s); setShowForm(true); }} title="Edit"
                          className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-all">
                          <FiEdit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} title="Delete"
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all">
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <Modal title={editing ? "Edit Salary Record" : "Add Salary Record"} onClose={() => { setShowForm(false); setEditing(null); }} size="lg">
          <SalaryForm initial={editing} employees={employees} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />
        </Modal>
      )}

      {/* ── Pay Modal ── */}
      {payRecord && (
        <Modal title="Process Payment" onClose={() => setPayRecord(null)}>
          <PayModal record={payRecord} onPay={handlePay} onClose={() => setPayRecord(null)} />
        </Modal>
      )}
    </div>
  );
};

export default SalaryManagement;
