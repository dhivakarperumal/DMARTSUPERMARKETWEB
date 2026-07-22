import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { 
  FiChevronLeft, FiMail, FiPhone, FiCalendar, 
  FiShoppingBag, FiUser, FiActivity, FiMapPin,
  FiBox, FiDollarSign
} from "react-icons/fi";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      setLoading(true);
      try {
        const resp = await api.get("/auth/users");
        const users = resp.data || [];
        const found = users.find(u => String(u.id) === String(id) || String(u.user_id) === String(id));
        
        if (!found) {
          setUser(null);
          setOrders([]);
          setLoading(false);
          return;
        }
        setUser(found);

        const userId = found.user_id || found.user_id || null;
        if (userId) {
          try {
            const ordersResp = await api.get(`/orders/user/${userId}`);
            setOrders(ordersResp.data || []);
          } catch (err) {
            console.error("Failed to fetch user orders:", err);
            setOrders([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-400">Loading User Profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 min-h-screen bg-slate-50">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors">
          <FiChevronLeft size={20} /> Back to Directory
        </button>
        <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto mt-20">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiUser size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">User Not Found</h2>
          <p className="text-sm text-gray-500 font-medium">The user you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Calculate Order Stats
  const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || o.total || o.amount || 0), 0);
  const activeOrders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('paid')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s.includes('cancel')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('transit') || s.includes('ship')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 space-y-8 pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-sm font-bold text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-md rounded-xl transition-all">
          <FiChevronLeft size={18} /> Back to Users
        </button>
        <div className="flex gap-3">
            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {user.status || 'Active'}
            </span>
            <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-200">
                {user.role || 'Customer'}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="xl:col-span-1 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden relative">
            {/* Banner Background */}
            <div className="h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 w-full absolute top-0 left-0"></div>
            
            <div className="relative pt-16 px-8 pb-8 text-center mt-2">
              <div className="w-28 h-28 mx-auto bg-white p-2 rounded-full shadow-lg relative mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.name || 'User')}&background=random&size=150`} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div className={`absolute bottom-2 right-2 w-5 h-5 border-4 border-white rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
              </div>
              
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">{user.username || user.name}</h1>
              <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">UID: {user.user_id || user.id}</p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-500 shadow-sm"><FiMail size={18} /></div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{user.email || 'Not Provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-500 shadow-sm"><FiPhone size={18} /></div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-bold text-slate-700">{user.phone || 'Not Provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-500 shadow-sm"><FiCalendar size={18} /></div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined On</p>
                    <p className="text-sm font-bold text-slate-700">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Orders */}
        <div className="xl:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500"><FiShoppingBag size={80} /></div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><FiShoppingBag size={24} /></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Orders</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{orders.length}</h3>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500"><FiDollarSign size={80} /></div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><FiDollarSign size={24} /></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Spent</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">₹{totalSpent.toFixed(2)}</h3>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500"><FiActivity size={80} /></div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><FiActivity size={24} /></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Orders</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{activeOrders}</h3>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><FiBox size={16} /></div>
                Order History
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">{orders.length} Records</span>
            </div>
            
            <div className="overflow-x-auto flex-1 p-2 custom-scrollbar">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                  <FiBox size={48} className="text-gray-300 mb-4" />
                  <p className="text-sm font-bold text-gray-500">No orders found</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">This user hasn't placed any orders yet</p>
                </div>
              ) : (
                <table className="w-full text-left border-spacing-y-2 border-separate px-4">
                  <thead>
                    <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest bg-white">
                      <th className="py-3 px-4 font-black">Order ID</th>
                      <th className="py-3 px-4 font-black">Date</th>
                      <th className="py-3 px-4 font-black">Status</th>
                      <th className="py-3 px-4 font-black">Total</th>
                      <th className="py-3 px-4 text-right font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id || o.order_id} className="bg-gray-50/50 hover:bg-blue-50/50 transition-colors group rounded-2xl">
                        <td className="py-4 px-4 rounded-l-2xl">
                          <p className="text-sm font-bold text-slate-800">#{o.order_id || o.id}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{o.order_type || 'Shop'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-bold text-slate-600">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(o.status)}`}>
                            {o.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-black text-slate-800">₹{parseFloat(o.total_amount || o.total || o.amount || 0).toFixed(2)}</p>
                        </td>
                        <td className="py-4 px-4 text-right rounded-r-2xl">
                          <button onClick={() => navigate(`/admin/orders/${o.id || o.order_id}`)} className="px-4 py-2 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 rounded-xl text-xs font-bold text-gray-600 transition-all shadow-sm">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
