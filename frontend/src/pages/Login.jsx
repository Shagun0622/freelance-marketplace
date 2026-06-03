import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Briefcase, Users, TrendingUp, MessageCircle, Menu, X, Shield } from 'lucide-react';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [tempUserId, setTempUserId] = useState(null);
    const [resendMessage, setResendMessage] = useState('');
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Check for OAuth success in URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');
        
        if (token) {
            // Store token from Google OAuth
            localStorage.setItem('token', token);
            // Fetch user data
            fetchUserData(token);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        if (error) {
            setError('Google login failed. Please try again.');
        }
    }, []);

    const fetchUserData = async (token) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to fetch user data');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const result = await login(email, password);
        
        if (result.success) {
            if (result.requiresTwoFactor) {
                setRequiresTwoFactor(true);
                setTempUserId(result.userId);
                setLoading(false);
            } else if (result.requiresVerification) {
                setRequiresVerification(true);
                setEmail(result.email);
                setLoading(false);
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/2fa/verify-login', {
                userId: tempUserId,
                token: twoFactorCode
            });
            
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                navigate('/dashboard');
            } else {
                setError('Invalid 2FA code');
            }
        } catch (err) {
            setError('Failed to verify 2FA code');
        }
        setLoading(false);
    };

    const handleResendVerification = async () => {
        setResendLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/resend-verification', {
                email: email
            });
            setResendMessage(res.data.message);
            setTimeout(() => setResendMessage(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend verification');
        }
        setResendLoading(false);
    };

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google';
    };

    // 2FA Verification Form
    if (requiresTwoFactor) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Two-Factor Authentication</h2>
                        <p className="text-gray-500 mt-1">Enter the code from your authenticator app</p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}
                    
                    <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-wider focus:outline-none focus:border-[#0d9f6f] mb-4"
                        maxLength={6}
                    />
                    
                    <button
                        onClick={handleVerify2FA}
                        disabled={loading || twoFactorCode.length !== 6}
                        className="w-full bg-[#0d9f6f] text-white py-3 rounded-lg font-semibold hover:bg-[#0a8560] disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    
                    <button
                        onClick={() => {
                            setRequiresTwoFactor(false);
                            setTwoFactorCode('');
                        }}
                        className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Email Verification Required Form
    if (requiresVerification) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                            <Mail size={32} className="text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
                        <p className="text-gray-500 mt-1">
                            We sent a verification link to <strong>{email}</strong>
                        </p>
                    </div>
                    
                    {resendMessage && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">
                            {resendMessage}
                        </div>
                    )}
                    
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}
                    
                    <button
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        className="w-full bg-[#0d9f6f] text-white py-3 rounded-lg font-semibold hover:bg-[#0a8560] disabled:opacity-50 transition-colors"
                    >
                        {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                    
                    <button
                        onClick={() => {
                            setRequiresVerification(false);
                            setEmail('');
                        }}
                        className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
            {/* Left Panel */}
            <div className={`
                fixed inset-0 z-50 bg-gradient-to-br from-[#1a2332] to-[#2d3f55] 
                transform transition-transform duration-300 ease-in-out
                w-80 md:w-[420px] md:relative md:translate-x-0 md:flex md:flex-col
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="absolute top-4 right-4 md:hidden text-white"
                >
                    <X size={24} />
                </button>
                
                <div className="flex flex-col p-6 md:p-10 h-full">
                    <div className="flex items-center gap-2 mb-8 md:mb-12">
                        <Briefcase size={22} color="#0d9f6f" />
                        <span className="text-xl font-bold text-white tracking-tight">Worklance</span>
                    </div>

                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3 md:mb-4 tracking-tight">
                            Where great work<br />gets done.
                        </h1>
                        <p className="text-sm text-white/60 leading-relaxed mb-8 md:mb-10">
                            Connect with world-class talent or find your next opportunity.
                        </p>

                        <div className="flex flex-wrap gap-4 md:gap-6">
                            {[
                                { val: '12K+', label: 'Active Freelancers', Icon: Users },
                                { val: '3.8K+', label: 'Projects Posted', Icon: TrendingUp },
                                { val: '98%', label: 'Satisfaction Rate', Icon: MessageCircle }
                            ].map(({ val, label, Icon }) => (
                                <div key={label} className="flex-1 min-w-[80px]">
                                    <span className="text-xl md:text-2xl font-bold text-[#0d9f6f] block">{val}</span>
                                    <span className="text-[10px] md:text-[11px] text-white/45 uppercase tracking-wide">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden sm:block border-t border-white/10 pt-4 md:pt-6 mt-6 md:mt-8">
                        <p className="text-xs md:text-sm text-white/75 italic mb-2 md:mb-3 leading-relaxed">
                            "Found my best client in under 48 hours."
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#0d9f6f] text-white text-[10px] md:text-xs font-bold flex items-center justify-center">
                                KP
                            </div>
                            <span className="text-[11px] md:text-xs text-white/55">Keanu P. — UI Designer</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
                onClick={() => setMobileMenuOpen(true)}
                className="fixed top-4 left-4 z-40 md:hidden bg-[#0d9f6f] text-white p-2 rounded-lg shadow-lg"
            >
                <Menu size={20} />
            </button>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 mt-12 md:mt-0">
                <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 w-full max-w-md shadow-md border border-gray-100">
                    <div className="mb-5 md:mb-7">
                        <h2 className="text-xl sm:text-2xl font-bold text-[#1a2332] mb-1 tracking-tight">Welcome back</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Sign in to your account</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-700 mb-4 md:mb-5">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-[#1a2332]">Email address</label>
                            <div className="relative flex items-center">
                                <Mail size={14} className="absolute left-3 opacity-45" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full py-2 sm:py-2.5 pl-9 pr-3 border-2 border-gray-200 rounded-lg text-sm text-[#1a2332] bg-gray-50 outline-none focus:border-[#0d9f6f] transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs sm:text-sm font-semibold text-[#1a2332]">Password</label>
                                <Link to="/forgot-password" className="text-[11px] sm:text-xs text-[#0d9f6f] no-underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative flex items-center">
                                <Lock size={14} className="absolute left-3 opacity-45" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full py-2 sm:py-2.5 pl-9 pr-10 border-2 border-gray-200 rounded-lg text-sm text-[#1a2332] bg-gray-50 outline-none focus:border-[#0d9f6f] transition-colors"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 bg-transparent border-none cursor-pointer opacity-50"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 sm:py-3 bg-[#0d9f6f] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all mt-1 md:mt-2 disabled:opacity-70 hover:bg-[#0a8560]"
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <div className="flex items-center gap-2 my-4 md:my-5">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">or continue with</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* OAuth Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-5 md:mb-6">
                        {/* Google Button */}
                        <button 
                            onClick={handleGoogleLogin}
                            className="w-full sm:flex-1 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg text-[11px] sm:text-xs font-medium text-[#1a2332] bg-white cursor-pointer transition-all hover:border-gray-300 flex items-center justify-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                        </button>
                        <button className="w-full sm:flex-1 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg text-[11px] sm:text-xs font-medium text-[#1a2332] bg-white cursor-pointer transition-all hover:border-gray-300 flex items-center justify-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                            GitHub
                        </button>
                        <button className="w-full sm:flex-1 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg text-[11px] sm:text-xs font-medium text-[#1a2332] bg-white cursor-pointer transition-all hover:border-gray-300 flex items-center justify-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077b5">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z"/>
                            </svg>
                            LinkedIn
                        </button>
                    </div>

                    <p className="text-[11px] sm:text-xs text-gray-500 text-center">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#0d9f6f] font-semibold no-underline">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;