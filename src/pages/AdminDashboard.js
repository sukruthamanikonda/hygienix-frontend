import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Users, ShoppingBag, Clock, CheckCircle,
    Search, Filter, ChevronRight, Loader2,
    TrendingUp, AlertCircle, MapPin, Phone
} from 'lucide-react';
import { API_BASE } from '../api';

const AdminDashboard = () => {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchOrders();
    }, [token]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE}/orders/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
            setOrders(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: 'Total Bookings', value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pending Slots', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Revenue', value: `₹${orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_phone?.includes(searchTerm) ||
            order.id?.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            <p className="text-gray-500 font-medium">Loading Management Console...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Command Center</h1>
                    <p className="text-gray-500 mt-1">Real-time overview of all service bookings</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchOrders}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-bold">{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by ID, Customer or Phone..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-gray-600"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">ID</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Service Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Schedule</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6 font-bold text-emerald-600">#{order.id}</td>
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-gray-900">{order.customer_name || 'Anonymous'}</div>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                            <Phone className="w-3 h-3" /> {order.customer_phone || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-medium text-gray-700">
                                            {order.items?.[0]?.serviceName || order.items?.[0]?.service || 'Cleaning Service'}
                                        </div>
                                        <div className="flex items-start gap-1 text-sm text-gray-500 mt-1 max-w-xs truncate">
                                            <MapPin className="w-3 h-3 mt-1 shrink-0" /> {order.address || 'Address not specified'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-gray-800">
                                            {order.service_date ? new Date(order.service_date).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-400 font-medium uppercase mt-1">{order.items?.[0]?.timeSlot || 'Standard Slot'}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {order.status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-lg font-extrabold text-gray-900">₹{order.total || 0}</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle className="w-12 h-12 text-gray-200" />
                                            <p className="text-gray-400 font-medium">No orders found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
