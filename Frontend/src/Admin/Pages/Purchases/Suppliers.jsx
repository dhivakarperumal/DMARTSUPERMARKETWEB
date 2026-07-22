import React, { useState, useEffect } from "react";
import api from "../../../api";
import { FiUsers, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiCheck, FiBook, FiDownload, FiChevronDown } from "react-icons/fi";
import { toast } from "react-hot-toast";

const EMPTY_FORM = {
  supplier_name: "", company_name: "", contact_person: "", mobile: "", alt_mobile: "",
  email: "", gst_number: "", pan_number: "", address: "", city: "", state: "",
  country: "India", pincode: "", bank_name: "", account_number: "", ifsc_code: "",
  upi_id: "", payment_terms: "", credit_days: "", credit_limit: "", opening_balance: "", status: "Active"
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [ledgerSupplier, setLedgerSupplier] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("purchases");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/purchases/suppliers");
      if (res.data.success) setSuppliers(res.data.suppliers);
    } catch { toast.error("Failed to load suppliers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAdd = () => { setEditId(null); setFormData(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (s) => { setEditId(s.id); setFormData({ ...EMPTY_FORM, ...s }); setIsModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_name) return toast.error("Supplier name is required");
    try {
      if (editId) {
        await api.put(`/purchases/suppliers/${editId}`, formData);
        toast.success("Supplier updated!");
      } else {
        await api.post("/purchases/suppliers", formData);
        toast.success("Supplier added!");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || "Error saving supplier"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/purchases/suppliers/${id}`);
      toast.success("Supplier deleted");
      setDeleteConfirm(null);
      fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || "Cannot delete supplier"); }
  };

  const openLedger = async (supplier) => {
    setLedgerSupplier(supplier);
    setIsLedgerOpen(true);
    setLedgerLoading(true);
    setActiveTab("purchases");
    try {
      const res = await api.get(`/purchases/suppliers/${supplier.id}`);
      if (res.data.success) setLedgerData(res.data.ledger);
    } catch { toast.error("Failed to load ledger"); }
    finally { setLedgerLoading(false); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/purchases/suppliers/export/excel", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'suppliers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { toast.error("Export failed"); }
  };

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.supplier_name?.toLowerCase().includes(q) || s.mobile?.includes(q) || s.supplier_code?.toLowerCase().includes(q) || s.gst_number?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const InputField = ({ label, name, type = "text", required, placeholder }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} name={name} value={formData[name] || ""} onChange={handleChange} required={required} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all" />
    </div>
  );

  const SelectField = ({ label, name, options }) => (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <select name={name} value={formData[name] || ""} onChange={handleChange}
        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none transition-all">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiUsers size={20} className="text-white" />
            </div>
            Supplier Management
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">
            {suppliers.length} suppliers • {suppliers.filter(s=>s.status==='Active').length} active
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
            <FiDownload size={15} /> Export
          </button>
          <button onClick={openAdd} className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
            <FiPlus size={18} /> Add Supplier
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search by name, code, mobile, GST..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm" />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Inactive"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <FiUsers size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-500">No Suppliers Found</p>
            <p className="text-xs font-bold text-gray-400 mt-1">Add a supplier to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <th className="py-4 px-5">Supplier</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">GST / PAN</th>
                  <th className="py-4 px-4">Credit Limit</th>
                  <th className="py-4 px-4">Outstanding</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sup => (
                  <tr key={sup.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-4 px-5">
                      <p className="text-sm font-bold text-slate-800">{sup.supplier_name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                        {sup.supplier_code} • {sup.company_name || '—'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-bold text-slate-700">{sup.mobile || '—'}</p>
                      <p className="text-[10px] text-gray-400">{sup.email || '—'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-mono text-slate-600">{sup.gst_number || '—'}</p>
                      <p className="text-[10px] font-mono text-gray-400">{sup.pan_number || '—'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-bold text-slate-700">{fmt(sup.credit_limit)}</p>
                      <p className="text-[10px] text-gray-400">{sup.credit_days || 0} days</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className={`text-sm font-black ${parseFloat(sup.outstanding_balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {fmt(sup.outstanding_balance)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${sup.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {sup.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openLedger(sup)} className="p-2 bg-white rounded-lg border border-gray-200 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm" title="Ledger">
                          <FiBook size={14} />
                        </button>
                        <button onClick={() => openEdit(sup)} className="p-2 bg-white rounded-lg border border-gray-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm" title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(sup)} className="p-2 bg-white rounded-lg border border-gray-200 text-red-500 hover:border-red-300 hover:bg-red-50 transition-all shadow-sm" title="Delete">
                          <FiTrash2 size={14} />
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

      {/* ─── Add/Edit Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl flex-shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FiUsers className="text-indigo-500" /> {editId ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <FiX size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="supplier-form" onSubmit={handleSubmit} className="space-y-8">

                {/* Basic Info */}
                <div>
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Basic Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InputField label="Supplier Name" name="supplier_name" required />
                    <InputField label="Company Name" name="company_name" />
                    <InputField label="Contact Person" name="contact_person" />
                    <InputField label="Mobile" name="mobile" type="tel" />
                    <InputField label="Alt Mobile" name="alt_mobile" type="tel" />
                    <InputField label="Email" name="email" type="email" />
                  </div>
                </div>

                {/* Tax & Legal */}
                <div>
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Tax & Legal</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InputField label="GST Number" name="gst_number" />
                    <InputField label="PAN Number" name="pan_number" />
                    <SelectField label="Status" name="status" options={["Active","Inactive"]} />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Address</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2 md:col-span-3 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</label>
                      <textarea name="address" rows={2} value={formData.address || ""} onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none resize-none transition-all" />
                    </div>
                    <InputField label="City" name="city" />
                    <InputField label="State" name="state" />
                    <InputField label="Country" name="country" />
                    <InputField label="Pincode" name="pincode" />
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Bank Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputField label="Bank Name" name="bank_name" />
                    <InputField label="Account Number" name="account_number" />
                    <InputField label="IFSC Code" name="ifsc_code" />
                    <InputField label="UPI ID" name="upi_id" />
                  </div>
                </div>

                {/* Credit Terms */}
                <div>
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Credit & Payment Terms</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputField label="Payment Terms" name="payment_terms" placeholder="e.g. Net 30" />
                    <InputField label="Credit Days" name="credit_days" type="number" />
                    <InputField label="Credit Limit (₹)" name="credit_limit" type="number" />
                    <InputField label="Opening Balance (₹)" name="opening_balance" type="number" />
                  </div>
                </div>

              </form>
            </div>
            <div className="p-5 border-t border-gray-100 bg-white rounded-b-3xl flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" form="supplier-form" className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all">
                <FiCheck size={16} /> {editId ? "Save Changes" : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Ledger Modal ─── */}
      {isLedgerOpen && ledgerSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-3xl flex justify-between items-start flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800">{ledgerSupplier.supplier_name}</h2>
                <p className="text-xs text-gray-400 font-bold mt-0.5">{ledgerSupplier.supplier_code} • Outstanding: <span className="text-red-600">{fmt(ledgerSupplier.outstanding_balance)}</span></p>
              </div>
              <button onClick={() => { setIsLedgerOpen(false); setLedgerData(null); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <FiX size={20} />
              </button>
            </div>
            <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
              {["purchases","payments","returns"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab===tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {ledgerLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : !ledgerData ? (
                <p className="text-sm text-gray-400 text-center py-10">No data found.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50">
                    <tr>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      {activeTab==='purchases' && <th className="py-3 px-4">Status</th>}
                      <th className="py-3 px-4 text-right">{activeTab==='purchases' ? 'Amount (Dr)' : 'Amount (Cr)'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ledgerData[activeTab] || []).length === 0 ? (
                      <tr><td colSpan="5" className="py-10 text-center text-sm text-gray-400">No {activeTab} found</td></tr>
                    ) : (ledgerData[activeTab] || []).map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-xs font-bold text-slate-700">{row.ref || '—'}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black uppercase">{row.type}</span></td>
                        {activeTab==='purchases' && <td className="py-3 px-4 text-[10px] font-black text-gray-500 uppercase">{row.status}</td>}
                        <td className="py-3 px-4 text-right text-sm font-black text-slate-800">{fmt(row.debit || row.credit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Delete Supplier?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.supplier_name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
