import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import {
    FiSearch,
    FiFilter,
    FiUserPlus,
    FiMail,
    FiPhone,
    FiCalendar,
    FiUserX,
    FiX,
    FiEdit2,
    FiUsers,
    FiShield,
    FiStar,
    FiEye,
    FiClock,
    FiList,
    FiGrid,
    FiRefreshCw
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { normalizeApiData } from "../../utils/normalizeApiData";


const Users = ({ initialTab = "All" }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(initialTab);
    const [selectedRole, setSelectedRole] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const navigate = useNavigate();

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleRoleChange = (value) => {
        setSelectedRole(value);
        setCurrentPage(1);
    };

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
        setCurrentPage(1);
    };

    // ---- Modal State for Registering/Editing User ----
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        name: "",
        email: "",
        phone: "",
        role: "user",
        password: ""
    });
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        const fetchUsersInitial = async () => {
            try {
                const response = await api.get("/auth/users");
                const usersData = normalizeApiData(response.data);
                // Transform data if needed for UI
                const fetchedUsers = usersData.map(u => ({
                    id: u.id || u.user_id,
                    user_id: u.user_id || null,
                    username: u.username || u.name || u.user_id,
                    name: u.username || u.name || u.user_id,
                    email: u.email || "",
                    phone: u.phone || "",
                    role: u.role ? u.role.toLowerCase() : 'user',
                    status: u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1).toLowerCase() : 'Active',
                    joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
                    rawCreated_at: u.created_at,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || u.name || 'User')}&background=random`
                }));
                setUsers(fetchedUsers);
                setLastUpdated(new Date());
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsersInitial();
    }, []);

    // Auto-refresh effect
    useEffect(() => {
        if (!autoRefreshEnabled) return;
        const timer = setInterval(() => {
            fetchUsers();
        }, refreshInterval);
        return () => clearInterval(timer);
    }, [autoRefreshEnabled, refreshInterval]);

    const fetchUsers = async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const response = await api.get("/auth/users");
            const usersData = normalizeApiData(response.data);
            const fetchedUsers = usersData.map(u => ({
                id: u.id || u.user_id,
                user_id: u.user_id || null,
                username: u.username || u.name || u.user_id,
                name: u.username || u.name || u.user_id,
                email: u.email || "",
                phone: u.phone || "",
                role: String(u.role || 'user').toLowerCase(),
                status: String(u.status || 'Active').charAt(0).toUpperCase() + String(u.status || 'Active').slice(1).toLowerCase(),
                joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
                rawCreated_at: u.created_at,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || u.name || 'User')}&background=random`
            }));
            setUsers(fetchedUsers);
            setLastUpdated(new Date());
            if (showLoader) toast.success("Users updated", { duration: 1500 });
        } catch (error) {
            console.error("Failed to fetch users:", error);
            if (showLoader) toast.error("Failed to fetch users");
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveUser = async () => {
        if (!formData.username || !formData.email || !formData.phone) {
            toast.error("Username, email, and phone are required.");
            return;
        }
        if (!isEditing && !formData.password) {
            toast.error("Password is required for new user registration.");
            return;
        }

        setSubmitLoading(true);
        try {
            if (isEditing) {
                await api.put(`/auth/users/${editUserId}`, { ...formData, role: String(formData.role || 'user').toLowerCase() });
                toast.success("User updated successfully!");
            } else {
                await api.post("/auth/register", { ...formData, role: String(formData.role || 'user').toLowerCase() });
                toast.success("User registered successfully!");
            }
            setIsModalOpen(false);
            setFormData({ username: "", name: "", email: "", phone: "", role: "user", password: "" });
            setIsEditing(false);
            setEditUserId(null);
            fetchUsers(true);
        } catch (error) {
            console.error("Operation failed:", error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await api.delete(`/auth/users/${id}`);
            toast.success("User eliminated from system.");
            fetchUsers(true);
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handleQuickRoleUpdate = async (id, newRole, user) => {
        try {
            const payload = {
                username: user.username || user.name,
                name: user.name,
                email: user.email,
                phone: user.phone || ""
            };
            await api.put(`/auth/users/${id}`, { ...payload, role: String(newRole || 'user').toLowerCase() });
            toast.success(`Role updated to ${String(newRole || 'user').toLowerCase()}`);
            fetchUsers(true);
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = String(user?.status || "active").toLowerCase() === "active" ? "inactive" : "active";
            const payload = {
                username: user.username || user.name,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                role: user.role,
                status: newStatus
            };
            await api.put(`/auth/users/${user.id}`, payload);
            toast.success(`User status changed to ${newStatus}`);
            fetchUsers(true);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const openEditModal = (user) => {
        setFormData({
            username: user.username || user.name,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            role: user.role,
            password: "" // Don't show password on edit
        });
        setEditUserId(user.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const getRoleStyle = (role) => {
        const normalizedRole = role ? role.toLowerCase() : "";
        if (normalizedRole.includes("admin")) return "bg-slate-900 text-white shadow-sm";
        if (normalizedRole.includes("manager")) return "bg-indigo-50 text-indigo-600 border border-indigo-100";
        if (normalizedRole.includes("dealer")) return "bg-amber-50 text-amber-600 border border-amber-100";
        return "bg-emerald-50 text-emerald-600 border border-emerald-100"; // User / Customer
    };

    const isToday = (dateString) => {
        if (!dateString || dateString === 'N/A') return false;
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const filteredUsers = users.filter(user => {
        const query = String(searchTerm || "").toLowerCase();
        const matchesSearch =
            String(user?.name || "").toLowerCase().includes(query) ||
            String(user?.email || "").toLowerCase().includes(query) ||
            String(user?.phone || "").toLowerCase().includes(query);

        const matchesTab = selectedTab === "All" || (selectedTab === "New" && isToday(user.rawCreated_at));
        const matchesRole = selectedRole === "all" || String(user?.role || "").toLowerCase() === String(selectedRole || "").toLowerCase();
        return matchesSearch && matchesTab && matchesRole;
    });

    const newUsersCount = users.filter(u => isToday(u.rawCreated_at)).length;

    // Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const indexOfLastItem = safeCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const pageStart = filteredUsers.length === 0 ? 0 : indexOfFirstItem + 1;
    const pageEnd = filteredUsers.length === 0 ? 0 : Math.min(indexOfLastItem, filteredUsers.length);


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                        <FiUsers size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Users</p>
                        <p className="text-2xl font-black text-slate-800">{users.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                        <FiShield size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admins</p>
                        <p className="text-2xl font-black text-slate-800">{users.filter(u => u.role === 'admin').length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                        <FiStar size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dealers</p>
                        <p className="text-2xl font-black text-slate-800">{users.filter(u => u.role === 'dealer').length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                        <FiClock size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Today</p>
                        <p className="text-2xl font-black text-slate-800">{newUsersCount}</p>
                    </div>
                </div>
            </div>

            {/* Header */}
      

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-100 px-2 mt-2">
                <button
                    onClick={() => handleTabChange("All")}
                    className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${selectedTab === "All" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                    All Users
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedTab === "All" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}>
                        {users.length}
                    </span>
                    {selectedTab === "All" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </button>
                <button
                    onClick={() => handleTabChange("New")}
                    className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${selectedTab === "New" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                    New Users
                    {newUsersCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${selectedTab === "New" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"}`}>
                            {newUsersCount}
                        </span>
                    )}
                    {selectedTab === "New" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </button>
            </div>


            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-slate-800">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="relative flex-1 max-w-md">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Find by name or email..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
                            />
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                            Last updated: {lastUpdated.toLocaleTimeString()} {autoRefreshEnabled ? '(Auto-refresh on)' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedRole}
                                onChange={(e) => handleRoleChange(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-bold text-gray-600 cursor-pointer appearance-none min-w-35"
                            >
                                <option value="all">all roles</option>
                                <option value="admin">admin</option>
                                <option value="manager">manager</option>
                                <option value="dealer">dealer</option>
                                <option value="user">user</option>
                            </select>
                        </div>
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold text-gray-600 cursor-pointer"
                        >
                            <option value={10000}>10s</option>
                            <option value={30000}>30s</option>
                            <option value={60000}>1m</option>
                            <option value={300000}>5m</option>
                        </select>
                        <button
                            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                autoRefreshEnabled
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                            title={autoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                        >
                            {autoRefreshEnabled ? '🔄 Auto' : '⏸ Paused'}
                        </button>
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("table")}
                                    className={`p-2 rounded-xl transition-all ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-slate-600"}`}
                                    title="Table view"
                                >
                                    <FiList size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-slate-600"}`}
                                    title="Card view"
                                >
                                    <FiGrid size={16} />
                                </button>
                            </div>
                            <button
                                onClick={() => fetchUsers(true)}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-all"
                                title="Refresh users list"
                            >
                                <FiRefreshCw size={16} /> Refresh
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setFormData({ username: "", name: "", email: "", phone: "", role: "user", password: "" }); setIsModalOpen(true); }}
                                className="flex items-center justify-center gap-2 bg-[#1b7f29] hover:bg-[#166321] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                            >
                                <FiUserPlus /> Add New User
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {viewMode === "table" ? (
                        <table className="w-full text-left border-collapse block md:table">
                        <thead className="hidden md:table-header-group">
                            <tr className="bg-[#1b7f29]">
                                <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-white uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y divide-gray-50 px-3 py-4 md:p-0">
                            {loading ? (
                                <tr className="block md:table-row">
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-bold block md:table-cell">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr className="block md:table-row">
                                    <td colSpan="5" className="px-6 py-12 text-center block md:table-cell">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                                <FiSearch size={24} />
                                            </div>
                                            <p className="text-gray-500 font-medium">No users found</p>
                                            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((user) => (
                                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group block md:table-row bg-white md:bg-transparent border border-gray-100 md:border-0 rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none">
                                        {/* User */}
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">User</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                                                        <img src={user.avatar} alt={user.name} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {user.id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Contact */}
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</span>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                        <FiMail size={11} className="text-gray-400 shrink-0" />
                                                        <span className="truncate max-w-[160px]">{user.email || '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <FiPhone size={11} className="text-gray-400 shrink-0" />
                                                        <span>{user.phone || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role */}
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</span>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleQuickRoleUpdate(user.id, e.target.value, user)}
                                                    className={`appearance-none cursor-pointer px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent outline-none transition-all ${getRoleStyle(user.role)}`}
                                                >
                                                    <option value="admin">admin</option>
                                                    <option value="manager">manager</option>
                                                    <option value="dealer">dealer</option>
                                                    <option value="user">user</option>
                                                </select>
                                            </div>
                                        </td>
                                        {/* Status */}
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                                                <button
                                                    type="button"
                                                    onDoubleClick={() => handleToggleStatus(user)}
                                                    className="flex items-center gap-2 text-left w-full"
                                                    title="Double click to toggle active/inactive"
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 shadow-sm shadow-emerald-300' : 'bg-gray-300'}`} />
                                                    <span className="text-sm font-bold text-slate-700">{user.status}</span>
                                                </button>
                                            </div>
                                        </td>
                                        {/* Joined */}
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell border-b border-gray-50 md:border-b-0">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</span>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <FiCalendar size={12} className="text-gray-400" />
                                                    <span>{user.joined}</span>
                                                    {isToday(user.rawCreated_at) && (
                                                        <span className="ml-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-full">New</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-3 py-4 md:px-6 md:py-4 block md:table-cell text-right">
                                            <div className="flex md:block items-center justify-between w-full">
                                                <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</span>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/users/${user.id}`)}
                                                        className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all"
                                                        title="View User"
                                                    >
                                                        <FiEye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
                                                        title="Edit User"
                                                    >
                                                        <FiEdit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                                                        title="Delete User"
                                                    >
                                                        <FiUserX size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    ) : (
                        <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {currentItems.map((user) => (
                                <div key={user.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 transition-all hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 mt-1">ID: {user.id}</p>
                                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <FiMail size={14} className="text-gray-400 shrink-0" />
                                                    <span className="truncate">{user.email || '—'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FiPhone size={14} className="text-gray-400 shrink-0" />
                                                    <span>{user.phone || '—'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.24em] ${getRoleStyle(user.role)}`}>{user.role}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onDoubleClick={() => handleToggleStatus(user)}
                                                    className="flex items-center gap-2 text-sm font-bold text-slate-700"
                                                    title="Double-click to toggle active/inactive"
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 shadow-sm shadow-emerald-300' : 'bg-gray-300'}`} />
                                                    {user.status}
                                                </button>
                                                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Joined {user.joined}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/users/${user.id}`)}
                                            className="w-full py-2 rounded-2xl border border-gray-200 text-gray-500 hover:bg-blue-500 hover:text-white transition-all"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="w-full py-2 rounded-2xl border border-gray-200 text-gray-500 hover:bg-emerald-500 hover:text-white transition-all"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="w-full py-2 rounded-2xl border border-gray-200 text-gray-500 hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination UI */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Showing {pageStart} to {pageEnd} of {filteredUsers.length} Users
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-400 hover:bg-gray-100"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Modify Domain Privileges' : 'Register New User'}</h2>
                                <p className="text-xs text-gray-500 mt-1">{isEditing ? `Updating permissions for ID: ${editUserId}` : 'Add a new user to your system'}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="e.g. johndoe"
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 234 567 8900"
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Assign Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
                                >
                                    <option value="admin">admin</option>
                                    <option value="manager">manager</option>
                                    <option value="dealer">dealer</option>
                                    <option value="user">user</option>
                                </select>
                            </div>
                            {!isEditing && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter a secure password"
                                        className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={submitLoading || !formData.username || !formData.email || !formData.phone || (!isEditing && !formData.password)}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
                            >
                                {submitLoading ? "Processing..." : isEditing ? "Update Credentials" : "Register User"}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

export default Users;
