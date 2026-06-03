import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users, Briefcase, DollarSign, TrendingUp, CheckCircle, XCircle,
    UserCheck, UserX, Trash2, Shield, Menu, X, LayoutDashboard,
    LogOut, CreditCard, Search, Zap, ChevronRight, Eye, Clock
} from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api';

function AdminDashboard() {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({});
    const [users, setUsers] = useState([]);
    const [gigs, setGigs] = useState([]);
    const [payments, setPayments] = useState([]);
    const [userFilter, setUserFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => { 
        if (user && user.role !== 'admin') navigate('/dashboard'); 
    }, [user]);
    
    useEffect(() => { 
        if (user?.role === 'admin') fetchData(); 
    }, [user, activeTab, userFilter, search]);

    const authH = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const r = await axios.get(`${API}/admin/analytics`, authH);
                setAnalytics(r.data.analytics);
            } else if (activeTab === 'users') {
                const r = await axios.get(`${API}/admin/users?role=${userFilter === 'all' ? '' : userFilter}&search=${search}`, authH);
                setUsers(r.data.users);
            } else if (activeTab === 'gigs') {
                const r = await axios.get(`${API}/admin/gigs`, authH);
                setGigs(r.data.gigs);
            } else if (activeTab === 'payments') {
                const r = await axios.get(`${API}/admin/payments`, authH);
                setPayments(r.data.payments);
            }
        } catch (e) { 
            console.error(e);
            if (e.response?.status === 403) navigate('/dashboard');
        }
        setLoading(false);
    };

    const updateUser = async (id, updates) => {
        try { 
            await axios.put(`${API}/admin/users/${id}`, updates, authH); 
            fetchData();
        } catch { 
            alert('Failed to update user'); 
        }
    };

    const deleteGig = async (id) => {
        if (!confirm('Delete this gig?')) return;
        try {
            await axios.delete(`${API}/admin/gigs/${id}`, authH);
            fetchData();
        } catch {
            alert('Failed to delete gig');
        }
    };

    const a = analytics;
    const stats = [
        { label: 'Total Users',   value: a.users?.total || 0,         icon: Users, color: '#10b981' },
        { label: 'Clients',       value: a.users?.clients || 0,        icon: UserCheck, color: '#3b82f6' },
        { label: 'Freelancers',   value: a.users?.freelancers || 0,    icon: Briefcase, color: '#f59e0b' },
        { label: 'Total Gigs',    value: a.gigs?.total || 0,           icon: LayoutDashboard, color: '#8b5cf6' },
        { label: 'Revenue',       value: `$${(a.payments?.platformRevenue?.[0]?.total || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
        { label: 'Open Gigs',     value: a.gigs?.open || 0,            icon: TrendingUp, color: '#ef4444' },
    ];

    const navItems = [
        { key: 'overview',  icon: LayoutDashboard, label: 'Overview'  },
        { key: 'users',     icon: Users,            label: 'Users'     },
        { key: 'gigs',      icon: Briefcase,        label: 'Gigs'      },
        { key: 'payments',  icon: CreditCard,       label: 'Payments'  },
    ];

    const getStatusColor = (status) => {
        switch(status) {
            case 'open': return { bg: '#dbeafe', text: '#2563eb' };
            case 'in_progress': return { bg: '#dcfce7', text: '#059669' };
            case 'completed': return { bg: '#dcfce7', text: '#059669' };
            default: return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    // Sidebar Component
    const Sidebar = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2.5 mb-8 px-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700">
                    <Shield size={16} color="white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Admin Panel</span>
            </div>
            
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 px-2">Menu</p>
            
            <nav className="space-y-1 flex-1">
                {navItems.map(({ key, icon: Icon, label }) => (
                    <button
                        key={key}
                        onClick={() => { setActiveTab(key); setMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            activeTab === key 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                    >
                        <Icon size={16} />
                        <span>{label}</span>
                        {activeTab === key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </button>
                ))}
            </nav>
            
            <div className="pt-4 mt-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                >
                    <LogOut size={16} /> Sign out
                </button>
            </div>
        </div>
    );

    if (loading && activeTab === 'overview') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-900 font-sans">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>

            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex md:w-64 flex-col p-5 min-h-screen sticky top-0 h-screen bg-slate-900 border-r border-slate-800">
                <Sidebar />
            </aside>

            {/* Mobile Menu Button */}
            <button 
                onClick={() => setMenuOpen(true)} 
                className="fixed top-4 left-4 z-50 md:hidden p-2.5 rounded-xl bg-slate-800 text-slate-400 shadow-lg"
            >
                <Menu size={18} />
            </button>

            {/* Mobile Overlay */}
            {menuOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMenuOpen(false)} />
            )}

            {/* Mobile Drawer */}
            <div className={`fixed inset-y-0 left-0 z-50 p-5 w-64 transition-transform md:hidden bg-slate-900 border-r border-slate-800 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-slate-500">
                    <X size={18} />
                </button>
                <Sidebar />
            </div>

            {/* Main Content - No Navbar */}
            <main className="flex-1 min-w-0 bg-slate-100">
                {/* Header - Simple without navbar */}
                <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="ml-10 md:ml-0">
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                                {navItems.find(n => n.key === activeTab)?.label}
                            </h1>
                            <p className="text-xs text-slate-400">Manage platform, users, and gigs</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                {user?.name?.slice(0,2).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-5">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                                                <stat.icon size={16} style={{ color: stat.color }} />
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Analytics Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Proposals Card */}
                                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <TrendingUp size={16} className="text-emerald-600" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800">Proposals Overview</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Total Proposals</span>
                                            <span className="text-sm font-bold text-slate-800">{a.proposals?.total || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Accepted</span>
                                            <span className="text-sm font-bold text-emerald-600">{a.proposals?.accepted || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm text-slate-500">Pending</span>
                                            <span className="text-sm font-bold text-amber-600">{a.proposals?.pending || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Platform Stats Card */}
                                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <Shield size={16} className="text-purple-600" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800">Platform Stats</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">New Users (Month)</span>
                                            <span className="text-sm font-bold text-slate-800">{a.users?.newThisMonth || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Payments (Month)</span>
                                            <span className="text-sm font-bold text-slate-800">{a.payments?.thisMonth || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm text-slate-500">Completion Rate</span>
                                            <span className="text-sm font-bold text-emerald-600">
                                                {a.gigs?.total ? Math.round((a.gigs.completed / a.gigs.total) * 100) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
                                <div className="flex gap-2">
                                    {['all', 'client', 'freelancer'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setUserFilter(f)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                                                userFilter === f 
                                                    ? 'bg-emerald-500 text-white' 
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search users..."
                                        className="pl-9 pr-4 py-1.5 rounded-lg text-sm border border-slate-200 focus:outline-none focus:border-emerald-500 w-64"
                                    />
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                                                            {u.name?.slice(0,2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                                                            <p className="text-xs text-slate-400">{u.email}</p>
                                                        </div>
                                                    </div>
                                                 </td>
                                                <td className="px-5 py-3">
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                                        u.role === 'client' ? 'bg-blue-100 text-blue-700' :
                                                        u.role === 'freelancer' ? 'bg-green-100 text-green-700' :
                                                        'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                 </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex gap-1.5">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${u.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {u.isVerified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                        {u.isSuspended && (
                                                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Suspended</span>
                                                        )}
                                                    </div>
                                                 </td>
                                                <td className="px-5 py-3 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            onClick={() => updateUser(u._id, { isVerified: !u.isVerified })}
                                                            className={`p-1.5 rounded-lg transition-colors ${u.isVerified ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}
                                                            title={u.isVerified ? 'Unverify' : 'Verify'}
                                                        >
                                                            {u.isVerified ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => updateUser(u._id, { isSuspended: !u.isSuspended })}
                                                            className={`p-1.5 rounded-lg transition-colors ${u.isSuspended ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                                                            title={u.isSuspended ? 'Unsuspend' : 'Suspend'}
                                                        >
                                                            {u.isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
                                                        </button>
                                                    </div>
                                                 </td>
                                             </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {users.length === 0 && (
                                    <p className="text-center py-10 text-sm text-slate-400">No users found</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Gigs Tab */}
                    {activeTab === 'gigs' && (
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-800">All Gigs <span className="font-normal text-slate-400 ml-1">({gigs.length})</span></h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {gigs.map(g => {
                                    const statusColor = getStatusColor(g.status);
                                    return (
                                        <div key={g._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Briefcase size={15} className="text-slate-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate text-slate-800">{g.title}</p>
                                                    <p className="text-xs text-slate-400">{g.clientId?.name} · ${g.budget?.min} – ${g.budget?.max}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className="text-xs px-2 py-1 rounded-full" style={{ background: statusColor.bg, color: statusColor.text }}>
                                                    {g.status === 'in_progress' ? 'In Progress' : g.status}
                                                </span>
                                                <button
                                                    onClick={() => deleteGig(g._id)}
                                                    className="p-1.5 rounded-lg bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-200"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {gigs.length === 0 && (
                                    <p className="text-center py-10 text-sm text-slate-400">No gigs found</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-800">Transactions <span className="font-normal text-slate-400 ml-1">({payments.length})</span></h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {['Gig', 'Client', 'Freelancer', 'Amount', 'Status'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p._id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 text-sm font-medium text-slate-800">{p.gigId?.title || 'N/A'}</td>
                                                <td className="px-5 py-3 text-sm text-slate-500">{p.clientId?.name || 'N/A'}</td>
                                                <td className="px-5 py-3 text-sm text-slate-500">{p.freelancerId?.name || 'N/A'}</td>
                                                <td className="px-5 py-3 text-sm font-bold text-slate-800">${p.amount}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        p.status === 'released' ? 'bg-green-100 text-green-700' :
                                                        p.status === 'completed' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {p.status === 'released' ? 'Paid' : 
                                                         p.status === 'completed' ? 'In Escrow' : p.status}
                                                    </span>
                                                </td>
                                             </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {payments.length === 0 && (
                                    <p className="text-center py-10 text-sm text-slate-400">No transactions yet</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;