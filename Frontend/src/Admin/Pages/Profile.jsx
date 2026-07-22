import React, { useState, useEffect } from "react";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";
import {
    FiMail, FiPhone, FiMapPin, FiShield,
    FiCamera, FiCheck, FiKey, FiLock,
    FiX, FiEdit2, FiUser, FiCalendar, FiLoader
} from "react-icons/fi";

const Profile = () => {
    const { user, login } = useAuth();
    
    const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);

    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");

    const [profileData, setProfileData] = useState({
        username: "", name: "", email: "", phone: "",
        street_address: "", city: "", district: "",
        state: "", country: "India", zip_code: "",
        role: "", created_at: ""
    });

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/auth/profile/${user?.id}`);
            setProfileData({ ...res.data, country: res.data.country || "India" });
        } catch {
            setProfileData({
                username: user?.username || "", name: user?.name || "",
                email: user?.email || "", phone: user?.phone || "",
                street_address: "", city: "", district: "",
                state: "", country: "India", zip_code: "",
                role: user?.role || "", created_at: ""
            });
        } finally { setLoading(false); }
    };

    useEffect(() => { if (user?.id) fetchProfile(); }, [user?.id]);

    const handleProfileUpdate = async () => {
        if (!profileData.username.trim()) { toast.error("Username is required"); return; }
        if (!profileData.email.trim()) { toast.error("Email is required"); return; }
        try {
            setSaving(true);
            const res = await api.put(`/auth/profile/${user?.id}`, profileData);
            const token = localStorage.getItem("token");
            login({ ...user, ...res.data.user }, token);
            toast.success("Profile updated successfully!");
            setIsEditModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally { setSaving(false); }
    };

    const handlePwdChange = async () => {
        if (!currentPwd.trim()) { toast.error("Enter your current password"); return; }
        if (newPwd.length < 6) { toast.error("New password must be at least 6 characters"); return; }
        if (newPwd !== confirmPwd) { toast.error("New passwords do not match"); return; }
        try {
            setChangingPwd(true);
            await api.put(`/auth/profile/${user?.id}/password`, { currentPassword: currentPwd, newPassword: newPwd });
            toast.success("Password changed successfully!");
            setIsPwdModalOpen(false);
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to change password");
        } finally { setChangingPwd(false); }
    };

    const locationDisplay = [profileData.city, profileData.state, profileData.country].filter(Boolean).join(", ") || "Not set";
    const memberSince = profileData.created_at
        ? new Date(profileData.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
        : "—";
    const displayName = profileData.name || profileData.username || "Admin User";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=059669&color=fff&size=200`;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <FiLoader className="text-4xl text-emerald-500 animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
            </div>
        </div>
    );

    const InfoCard = ({ icon, iconBg, iconColor, label, value }) => (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-lg transition-all duration-300 group cursor-default">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`} style={{ backgroundColor: iconBg, color: iconColor }}>
                {React.cloneElement(icon, { className: "text-xl" })}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800 truncate">{value || "—"}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-700">
            <Toaster position="top-right" />
            
            {/* Hero Section */}
            <div className="relative pt-8 pb-32 px-4 md:px-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-300 opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
                
                <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">My Profile</h1>
                        <p className="text-emerald-100 font-medium mt-2">Manage your account settings and preferences</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[120px]">
                            <p className="text-[10px] text-emerald-100 font-black uppercase tracking-widest mb-1">Role</p>
                            <p className="text-white font-bold">{profileData.role || "Admin"}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[120px]">
                            <p className="text-[10px] text-emerald-100 font-black uppercase tracking-widest mb-1">Status</p>
                            <p className="text-emerald-300 font-bold flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-20 relative z-20 space-y-8">
                
                {/* Header Card */}
                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                    <div className="relative group cursor-pointer -mt-16 md:-mt-20">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-2 bg-white shadow-lg shadow-emerald-900/10 relative z-10 transition-transform duration-300 group-hover:scale-105">
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            <div className="absolute inset-2 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                                <FiCamera className="text-white text-2xl" />
                            </div>
                        </div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white z-20 shadow-sm"></div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800">{displayName}</h2>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 mx-auto md:mx-0 w-max">
                                <FiShield /> Verified User
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium mb-6">@{profileData.username} &bull; Joined {memberSince}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-600 font-semibold">
                            <div className="flex items-center gap-2"><FiMail className="text-blue-500" /> {profileData.email || "—"}</div>
                            <div className="flex items-center gap-2"><FiPhone className="text-purple-500" /> {profileData.phone || "Not set"}</div>
                            <div className="flex items-center gap-2"><FiMapPin className="text-rose-500" /> {locationDisplay}</div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-6 md:mt-0">
                        <button onClick={() => setIsEditModalOpen(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-100 hover:border-emerald-500 text-slate-700 hover:text-emerald-600 rounded-2xl font-bold transition-all shadow-sm">
                            <FiEdit2 /> Edit Profile
                        </button>
                        <button onClick={() => setIsPwdModalOpen(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200">
                            <FiLock /> Password
                        </button>
                    </div>
                </div>

                {/* Info Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal & Account */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FiUser className="text-emerald-500 text-sm" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoCard icon={<FiUser />} iconBg="#eff6ff" iconColor="#3b82f6" label="Full Name" value={profileData.name || profileData.username} />
                                <InfoCard icon={<FiMail />} iconBg="#f5f3ff" iconColor="#8b5cf6" label="Email Address" value={profileData.email} />
                                <InfoCard icon={<FiPhone />} iconBg="#fdf4ff" iconColor="#d946ef" label="Phone Number" value={profileData.phone} />
                                <InfoCard icon={<FiShield />} iconBg="#ecfdf5" iconColor="#10b981" label="Account Role" value={profileData.role || "Admin"} />
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-xl text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
                            <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                                <FiShield className="text-emerald-400 text-sm" /> Security Status
                            </h3>
                            <div className="relative z-10 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <FiCheck className="text-2xl" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black mb-1">Account is Secure</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">Your account is protected by 256-bit encryption. We recommend changing your password every 90 days to maintain optimal security.</p>
                                    <button onClick={() => setIsPwdModalOpen(true)} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-2 transition-colors">
                                        Update Password &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address Info */}
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 h-fit">
                        <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <FiMapPin className="text-emerald-500 text-sm" /> Address Details
                        </h3>
                        <div className="space-y-4">
                            <InfoCard icon={<FiMapPin />} iconBg="#fff7ed" iconColor="#f97316" label="Street Address" value={profileData.street_address} />
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard icon={<FiMapPin />} iconBg="#fef2f2" iconColor="#ef4444" label="City" value={profileData.city} />
                                <InfoCard icon={<FiMapPin />} iconBg="#f0fdf4" iconColor="#22c55e" label="District" value={profileData.district} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard icon={<FiMapPin />} iconBg="#eff6ff" iconColor="#3b82f6" label="State" value={profileData.state} />
                                <InfoCard icon={<FiMapPin />} iconBg="#f5f3ff" iconColor="#8b5cf6" label="ZIP Code" value={profileData.zip_code} />
                            </div>
                            <InfoCard icon={<FiMapPin />} iconBg="#f8fafc" iconColor="#64748b" label="Country" value={profileData.country} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><FiEdit2 /></div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg">Edit Profile</h3>
                                    <p className="text-xs text-slate-500 font-medium">Update your personal information</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors shadow-sm"><FiX /></button>
                        </div>
                        
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Basic Info</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Username *</label>
                                            <input type="text" value={profileData.username} onChange={e => setProfileData({ ...profileData, username: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Full Name</label>
                                            <input type="text" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Email Address *</label>
                                            <input type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Phone Number</label>
                                            <input type="text" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Address Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 ml-1">Street Address</label>
                                            <input type="text" value={profileData.street_address} onChange={e => setProfileData({ ...profileData, street_address: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">City</label>
                                            <input type="text" value={profileData.city} onChange={e => setProfileData({ ...profileData, city: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">District</label>
                                            <input type="text" value={profileData.district} onChange={e => setProfileData({ ...profileData, district: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">State</label>
                                            <input type="text" value={profileData.state} onChange={e => setProfileData({ ...profileData, state: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">ZIP Code</label>
                                            <input type="text" value={profileData.zip_code} onChange={e => setProfileData({ ...profileData, zip_code: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-sm text-slate-800" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={handleProfileUpdate} disabled={saving} className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-70">
                                {saving ? <FiLoader className="animate-spin" /> : <FiCheck />} Save Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {isPwdModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsPwdModalOpen(false)}>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><FiLock /></div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg">Change Password</h3>
                                    <p className="text-xs text-slate-500 font-medium">Keep your account secure</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPwdModalOpen(false)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors shadow-sm"><FiX /></button>
                        </div>
                        
                        <div className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Current Password</label>
                                <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Enter current password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-sm text-slate-800" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">New Password</label>
                                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 6 characters" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-sm text-slate-800" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">Confirm New Password</label>
                                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Re-enter new password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-sm text-slate-800" />
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
                            <button onClick={handlePwdChange} disabled={changingPwd} className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70">
                                {changingPwd ? <FiLoader className="animate-spin" /> : <FiKey />} Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
