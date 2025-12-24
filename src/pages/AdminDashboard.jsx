import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api';
import {
    LayoutDashboard,
    LogOut,
    ShoppingBag,
    Clock,
    CheckCircle,
    TrendingUp,
    Search,
    RefreshCw,
    XCircle
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 ${color}`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-slate-500 font-medium text-sm">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/orders/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const handleUpdateStatus = async (id, status) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        setRefreshTrigger(prev => prev + 1);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'completed').length,
        revenue: orders.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0)
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Top Bar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-600 p-2 rounded-lg">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                            <p className="text-xs text-slate-500">Hygienix Deep Cleaning</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard title="Total Orders" value={stats.total} icon={ShoppingBag} color="bg-blue-600" />
                    <StatCard title="Pending" value={stats.pending} icon={Clock} color="bg-amber-500" />
                    <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="bg-emerald-500" />
                    <StatCard title="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={TrendingUp} color="bg-indigo-600" />
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Auto-refresh active
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Service</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{order.customer_name || 'Guest'}</div>
                                            <div className="text-xs text-slate-500">{order.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {order.items && order.items.length > 0 ? order.items[0].name : 'Deep Cleaning'}
                                            {order.items && order.items.length > 1 && ` +${order.items.length - 1}`}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">₹{order.total}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize 
                                                ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {order.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdateStatus(order.id, 'completed')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Complete">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Cancel">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
