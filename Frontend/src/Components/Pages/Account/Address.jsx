import React, { useEffect, useState } from "react";
import { useAuth } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";
import { toast } from "react-hot-toast";
import {
  FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX,
  FiUser, FiMail, FiPhone, FiHome
} from "react-icons/fi";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const emptyForm = (user_id = "") => ({
  user_id,
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  street_address: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  zip_code: "",
  is_default: false
});

export default function Address() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm(user?.user_id));

  const fetchAddresses = async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const res = await api.get(`/addresses/user/${user.user_id}`);
      setAddresses(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyForm(user?.user_id));
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.customer_name.trim()) return toast.error("Name is required");
    if (!form.street_address.trim()) return toast.error("Street address is required");

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, { ...form, user_id: user?.user_id });
        toast.success("Address updated!");
      } else {
        await api.post("/addresses", { ...form, user_id: user?.user_id });
        toast.success("Address added!");
      }
      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address) => {
    setForm({ ...address });
    setEditingId(address.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/set-default`, { user_id: user?.user_id });
      toast.success("Default address updated");
      fetchAddresses();
    } catch {
      toast.error("Failed to set default");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Delivery</p>
            <h2 className="mt-2 text-xl font-black text-slate-800">Saved Addresses</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your delivery locations with ease.</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center justify-center gap-2 rounded-full bg-[#0e6827] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:bg-[#168637]"
          >
            <FiPlus size={16} /> Add New
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-black text-slate-800">
              <FiMapPin className="text-[#0e6827]" />
              {editingId ? "Edit Address" : "New Address"}
            </h3>
            <button onClick={resetForm} className="rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-slate-700">
              <FiX size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="relative">
              <FiUser size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="customer_name" placeholder="Full Name *" value={form.customer_name} onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all text-sm font-bold outline-none"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <FiMail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="customer_email" placeholder="Email" value={form.customer_email} onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all text-sm font-bold outline-none"
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <FiPhone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="customer_phone" placeholder="Phone Number" value={form.customer_phone} onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all text-sm font-bold outline-none"
              />
            </div>

            {/* Street Address - full width */}
            <div className="relative md:col-span-2">
              <FiHome size={14} className="absolute left-4 top-4 text-gray-400" />
              <textarea
                name="street_address" placeholder="Street Address *" value={form.street_address} onChange={handleChange} rows={2}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all text-sm font-bold outline-none resize-none"
              />
            </div>

            {/* City */}
            <input
              name="city" placeholder="City" value={form.city} onChange={handleChange}
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all text-sm font-bold outline-none"
            />

            {/* District */}
            <input
              name="district" placeholder="District" value={form.district} onChange={handleChange}
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all text-sm font-bold outline-none"
            />

            {/* State */}
            <select
              name="state" value={form.state} onChange={handleChange}
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Zip Code */}
            <input
              name="zip_code" placeholder="Zip Code" value={form.zip_code} onChange={handleChange}
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all text-sm font-bold outline-none"
            />

            {/* Country - Read only */}
            <input
              name="country" value={form.country} readOnly
              className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3.5 text-sm font-bold text-slate-400 outline-none"
            />

            {/* Set Default checkbox */}
            <label className="flex items-center gap-3 cursor-pointer md:col-span-2">
              <div
                onClick={() => setForm(p => ({ ...p, is_default: !p.is_default }))}
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${form.is_default ? "border-[#0e6827] bg-[#0e6827]" : "border-gray-300 bg-white"}`}
              >
                {form.is_default && <FiCheck size={12} className="text-white" />}
              </div>
              <span className="text-sm font-bold text-slate-600">Set as default address</span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmit} disabled={submitting}
              className="flex-1 rounded-full bg-[#0e6827] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:bg-[#168637] disabled:opacity-60"
            >
              {submitting ? "Saving..." : editingId ? "Update Address" : "Save Address"}
            </button>
            <button onClick={resetForm} className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-2xl font-black text-sm transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Address Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse space-y-3 rounded-[1.75rem] border border-green-100 bg-white p-6">
              <div className="h-4 bg-gray-100 rounded-full w-1/2" />
              <div className="h-3 bg-gray-100 rounded-full w-3/4" />
              <div className="h-3 bg-gray-100 rounded-full w-1/2" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-green-200 bg-linear-to-br from-green-50 to-white p-12 text-center">
          <FiMapPin size={32} className="text-gray-300 mx-auto mb-4" />
          <p className="font-black text-gray-400 uppercase tracking-widest text-xs">No addresses saved yet</p>
          <p className="text-xs text-gray-400 mt-1">Add a delivery address to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative rounded-[1.75rem] border-2 bg-white p-6 transition-all ${address.is_default ? "border-green-200 shadow-[0_20px_40px_rgba(14,104,39,0.08)]" : "border-gray-100 shadow-sm"}`}
            >
              {address.is_default && (
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-[#0e6827] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                  <FiCheck size={10} /> Default
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50">
                  <FiMapPin className="text-[#0e6827]" size={18} />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm">{address.customer_name}</p>
                  <p className="text-xs text-gray-400 font-bold">{address.customer_phone}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs font-bold text-slate-600 leading-5 bg-gray-50 rounded-xl p-4 mb-4">
                <p>{address.street_address}</p>
                {(address.city || address.district) && (
                  <p>{[address.city, address.district].filter(Boolean).join(", ")}</p>
                )}
                {(address.state || address.zip_code) && (
                  <p>{[address.state, address.zip_code].filter(Boolean).join(" - ")}</p>
                )}
                <p className="text-gray-400">{address.country}</p>
              </div>

              <div className="flex items-center gap-2">
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="flex-1 rounded-xl border border-gray-200 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:border-green-300 hover:bg-green-50 hover:text-[#0e6827]"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:bg-green-50 hover:text-[#0e6827]"
                >
                  <FiEdit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}