import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import { FiPrinter, FiDownload, FiArrowLeft, FiCheckCircle } from "react-icons/fi";

/* ─── helpers ─── */
const rupee = v => `₹${parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—";
const monthLabel = m => {
  if (!m) return "—";
  const [y, mo] = m.split("-");
  const months = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[+mo]} ${y}`;
};

/* ════════════════════════════════
   PAYSLIP COMPONENT
════════════════════════════════ */
const Payslip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await api.get(`/salary/payslip/${id}`);
        setData(r.data.data);
      } catch (err) {
        toast.error("Failed to load payslip");
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-24 text-gray-400 font-bold">Payslip not found</div>
  );

  const earnings = [
    ["Basic Salary",         data.basic_salary],
    ["HRA",                  data.hra],
    ["Dearness Allowance",   data.da],
    ["Travel Allowance",     data.travel_allowance],
    ["Medical Allowance",    data.medical_allowance],
    ["Incentive",            data.incentive],
    ["Bonus",                data.bonus],
    ["Overtime",             data.overtime_amount],
    ["Other Allowances",     data.other_allowances],
  ].filter(([, v]) => parseFloat(v || 0) > 0);

  const deductions = [
    ["Provident Fund (PF)",  data.pf],
    ["ESI",                  data.esi],
    ["Professional Tax",     data.professional_tax],
    ["Loan Deduction",       data.loan_deduction],
    ["Advance Salary",       data.advance_salary],
    ["Leave Deduction",      data.leave_deduction],
    ["Other Deductions",     data.other_deductions],
  ].filter(([, v]) => parseFloat(v || 0) > 0);

  const att = data.attendance || {};

  return (
    <>
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #payslip-root, #payslip-root * { visibility: visible !important; }
          #payslip-root { position: absolute; inset: 0; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          @page { margin: 12mm; size: A4 portrait; }
        }
      `}</style>

      {/* ── Screen action bar (hidden on print) ── */}
      <div className="no-print flex items-center justify-between flex-wrap gap-4 mb-6">
        <button onClick={() => navigate("/admin/staff/salary")}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
          <FiArrowLeft size={14} /> Back to Salary
        </button>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-black rounded-xl hover:bg-slate-700 transition-all shadow-sm">
            <FiPrinter size={14} /> Print / Download PDF
          </button>
        </div>
      </div>

      {/* ════ PAYSLIP BODY ════ */}
      <div id="payslip-root" className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-[#042f1a] to-[#0a4731] px-8 py-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-[#59c33f]">P</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">PRIYAM SUPER MARKET</h1>
                <p className="text-xs text-green-300 mt-0.5 font-medium">Employee Salary Slip</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2">
                <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest">Pay Period</p>
                <p className="text-base font-black text-white">{monthLabel(data.salary_month)}</p>
              </div>
            </div>
          </div>

          {/* ── Employee Info ── */}
          <div className="px-8 py-5 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                ["Employee Name",  data.name],
                ["Employee ID",    `EMP-${String(data.emp_db_id || data.employee_id).padStart(4, "0")}`],
                ["Department",     data.department],
                ["Designation",    data.designation || "—"],
                ["Date of Joining",fmtDate(data.joining_date)],
                ["Payment Method", data.payment_method || "—"],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{l}</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Attendance Summary ── */}
          <div className="px-8 py-5 border-b border-gray-100">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Attendance Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                ["Working Days",  data.working_days],
                ["Present Days",  data.present_days || att.present_days || 0],
                ["Leave Days",    data.leave_days || att.leave_days || 0],
                ["Absent Days",   (data.working_days || 26) - (data.present_days || 0) - (data.leave_days || 0)],
                ["Overtime (h)",  parseFloat(data.overtime_hours || att.overtime_hours || 0).toFixed(1)],
                ["Late Entries",  "—"],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{l}</p>
                  <p className="text-lg font-black text-slate-700 mt-1">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Earnings & Deductions ── */}
          <div className="px-8 py-5 border-b border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Earnings */}
              <div>
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Earnings
                </h2>
                <div className="space-y-2">
                  {earnings.length === 0
                    ? <p className="text-xs text-gray-400">No earnings recorded</p>
                    : earnings.map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-gray-500">{l}</span>
                        <span className="font-bold text-slate-700">{rupee(v)}</span>
                      </div>
                    ))}
                  <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between text-sm">
                    <span className="font-black text-slate-800">Gross Salary</span>
                    <span className="font-black text-slate-800">{rupee(data.gross_salary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Deductions
                </h2>
                <div className="space-y-2">
                  {deductions.length === 0
                    ? <p className="text-xs text-gray-400">No deductions</p>
                    : deductions.map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-gray-500">{l}</span>
                        <span className="font-bold text-red-500">{rupee(v)}</span>
                      </div>
                    ))}
                  <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between text-sm">
                    <span className="font-black text-slate-800">Total Deductions</span>
                    <span className="font-black text-red-500">{rupee(data.total_deductions)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Net Salary Banner ── */}
          <div className="px-8 py-6 bg-gradient-to-r from-emerald-600 to-green-500 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100 font-bold uppercase tracking-widest">Net Pay</p>
              <h2 className="text-4xl font-black text-white mt-1">{rupee(data.net_salary)}</h2>
              <p className="text-xs text-emerald-100 mt-1">
                {data.status === "Paid"
                  ? `Paid on ${fmtDate(data.payment_date)} via ${data.payment_method}`
                  : "Payment Pending"}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm ${data.status === "Paid" ? "bg-white/20 text-white" : "bg-amber-400/30 text-amber-100"}`}>
                {data.status === "Paid" && <FiCheckCircle size={14} />}
                {data.status}
              </div>
              {data.payment_reference && (
                <p className="text-[10px] text-emerald-200 mt-1 font-mono">Ref: {data.payment_reference}</p>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-8 py-4 bg-gray-50 flex justify-between items-center text-[10px] text-gray-400">
            <span>Generated on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
            <span>This is a computer-generated payslip and does not require a signature.</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payslip;
