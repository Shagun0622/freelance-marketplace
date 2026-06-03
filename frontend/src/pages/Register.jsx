import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Briefcase, Code2, Building2, Shield, Zap, Briefcase as BriefcaseIcon, Globe, Menu, X } from 'lucide-react';

function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'client' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await register(formData);
        if (result.success) navigate('/dashboard');
        else setError(result.error);
        setLoading(false);
    };

    const passwordStrength = (pw) => {
        if (!pw) return 0;
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score;
    };
    const strength = passwordStrength(formData.password);
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['', '#e24b4a', '#f09f27', '#1d9e75', '#0d9f6f'];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
            {/* Left Panel - Mobile Drawer */}
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
                    {/* Brand */}
                    <div className="flex items-center gap-2 mb-8 md:mb-12">
                        <Briefcase size={22} color="#0d9f6f" />
                        <span className="text-xl font-bold text-white tracking-tight">Worklance</span>
                    </div>

                    {/* Hero Content */}
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-3 md:mb-4 tracking-tight">
                            Start earning<br />or hiring today.
                        </h1>
                        <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-6 md:mb-8">
                            Join thousands of professionals building their careers and businesses on Worklance.
                        </p>

                        {/* Features - Hide some on mobile */}
                        <div className="hidden sm:flex flex-col gap-2 md:gap-3">
                            {[
                                { icon: Shield, text: 'Secure payments, always protected' },
                                { icon: Zap, text: 'Get matched in minutes, not days' },
                                { icon: BriefcaseIcon, text: 'Build a portfolio that speaks for itself' },
                                { icon: Globe, text: 'Work with clients worldwide' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-2 md:gap-3">
                                    <Icon size={16} color="rgba(255,255,255,0.7)" />
                                    <span className="text-xs md:text-sm text-white/70 leading-relaxed">{text}</span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Mobile features - condensed */}
                        <div className="sm:hidden flex flex-col gap-2">
                            {[
                                { icon: Shield, text: 'Secure payments' },
                                { icon: Zap, text: 'Quick matching' },
                                { icon: Globe, text: 'Work worldwide' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-2">
                                    <Icon size={14} color="rgba(255,255,255,0.7)" />
                                    <span className="text-xs text-white/70">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer - Hide on mobile */}
                    <div className="hidden sm:block border-t border-white/10 pt-4 md:pt-6 mt-6 md:mt-8">
                        <p className="text-[10px] md:text-xs text-white/35 uppercase tracking-wide mb-2">Trusted by professionals at</p>
                        <div className="flex gap-3 md:gap-4 flex-wrap">
                            {['Stripe', 'Notion', 'Linear', 'Vercel'].map(c => (
                                <span key={c} className="text-[11px] md:text-xs font-semibold text-white/45 tracking-wide">{c}</span>
                            ))}
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
                <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-10 w-full max-w-md shadow-md border border-gray-100">
                    {/* Header */}
                    <div className="mb-5 md:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-[#1a2332] mb-1 tracking-tight">Create your account</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Free forever. No credit card required.</p>
                    </div>

                    {/* Role Toggle */}
                    <div className="flex gap-2 bg-gray-100 rounded-xl p-1 mb-5 md:mb-6">
                        {[
                            { value: 'client', icon: Building2, label: 'Hire' },
                            { value: 'freelancer', icon: Code2, label: 'Work' }
                        ].map(({ value, icon: Icon, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFormData({ ...formData, role: value })}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                    formData.role === value
                                        ? 'bg-white text-[#1a2332] font-semibold shadow-sm'
                                        : 'bg-transparent text-gray-400'
                                }`}
                            >
                                <Icon size={14} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-red-700 mb-4 md:mb-5">
                            <AlertCircle size={14} />
                            <span className="flex-1">{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4">
                        {/* Name Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-[#1a2332]">Full name</label>
                            <div className="relative flex items-center">
                                <User size={14} className="absolute left-3 opacity-45" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Jane Smith"
                                    className="w-full py-2 sm:py-2.5 pl-9 pr-3 border-2 border-gray-200 rounded-lg text-sm text-[#1a2332] bg-gray-50 outline-none focus:border-[#0d9f6f] transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-[#1a2332]">Email address</label>
                            <div className="relative flex items-center">
                                <Mail size={14} className="absolute left-3 opacity-45" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full py-2 sm:py-2.5 pl-9 pr-3 border-2 border-gray-200 rounded-lg text-sm text-[#1a2332] bg-gray-50 outline-none focus:border-[#0d9f6f] transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-[#1a2332]">Password</label>
                            <div className="relative flex items-center">
                                <Lock size={14} className="absolute left-3 opacity-45" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 8 characters"
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
                            
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className="flex-1 h-0.5 rounded-full transition-all"
                                                style={{ background: i <= strength ? strengthColors[strength] : '#e2e6ea' }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-semibold min-w-9 text-right" style={{ color: strengthColors[strength] }}>
                                        {strengthLabels[strength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 sm:py-3 bg-[#0d9f6f] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all mt-1 md:mt-2 disabled:opacity-75 hover:bg-[#0a8560]"
                        >
                            {loading ? 'Creating account…' : `Create ${formData.role === 'client' ? 'Client' : 'Freelancer'} Account`}
                        </button>

                        {/* Terms */}
                        <p className="text-[10px] sm:text-xs text-gray-400 text-center -mt-1 leading-relaxed">
                            By signing up, you agree to our{' '}
                            <a href="#" className="text-[#0d9f6f] no-underline font-medium">Terms</a>
                            {' '}and{' '}
                            <a href="#" className="text-[#0d9f6f] no-underline font-medium">Privacy</a>.
                        </p>
                    </form>

                    {/* Login Link */}
                    <p className="text-[11px] sm:text-xs text-gray-500 text-center mt-4 md:mt-5 pt-4 md:pt-5 border-t border-gray-100">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#0d9f6f] font-semibold no-underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;