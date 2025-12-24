import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, AlertCircle, User, ShieldCheck } from 'lucide-react';
import { API_BASE } from '../api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('customer'); // 'customer' or 'admin'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid email or password');
                }
                throw new Error(data.error || 'Login failed');
            }

            login(data.user, data.token);

            // Debug logging
            console.log('Login successful:', data.user);
            console.log('User role:', data.user.role);

            // Redirect based on role
            if (data.user.role === 'admin') {
                console.log('Redirecting to admin dashboard');
                navigate('/admin-dashboard');
            } else if (data.user.role === 'customer') {
                console.log('Redirecting to customer dashboard');
                navigate('/customer-dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        Welcome Back
                    </h2>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100/50 relative overflow-hidden group">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -tr-y-1/2 -tr-x-1/4 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>

                    {/* User Type Toggle */}
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8 relative z-10">
                        <button
                            type="button"
                            onClick={() => setUserType('customer')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${userType === 'customer'
                                ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <User size={18} />
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType('admin')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${userType === 'admin'
                                ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ShieldCheck size={18} />
                            Admin
                        </button>
                    </div>

                    <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-4 rounded-2xl flex items-center gap-3 animate-shake">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    placeholder="Email address"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <Link to="/forgot-password" weight="bold" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all underline-offset-4">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-4 px-4 bg-slate-900 hover:bg-emerald-600 text-white text-lg font-bold rounded-[1.25rem] shadow-xl shadow-slate-200 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-6 h-6" />
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-50 text-center relative z-10">
                        <p className="text-slate-500 font-medium">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-emerald-600 font-bold hover:text-emerald-700 decoration-2 underline-offset-4 hover:underline">
                                Get Started
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
