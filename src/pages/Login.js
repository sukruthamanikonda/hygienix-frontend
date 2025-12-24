import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api';
import {
    Phone,
    Lock,
    Loader2,
    AlertCircle,
    ShieldCheck,
    User
} from 'lucide-react';

const Login = () => {
    const [userType, setUserType] = useState('admin'); // 'customer' or 'admin'
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            if (!res.ok) throw new Error('Failed to send OTP. Try again.');

            setStep('otp');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/login-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            login(data.user, data.token);

            // Redirect Logic
            if (data.user.role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/customer-dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 py-12 px-4 animate-fade-in">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hygienix Login</h2>
                    <p className="text-slate-500 mt-2">Enter your phone number to continue</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    {/* User Type Toggle */}
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8">
                        <button
                            type="button"
                            onClick={() => { setUserType('customer'); setStep('phone'); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${userType === 'customer'
                                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <User size={18} /> Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUserType('admin'); setStep('phone'); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${userType === 'admin'
                                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ShieldCheck size={18} /> Admin
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {step === 'phone' ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    placeholder="Phone Number (e.g., 9999999999)"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || phone.length < 10}
                                className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white text-lg font-bold rounded-[1.25rem] shadow-lg shadow-slate-200 transition-all disabled:opacity-70 flex justify-center items-center"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="text-center mb-4">
                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                                    OTP sent to {phone}
                                </span>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    placeholder="Enter OTP (Use 123456)"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-[1.25rem] shadow-lg shadow-emerald-200 transition-all disabled:opacity-70 flex justify-center items-center"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Login'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="w-full text-sm font-bold text-slate-500 hover:text-slate-800"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
