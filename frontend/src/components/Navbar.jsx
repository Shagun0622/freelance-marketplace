import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import CurrencySelector from './CurrencySelector';
import {
    Home, Briefcase, MessageCircle, CreditCard,
    Users, LogOut, Menu, X, Shield, User, Settings, Zap, ChevronDown
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function Navbar() {
    const { user, logout } = useAuth();
    const { unreadCount } = useChat();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isAdmin = user?.role === 'admin';
    const isClient = user?.role === 'client';
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navItems = isAdmin ? [
        { path: '/admin',           icon: Shield,        label: 'Overview'  },
        { path: '/admin/users',     icon: Users,         label: 'Users'     },
        { path: '/admin/gigs',      icon: Briefcase,     label: 'Gigs'      },
        { path: '/admin/payments',  icon: CreditCard,    label: 'Payments'  },
    ] : [
        { path: '/dashboard',                               icon: Home,          label: 'Dashboard' },
        { path: isClient ? '/my-gigs' : '/browse-gigs',    icon: Briefcase,     label: isClient ? 'My Gigs' : 'Browse' },
        { path: '/messages',                                icon: MessageCircle, label: 'Messages', badge: unreadCount },
        { path: isClient ? '/my-payments' : '/my-earnings', icon: CreditCard,   label: 'Payments'  },
    ];

    const handleLogout = () => { logout(); navigate('/login'); };
    const isActive = (path) => location.pathname === path;

    const NavLink = ({ item, onClick }) => (
        <button
            onClick={() => { navigate(item.path); onClick?.(); }}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
                fontFamily: "'DM Sans', sans-serif",
                background: isActive(item.path) ? '#10b98112' : 'transparent',
                color: isActive(item.path) ? '#10b981' : '#64748b',
                border: isActive(item.path) ? '1px solid #10b98120' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; } }}
            onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
        >
            <item.icon size={15} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span>{item.label}</span>
            {item.badge > 0 && (
                <span className="flex items-center justify-center text-white text-[9px] font-bold rounded-full w-4 h-4"
                    style={{ background: '#ef4444', fontFamily: "'DM Sans', sans-serif" }}>
                    {item.badge > 9 ? '9+' : item.badge}
                </span>
            )}
            {isActive(item.path) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ background: '#10b981' }} />
            )}
        </button>
    );

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

            <nav className="sticky top-0 z-40" style={{ background: 'white', borderBottom: '1px solid #f1f5f9', fontFamily: "'DM Sans', sans-serif" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-15" style={{ height: 60 }}>

                        {/* Logo */}
                        <button
                            onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                            className="flex items-center gap-2.5 flex-shrink-0"
                        >
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <Zap size={15} color="white" fill="white" />
                            </div>
                            <span className="text-lg font-bold hidden sm:block" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                                {isAdmin ? 'Admin' : 'Worklance'}
                            </span>
                        </button>

                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-0.5">
                            {navItems.map(item => <NavLink key={item.path} item={item} />)}
                        </div>

                        {/* Right section */}
                        <div className="flex items-center gap-2">
                            {/* 🔥 CURRENCY SELECTOR - ADDED HERE */}
                            <CurrencySelector />

                            <NotificationBell />

                            {/* Messages shortcut (mobile) */}
                            <button
                                onClick={() => navigate('/messages')}
                                className="relative md:hidden p-2 rounded-xl transition-colors"
                                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
                            >
                                <MessageCircle size={16} style={{ color: '#64748b' }} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center text-white text-[9px] font-bold rounded-full w-4 h-4" style={{ background: '#ef4444' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* User dropdown */}
                            <div className="relative hidden md:block" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(o => !o)}
                                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all"
                                    style={{
                                        border: `1px solid ${dropdownOpen ? '#e2e8f0' : 'transparent'}`,
                                        background: dropdownOpen ? '#f8fafc' : 'transparent',
                                    }}
                                    onMouseEnter={e => { if (!dropdownOpen) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; } }}
                                    onMouseLeave={e => { if (!dropdownOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                                >
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                        {initials}
                                    </div>
                                    <div className="hidden lg:block text-left">
                                        <p className="text-sm font-semibold leading-tight" style={{ color: '#1e293b' }}>{user?.name?.split(' ')[0]}</p>
                                        <p className="text-[11px] capitalize leading-tight" style={{ color: '#94a3b8' }}>{user?.role}</p>
                                    </div>
                                    <ChevronDown size={13} style={{ color: '#94a3b8', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                </button>

                                {/* Dropdown */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden z-50"
                                        style={{ background: 'white', border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                                        {/* User info header */}
                                        <div className="px-4 py-3" style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                                    {initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{user?.name}</p>
                                                    <p className="text-xs capitalize" style={{ color: '#94a3b8' }}>{user?.role}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu items */}
                                        <div className="p-1.5 space-y-0.5">
                                            {[
                                                { icon: User, label: 'Profile settings', path: '/profile' },
                                                { icon: Settings, label: 'Account settings', path: '/settings' },
                                            ].map(({ icon: Icon, label, path }) => (
                                                <button key={path} onClick={() => { navigate(path); setDropdownOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
                                                    style={{ color: '#475569' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
                                                    <Icon size={15} /> {label}
                                                </button>
                                            ))}
                                            <div style={{ margin: '4px 0', borderTop: '1px solid #f8fafc' }} />
                                            <button onClick={() => { handleLogout(); setDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
                                                style={{ color: '#ef4444' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                                <LogOut size={15} /> Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="md:hidden p-2 rounded-xl transition-colors"
                                style={{ background: '#f8fafc', border: '1px solid #f1f5f9', color: '#64748b' }}
                            >
                                <Menu size={17} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-72 flex flex-col" style={{ background: 'white' }}>

                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    <Zap size={13} color="white" fill="white" />
                                </div>
                                <span className="font-bold" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>Worklance</span>
                            </div>
                            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg" style={{ color: '#94a3b8' }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* User card */}
                        <div className="px-4 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#f8fafc' }}>
                                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate" style={{ color: '#1e293b' }}>{user?.name}</p>
                                    <p className="text-xs capitalize" style={{ color: '#94a3b8' }}>{user?.role}</p>
                                </div>
                            </div>
                        </div>

                        {/* Nav links */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: '#cbd5e1' }}>Menu</p>
                            {navItems.map(item => <NavLink key={item.path} item={item} onClick={() => setMobileOpen(false)} />)}

                            <div style={{ margin: '12px 0', borderTop: '1px solid #f1f5f9' }} />
                            <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: '#cbd5e1' }}>Account</p>
                            {[
                                { icon: User, label: 'Profile settings', path: '/profile' },
                                { icon: Settings, label: 'Account settings', path: '/settings' },
                            ].map(({ icon: Icon, label, path }) => (
                                <button key={path} onClick={() => { navigate(path); setMobileOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                                    style={{ color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                                    <Icon size={16} /> {label}
                                </button>
                            ))}
                        </div>

                        {/* Sign out */}
                        <div className="p-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                            <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                                <LogOut size={15} /> Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Navbar;