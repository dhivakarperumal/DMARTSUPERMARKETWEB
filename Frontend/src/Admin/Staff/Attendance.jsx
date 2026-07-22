import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import {
  FiCalendar, FiUsers, FiCheckCircle, FiXCircle, FiClock,
  FiDownload, FiPrinter, FiRefreshCw, FiChevronLeft,
  FiChevronRight, FiSave, FiBarChart2, FiAlertTriangle
} from "react-icons/fi";

/* ─── helpers ─── */
const fmt = (t) => t ? t.slice(0, 5) : "—";
const today = () => new Date().toISOString().slice(0, 10);
const monthStr = (d = new Date()) => d.toISOString().slice(0, 7);

const STATUS_OPTS = ["Present", "Absent", "Half Day", "Leave", "Weekly Off", "Holiday"];

const STATUS_COLOR = {
  Present:   "bg-emerald-100 text-emerald-700",
  Absent:    "bg-red-100 text-red-600",
  "Half Day":"bg-amber-100 text-amber-700",
  Leave:     "bg-blue-100 text-blue-600",
  "Weekly Off":"bg-purple-100 text-purple-600",
  Holiday:   "bg-indigo-100 text-indigo-700",
};

const Avatar = ({ name, photo }) => (
  photo
    ? <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow" />
    : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow">
        {(name || "?")[0].toUpperCase()}
      </div>
);

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    green:  "bg-emerald-50 text-emerald-600",
    red:    "bg-red-50 text-red-500",
    blue:   "bg-blue-50 text-blue-600",
    amber:  "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    gray:   "bg-gray-50 text-gray-500",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-slate-800 mt-1">{value ?? "—"}</h3>
    </div>
  );
};

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
const Attendance = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("mark"); // mark | history | summary
  const [date, setDate]   = useState(today());
  const [month, setMonth] = useState(monthStr());
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [employees, setEmployees] = useState([]);    // for marking
  const [history, setHistory]    = useState([]);     // for history
  const [summary, setSummary]    = useState([]);     // monthly summary
  const [todayStats, setTodayStats] = useState({});
  const [edited, setEdited] = useState({});          // employee_id → {status,check_in,check_out}

  /* ── load today's stats ── */
  const loadTodayStats = useCallback(async () => {
    try {
      const r = await api.get("/attendance/today");
      setTodayStats(r.data.data || {});
    } catch { /* silent */ }
  }, []);

  /* ── load employees for date (mark tab) ── */
  const loadForDate = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/attendance/for-date", { params: { date } });
      const rows = r.data.data || [];
      setEmployees(rows);
      // initialise edited state from existing DB values
      const init = {};
      rows.forEach(e => {
        init[e.id] = {
          status:    e.status || "Present",
          check_in:  e.check_in  || (e.shift_start || "09:00"),
          check_out: e.check_out || (e.shift_end || "18:00"),
        };
      });
      setEdited(init);
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  }, [date]);

  /* ── load history ── */
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/attendance", { params: { month } });
      setHistory(r.data.data || []);
    } catch { toast.error("Failed to load history"); }
    finally { setLoading(false); }
  }, [month]);

  /* ── load monthly summary ── */
  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/attendance/monthly-summary", { params: { month } });
      setSummary(r.data.data || []);
    } catch { toast.error("Failed to load summary"); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { loadTodayStats(); }, [loadTodayStats]);
  useEffect(() => { if (tab === "mark")    loadForDate(); }, [tab, loadForDate]);
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab, loadHistory]);
  useEffect(() => { if (tab === "summary") loadSummary(); }, [tab, loadSummary]);

  /* ── prev / next day ── */
  const shiftDate = (dir) => {
    const d = new Date(date);
    d.setDate(d.getDate() + dir);
    setDate(d.toISOString().slice(0, 10));
  };

  /* ── field change for mark tab ── */
  const onChange = (empId, field, val) => {
    setEdited(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: val }
    }));
  };

  /* ── bulk mark all as Present ── */
  const markAllPresent = () => {
    setEdited(prev => {
      const next = { ...prev };
      employees.forEach(e => { next[e.id] = { ...next[e.id], status: "Present" }; });
      return next;
    });
  };

  /* ── save attendance ── */
  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = employees.map(e => ({
        employee_id: e.id,
        status:    edited[e.id]?.status    || "Absent",
        check_in:  edited[e.id]?.check_in  || null,
        check_out: edited[e.id]?.check_out || null,
      }));
      await api.post("/attendance/bulk", { date, records });
      toast.success("Attendance saved!");
      loadTodayStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  /* ── CSV export ── */
  const exportCSV = (rows) => {
    const headers = ["Employee","Department","Date","Status","Check In","Check Out","Working Hrs","Overtime Hrs","Late"];
    const lines = [headers.join(",")];
    rows.forEach(r => lines.push([
      r.employee_name, r.department, r.date || date,
      r.status || edited[r.id]?.status,
      r.check_in || edited[r.id]?.check_in,
      r.check_out || edited[r.id]?.check_out,
      r.working_hours, r.overtime_hours,
      r.late_entry ? "Yes" : "No"
    ].map(v => `"${v ?? ""}"`).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `attendance_${date || month}.csv`; a.click();
  };

  /* ─── render ─── */
  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Attendance Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track daily attendance, view history and monthly summaries</p>
        </div>
        <button onClick={() => navigate("/admin/staff")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
          ← Back to Employees
        </button>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<FiUsers />}        label="Total"         value={todayStats.total_employees} color="gray" />
        <StatCard icon={<FiCheckCircle />}  label="Present"       value={todayStats.present}         color="green" />
        <StatCard icon={<FiXCircle />}      label="Absent"        value={todayStats.absent}          color="red" />
        <StatCard icon={<FiCalendar />}     label="On Leave"      value={todayStats.on_leave}        color="blue" />
        <StatCard icon={<FiClock />}        label="Half Day"      value={todayStats.half_day}        color="amber" />
        <StatCard icon={<FiAlertTriangle />}label="Late Entries"  value={todayStats.late_entries}    color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {[["mark","Mark Attendance"],["history","Attendance History"],["summary","Monthly Summary"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${tab===id ? "bg-white text-slate-800 shadow-sm" : "text-gray-400 hover:text-slate-600"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ════ MARK ATTENDANCE TAB ════ */}
      {tab === "mark" && (
        <div className="space-y-4">
          {/* Date nav */}
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => shiftDate(-1)} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">
                <FiChevronLeft />
              </button>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button onClick={() => shiftDate(1)} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">
                <FiChevronRight />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={markAllPresent} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all">
                ✓ Mark All Present
              </button>
              <button onClick={() => exportCSV(employees)} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
                <FiDownload size={12} /> Export
              </button>
              <button onClick={saveAttendance} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all shadow-sm disabled:opacity-60">
                {saving ? <FiRefreshCw className="animate-spin" size={12} /> : <FiSave size={12} />}
                Save
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" /></div>
            ) : employees.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-bold">No active employees found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-[#1b7f29] border-b border-[#dce9df]">
                      {["#","Employee","Dept / Shift","Status","Check In","Check Out","Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {employees.map((emp, i) => {
                      const ed = edited[emp.id] || {};
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 font-bold">{i+1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={emp.name} photo={emp.photo} />
                              <div>
                                <p className="font-black text-slate-800">{emp.name}</p>
                                <p className="text-[10px] text-gray-400">ID: {emp.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-600">{emp.department}</p>
                            <p className="text-[10px] text-gray-400">{fmt(emp.shift_start)}–{fmt(emp.shift_end)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <select value={ed.status || "Present"}
                              onChange={e => onChange(emp.id, "status", e.target.value)}
                              className={`text-[10px] font-black px-2 py-1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer ${STATUS_COLOR[ed.status || "Present"]}`}>
                              {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input type="time" value={ed.check_in || ""}
                              onChange={e => onChange(emp.id, "check_in", e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="time" value={ed.check_out || ""}
                              onChange={e => onChange(emp.id, "check_out", e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                          </td>
                          <td className="px-4 py-3">
                            {emp.att_id && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 font-black px-2 py-1 rounded-lg">Saved</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ HISTORY TAB ════ */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500">Month:</label>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={() => exportCSV(history)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all">
              <FiDownload size={12} /> Export CSV
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Employee","Dept","Date","Status","Check In","Check Out","Hrs","OT Hrs","Late"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.length === 0 ? (
                      <tr><td colSpan={9} className="py-16 text-center text-gray-400 font-bold">No records for this month</td></tr>
                    ) : history.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={r.employee_name} photo={r.employee_photo} />
                            <span className="font-bold text-slate-700">{r.employee_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.department}</td>
                        <td className="px-4 py-3 font-bold text-slate-600">{r.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmt(r.check_in)}</td>
                        <td className="px-4 py-3 text-gray-600">{fmt(r.check_out)}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{r.working_hours}h</td>
                        <td className="px-4 py-3 font-bold text-amber-600">{r.overtime_hours}h</td>
                        <td className="px-4 py-3">
                          {r.late_entry ? <span className="text-[10px] bg-red-50 text-red-500 font-black px-2 py-1 rounded-lg">Late</span> : <span className="text-[10px] text-gray-300">—</span>}
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

      {/* ════ SUMMARY TAB ════ */}
      {tab === "summary" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500">Month:</label>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={() => exportCSV(summary)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-all">
              <FiDownload size={12} /> Export CSV
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Employee","Dept","Present","Absent","Half Day","Leave","W/Off","Total Hrs","OT Hrs","Late"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summary.length === 0 ? (
                      <tr><td colSpan={10} className="py-16 text-center text-gray-400 font-bold">No data for this month</td></tr>
                    ) : summary.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-black text-slate-700">{r.name}</td>
                        <td className="px-4 py-3 text-gray-500">{r.department}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{r.present_days}</td>
                        <td className="px-4 py-3 font-bold text-red-500">{r.absent_days}</td>
                        <td className="px-4 py-3 font-bold text-amber-600">{r.half_days}</td>
                        <td className="px-4 py-3 font-bold text-blue-600">{r.leave_days}</td>
                        <td className="px-4 py-3 text-gray-400">{r.weekly_off}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{parseFloat(r.total_working_hours||0).toFixed(1)}h</td>
                        <td className="px-4 py-3 font-bold text-amber-600">{parseFloat(r.total_overtime||0).toFixed(1)}h</td>
                        <td className="px-4 py-3 text-gray-500">{r.late_entries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
