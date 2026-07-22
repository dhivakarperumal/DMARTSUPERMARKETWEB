import React, { useState, useEffect } from "react";
import {
    FiTrendingUp,
    FiDollarSign,
    FiBox,
    FiUsers,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiBarChart2,
    FiDownload,
    FiFilter,
} from "react-icons/fi";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "react-hot-toast";

const DealerDashboard = () => {
    const [timeRange, setTimeRange] = useState("monthly");
    const [loading, setLoading] = useState(false);

    // Mock data for statistics
    const stats = [
        { label: "Total Dealers", value: "1,248", change: "+12.5%", icon: FiUsers, color: "bg-blue-600", lightBg: "bg-blue-50" },
        { label: "Active Dealers", value: "1,089", change: "+8.2%", icon: FiCheckCircle, color: "bg-emerald-600", lightBg: "bg-emerald-50" },
        { label: "Inactive Dealers", value: "159", change: "-3.1%", icon: FiAlertCircle, color: "bg-red-600", lightBg: "bg-red-50" },
        { label: "Total Purchase Amount", value: "₹45.2L", change: "+24.3%", icon: FiDollarSign, color: "bg-amber-600", lightBg: "bg-amber-50" },
        { label: "Pending Payments", value: "₹8.5L", change: "-5.2%", icon: FiClock, color: "bg-orange-600", lightBg: "bg-orange-50" },
        { label: "Today's Orders", value: "342", change: "+15.8%", icon: FiBox, color: "bg-purple-600", lightBg: "bg-purple-50" },
        { label: "Delivered Orders", value: "28,456", change: "+31.2%", icon: FiCheckCircle, color: "bg-green-600", lightBg: "bg-green-50" },
        { label: "This Month Revenue", value: "₹32.8L", change: "+18.5%", icon: FiTrendingUp, color: "bg-cyan-600", lightBg: "bg-cyan-50" },
    ];

    // Monthly purchase analytics data
    const monthlyData = [
        { month: "Jan", purchases: 65000, payments: 55000, orders: 120 },
        { month: "Feb", purchases: 78000, payments: 62000, orders: 145 },
        { month: "Mar", purchases: 89000, payments: 75000, orders: 168 },
        { month: "Apr", purchases: 92000, payments: 85000, orders: 182 },
        { month: "May", purchases: 108000, payments: 98000, orders: 210 },
        { month: "Jun", purchases: 125000, payments: 112000, orders: 245 },
    ];

    // Purchase vs Payment comparison
    const comparisonData = [
        { name: "Dealer A", purchase: 120000, payment: 110000, pending: 10000 },
        { name: "Dealer B", purchase: 95000, payment: 85000, pending: 10000 },
        { name: "Dealer C", purchase: 110000, payment: 98000, pending: 12000 },
        { name: "Dealer D", purchase: 88000, payment: 88000, pending: 0 },
        { name: "Dealer E", purchase: 105000, payment: 92000, pending: 13000 },
    ];

    // Payment status breakdown
    const paymentBreakdown = [
        { name: "Paid", value: 68, fill: "#16A34A" },
        { name: "Pending", value: 22, fill: "#F97316" },
        { name: "Overdue", value: 10, fill: "#DC2626" },
    ];

    // Recent activities
    const recentActivities = [
        { id: 1, type: "order", dealer: "ABC Supply Co.", amount: "₹45,000", status: "Completed", time: "2 hours ago" },
        { id: 2, type: "payment", dealer: "XYZ Distribution", amount: "₹32,500", status: "Received", time: "4 hours ago" },
        { id: 3, type: "return", dealer: "Global Traders", amount: "₹8,200", status: "Processed", time: "1 day ago" },
        { id: 4, type: "order", dealer: "Premium Dealers", amount: "₹78,900", status: "Pending", time: "1 day ago" },
        { id: 5, type: "payment", dealer: "Metro Supplies", amount: "₹15,600", status: "Received", time: "2 days ago" },
    ];

    const getActivityIcon = (type) => {
        switch (type) {
            case "order":
                return <FiBox className="w-5 h-5" />;
            case "payment":
                return <FiDollarSign className="w-5 h-5" />;
            case "return":
                return <FiAlertCircle className="w-5 h-5" />;
            default:
                return <FiCheckCircle className="w-5 h-5" />;
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case "order":
                return "text-blue-600 bg-blue-50";
            case "payment":
                return "text-green-600 bg-green-50";
            case "return":
                return "text-amber-600 bg-amber-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800">Dealer Dashboard</h1>
                    <p className="text-sm text-gray-500 font-bold mt-2">Comprehensive Dealer Management & Analytics</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                    <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                        <FiFilter size={16} /> Filter
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-100">
                        <FiDownload size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-14 h-14 ${stat.lightBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                                </div>
                                <span className={`text-xs font-black ${stat.change.includes('-') ? 'text-red-600' : 'text-green-600'} tracking-wider`}>
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-bold mb-1">{stat.label}</p>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-800">{stat.value}</h3>
                        </div>
                    );
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Purchase Analytics */}
                <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <FiTrendingUp className="text-blue-600" size={20} />
                                Monthly Purchase Analytics
                            </h3>
                            <p className="text-xs text-gray-400 font-bold mt-1 tracking-wider">Purchase & Payment Trend</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                <span className="text-xs font-bold text-gray-600">Purchases</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                                <span className="text-xs font-bold text-gray-600">Payments</span>
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="purchases"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ fill: "#2563eb", r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="payments"
                                stroke="#16a34a"
                                strokeWidth={3}
                                dot={{ fill: "#16a34a", r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Payment Status Breakdown */}
                <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <FiBarChart2 className="text-amber-600" size={20} />
                            Payment Status
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1 tracking-wider">Distribution Overview</p>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={paymentBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {paymentBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-6 space-y-2">
                        {paymentBreakdown.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                    <span className="text-sm font-bold text-gray-700">{item.name}</span>
                                </div>
                                <span className="font-black text-slate-800">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Purchase vs Payment Comparison */}
            <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <FiBarChart2 className="text-purple-600" size={20} />
                            Dealer-wise Purchase vs Payment
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1 tracking-wider">Top Dealers Performance Comparison</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                            <span className="text-xs font-bold text-gray-600">Purchase</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                            <span className="text-xs font-bold text-gray-600">Payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-600"></div>
                            <span className="text-xs font-bold text-gray-600">Pending</span>
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                        />
                        <Legend />
                        <Bar dataKey="purchase" fill="#2563eb" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="payment" fill="#16a34a" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="pending" fill="#dc2626" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 mb-8">Recent Activities</h3>
                <div className="space-y-4">
                    {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getActivityColor(activity.type)}`}>
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">{activity.dealer}</p>
                                <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-800">{activity.amount}</p>
                                <p className={`text-xs font-bold ${activity.status === 'Completed' || activity.status === 'Received' || activity.status === 'Processed' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {activity.status}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DealerDashboard;
