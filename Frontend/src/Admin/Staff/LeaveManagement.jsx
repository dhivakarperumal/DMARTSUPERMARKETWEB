import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import {
  FiPlus, FiCheck, FiX, FiEdit2, FiTrash2,
  FiDownload, FiRefreshCw, FiCalendar, FiUsers,
  FiClock, FiAlertTriangle, FiSearch
} from "react-icons/fi";

/* ─── helpers ─── */
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_COLOR = {
  Pending:  "bg-amber-50 text-amber-600 border border-amber-200",
  Approved: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  Rejected: "bg-red-50 text-red-500 border border-red-200",
};

/* ── tiny modal shell ── */
const Modal = ({ title, onClose, children }) => createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

/* ── leave form ── */
const LeaveForm = ({ initial, employees, leaveTypes, onSave, onClose }) => {
  const [form, setForm] = useState({
    employee_id: "", leave_type_id: "", from_date: "", to_date: "",
    total_days: "", reason: "",
    ...(initial || {})
  });
  const [saving, setSaving] = useState(false);

  const calcDays = (from, to) => {
    if (!from || !to) return "";
    const diff = (new Date(to) - new Date(from)) / 86400000;
    return String(Math.max(1, Math.ceil(diff) + 1));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Employee *</label>
        <select required value={form.employee_id} onChange={e => set("employee_id", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Select Employee</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Leave Type *</label>
        <select required value={form.leave_type_id} onChange={e => set("leave_type_id", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Select Type</option>
          {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">From Date *</label>
          <input required type="date" value={form.from_date}
            onChange={e => { set("from_date", e.target.value); set("total_days", calcDays(e.target.value, form.to_date)); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">To Date *</label>
          <input required type="date" value={form.to_date}
            onChange={e => { set("to_date", e.target.value); set("total_days", calcDays(form.from_date, e.target.value)); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Total Days</label>
        <input type="number" min={0.5} step={0.5} value={form.total_days}
          onChange={e => set("total_days", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Reason</label>
        <textarea rows={3} value={form.reason} onChange={e => set("reason", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-black hover:bg-green-700 transition-all disabled:opacity-60">
          {saving ? "Saving..." : "Save Leave"}
        </button>
      </div>
    </form>
  );
};

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
const LeaveManagement = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("requests"); // requests | balance
  const [leaves, setLeaves]         = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [balance, setBalance]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [rejNote, setRejNote]       = useState({ id: null, note: "" });
  const [filters, setFilters]       = useState({ status: "", month: "", year: "", search: "" });
  const [balEmpId, setBalEmpId]     = useState("");

  /* ── fetch ── */
  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/leave", { params: { status: filters.status, month: filters.month, year: filters.year } });
      setLeaves(r.data.data || []);
    } catch { toast.error("Failed to load leaves"); }
    finally { setLoading(false); }
  }, [filters.status, filters.month, filters.year]);

  const loadBalance = useCallback(async () => {
    if (!balEmpId) return;
    setLoading(true);
    try {
      const r = await api.get(`/leave/balance/${balEmpId}`);
      setBalance(r.data.data || []);
    } catch { toast.error("Failed to load balance"); }
    finally { setLoading(false); }
  }, [balEmpId]);

  useEffect(() => {
    api.get("/leave/types").then(r => setLeaveTypes(r.data.data || [])).catch(() => {});
    api.get("/staff").then(r => setEmployees(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { if (tab === "requests") loadLeaves(); }, [tab, loadLeaves]);
  useEffect(() => { if (tab === "balance")  loadBalance(); }, [tab, loadBalance]);

  /* ── create ── */
  const handleSave = async (form) => {
    try {
      if (editing) {
        await api.put(`/leave/${editing.id}`, form);
        toast.success("Leave updated");
      } else {
        await api.post("/leave", form);
        toast.success("Leave submitted");
      }
      setShowForm(false); setEditing(null);
      loadLeaves();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
  };

  /* ── approve / reject ── */
  const approve = async (id) => {
    try {
      await api.put(`/leave/${id}`, { status: "Approved" });
      toast.success("Leave approved");
      loadLeaves();
    } catch { toast.error("Failed"); }
  };

  const submitReject = async () => {
    try {
      await api.put(`/leave/${rejNote.id}`, { status: "Rejected", rejection_note: rejNote.note });
      toast.success("Leave rejected");
      setRejNote({ id: null, note: "" });
      loadLeaves();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this leave request?")) return;
    try { await api.delete(`/leave/${id}`); toast.success("Deleted"); loadLeaves(); }
    catch { toast.error("Delete failed"); }
  };

  /* ── filtered ── */
  const filtered = leaves.filter(l =>
    (l.employee_name || "").toLowerCase().includes(filters.search.toLowerCase())
  );

  const pendingCount  = leaves.filter(l => l.status === "Pending").length;
  const approvedCount = leaves.filter(l => l.status === "Approved").length;
  const rejectedCount = leaves.filter(l => l.status === "Rejected").length;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Leave Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage leave requests, approvals, and leave balances</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-black rounded-xl hover:bg-green-700 transition-all shadow-sm">
            <FiPlus size={14} /> Add Leave
          </button>
          <button onClick={() => navigate("/admin/staff")}
            className="px-4 py-2.5 bg-white border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
            ← Back
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[["Total", leaves.length, "text-slate-700", "bg-gray-50"],
          ["Pending", pendingCount, "text-amber-600", "bg-amber-50"],
          ["Approved", approvedCount, "text-emerald-600", "bg-emerald-50"],
          ["Rejected", rejectedCount, "text-red-500", "bg-red-50"]].map(([l, v, tc, bg]) => (
          <div key={l} className={`${bg} rounded-2xl border border-white p-5`}>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{l}</p>
            <h3 className={`text-3xl font-black mt-1 ${tc}`}>{v}</h3>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {[["requests","Leave Requests"],["balance","Leave Balance"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${tab===id ? "bg-white text-slate-800 shadow-sm" : "text-gray-400 hover:text-slate-600"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ════ REQUESTS TAB ════ */}
      {tab === "requests" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input placeholder="Search employee..." value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Status</option>
              <option>Pending</option><option>Approved</option><option>Rejected</option>
            </select>
            <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <button onClick={loadLeaves}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all">
              <FiSearch size={12} /> Apply
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-[#1b7f29] border-b border-[#dce9df]">
                      {["Employee","Leave Type","From","To","Days","Reason","Status","Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8} className="py-16 text-center text-gray-400 font-bold">No leave requests found</td></tr>
                    ) : filtered.map((l, i) => (
                      <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-black text-slate-700">{l.employee_name}</p>
                            <p className="text-[10px] text-gray-400">{l.department}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600">
                          {l.leave_type_name}
                          <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded ${l.is_paid ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                            {l.is_paid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(l.from_date)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(l.to_date)}</td>
                        <td className="px-4 py-3 font-black text-slate-700">{l.total_days}d</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate" title={l.reason}>{l.reason || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${STATUS_COLOR[l.status]}`}>{l.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {l.status === "Pending" && (
                              <>
                                <button onClick={() => approve(l.id)} title="Approve"
                                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-all">
                                  <FiCheck size={13} />
                                </button>
                                <button onClick={() => setRejNote({ id: l.id, note: "" })} title="Reject"
                                  className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all">
                                  <FiX size={13} />
                                </button>
                              </>
                            )}
                            <button onClick={() => { setEditing(l); setShowForm(true); }} title="Edit"
                              className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-all">
                              <FiEdit2 size={12} />
                            </button>
                            <button onClick={() => handleDelete(l.id)} title="Delete"
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
        </div>
      )}

      {/* ════ BALANCE TAB ════ */}
      {tab === "balance" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <select value={balEmpId} onChange={e => setBalEmpId(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button onClick={loadBalance} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all">
              <FiSearch size={12} /> View Balance
            </button>
          </div>

          {balance.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {balance.map(t => (
                <div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.name}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${t.is_paid ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                      {t.is_paid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Total Allowed</span>
                      <span className="font-black text-slate-700">{t.total_days_per_year}d</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Used</span>
                      <span className="font-black text-red-500">{t.used_days}d</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (t.used_days / t.total_days_per_year) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Remaining</span>
                      <span className={`font-black ${t.remaining > 0 ? "text-emerald-600" : "text-red-500"}`}>{t.remaining}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {balance.length === 0 && balEmpId && !loading && (
            <div className="text-center py-12 text-gray-400 font-bold">No balance data — click View Balance</div>
          )}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <Modal title={editing ? "Edit Leave Request" : "Add Leave Request"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <LeaveForm
            initial={editing}
            employees={employees}
            leaveTypes={leaveTypes}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditing(null); }}
          />
        </Modal>
      )}

      {/* ── Reject Note Modal ── */}
      {rejNote.id && (
        <Modal title="Reject Leave" onClose={() => setRejNote({ id: null, note: "" })}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Please provide a reason for rejection:</p>
            <textarea rows={3} value={rejNote.note} onChange={e => setRejNote(r => ({ ...r, note: e.target.value }))}
              placeholder="Rejection reason..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setRejNote({ id: null, note: "" })}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={submitReject}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600">
                Reject
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveManagement;
