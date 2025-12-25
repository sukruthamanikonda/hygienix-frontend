import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import {
    LayoutDashboard,
    ShoppingBag,
    CheckCircle,
    XCircle,
    LogOut,
    Menu,
    X,
    Clock,
    TrendingUp,
    User
} from 'lucide-react';

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('new'); // 'new', 'accepted', 'rejected', 'all'
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/orders/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            } else {
                console.error('Failed to fetch orders:', res.status);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            // Optimistic update
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
        } catch (error) {
            console.error('Update error:', error);
            fetchOrders(); // Refetch on error
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin/login');
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        if (filter === 'new') return order.status === 'pending';
        if (filter === 'accepted') return order.status === 'accepted';
        if (filter === 'rejected') return order.status === 'rejected';
        return true; // 'all'
    });

    // Calculate stats
    const stats = {
        new: orders.filter(o => o.status === 'pending').length,
        accepted: orders.filter(o => o.status === 'accepted').length,
        rejected: orders.filter(o => o.status === 'rejected').length,
        total: orders.length
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-orange-100 text-orange-700',
            accepted: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700'
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-slate-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}>
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-2xl font-bold">Hygienix</h1>
                    <p className="text-slate-400 text-sm">Admin Panel</p>
                </div>

                <nav className="flex-1 p-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${filter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={() => setFilter('new')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${filter === 'new' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <Clock size={20} />
                        <span>New Orders</span>
                        {stats.new > 0 && (
                            <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                {stats.new}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('accepted')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${filter === 'accepted' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <ShoppingBag size={20} />
                        <span>All Orders</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user.name || 'Admin'}!</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{user.name || 'Admin'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <span className="text-3xl font-bold text-slate-900">{stats.new}</span>
                            </div>
                            <h3 className="text-slate-600 font-medium">New Orders</h3>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="text-3xl font-bold text-slate-900">{stats.accepted}</span>
                            </div>
                            <h3 className="text-slate-600 font-medium">Accepted</h3>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <span className="text-3xl font-bold text-slate-900">{stats.rejected}</span>
                            </div>
                            <h3 className="text-slate-600 font-medium">Rejected</h3>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
                            </div>
                            <h3 className="text-slate-600 font-medium">Total Orders</h3>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {filter === 'new' ? 'New Orders' : filter === 'accepted' ? 'Accepted Orders' : filter === 'rejected' ? 'Rejected Orders' : 'All Orders'}
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Order ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Phone</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Service</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Category</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                                                Loading orders...
                                            </td>
                                        </tr>
                                    ) : filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                                                No orders found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900">#{order.id}</td>
                                                <td className="px-6 py-4 text-sm text-slate-900">{order.customer_name || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{order.customer_phone}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {order.items && order.items.length > 0 ? order.items[0].name : 'Deep Cleaning'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {order.items && order.items.length > 0 ? order.items[0].category : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusBadge(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, 'rejected')}
                                                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
