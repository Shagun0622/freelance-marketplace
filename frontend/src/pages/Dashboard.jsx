import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import NotificationBell from '../components/NotificationBell';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import AIRecommendations from '../components/AIRecommendations';
import {
    Menu, X, LayoutDashboard, FolderOpen, MessageCircle, CreditCard,
    Settings, LogOut, CheckCircle, AlertCircle, Briefcase, Send,
    DollarSign, Eye, Users, Sparkles, ArrowRight,
    ChevronRight, Sun, Sunrise, FileText, XCircle, Edit2, Save, Lock
} from 'lucide-react';

function ProfileModal({ profileForm, setProfileForm, onSave, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">Edit Profile</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="space-y-4">
                    {['name', 'phone', 'location'].map(field => (
                        <input key={field} type="text"
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            value={profileForm[field]}
                            onChange={e => setProfileForm(prev => ({ ...prev, [field]: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:border-[#0d9f6f] focus:outline-none" />
                    ))}
                    <input type="email" placeholder="Email" value={profileForm.email} disabled
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
                    <textarea placeholder="Bio" value={profileForm.bio}
                        onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        rows="3" className="w-full px-4 py-2 border rounded-lg focus:border-[#0d9f6f] focus:outline-none" />
                    <button onClick={onSave}
                        className="w-full bg-[#0d9f6f] text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function Sidebar({ tabs, activeTab, onTabClick, unreadCount, user, onSettingsClick, onLogout }) {
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    return (
        <>
            <div className="flex items-center gap-2.5 px-2 mb-10">
                <div className="w-8 h-8 rounded-lg bg-[#0d9f6f] flex items-center justify-center">
                    <Briefcase size={16} color="white" />
                </div>
                <span className="text-lg font-bold text-white">Worklance</span>
            </div>
            <p className="text-[10px] font-semibold text-white/25 px-3 mb-2">MAIN MENU</p>
            <nav className="flex-1 space-y-0.5">
                {tabs.map(({ key, icon: Icon, label }) => (
                    <button key={key} onClick={() => onTabClick(key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-[#0d9f6f]/20 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
                        <Icon size={17} /><span>{label}</span>
                        {key === 'messages' && unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        {activeTab === key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0d9f6f]" />}
                    </button>
                ))}
            </nav>
            <div className="mt-auto">
                <div className="border-t border-white/8 pt-4">
                    <button onClick={onSettingsClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5">
                        <Settings size={17} /><span>Settings</span>
                    </button>
                    <button onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/30 hover:text-red-400 hover:bg-red-400/5">
                        <LogOut size={17} /><span>Sign Out</span>
                    </button>
                </div>
                <div className="mt-4 flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5">
                    <div className="w-8 h-8 rounded-full bg-[#0d9f6f] text-white flex items-center justify-center text-xs font-bold">{initials}</div>
                    <div>
                        <p className="text-sm font-semibold text-white">{user?.name}</p>
                        <p className="text-xs text-white/40 capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>
        </>
    );
}

function ClientPayment({ gigs, token, formatAmount }) {
    const [payments, setPayments] = useState([]);
    const [escrow, setEscrow] = useState(0);

    useEffect(() => {
        const fetchPayments = async () => {
            let esc = 0, pms = [];
            for (const gig of gigs) {
                try {
                    const res = await axios.get(`http://localhost:5000/api/payments/gig/${gig._id}`, { headers: { Authorization: `Bearer ${token}` } });
                    pms = [...pms, ...(res.data.payments || [])];
                    esc += (res.data.payments || []).filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
                } catch (e) {}
            }
            setPayments(pms.slice(0, 3));
            setEscrow(esc);
        };
        fetchPayments();
    }, [gigs, token]);

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Total in Escrow</p>
                        {/* ✅ formatAmount converts to user's currency */}
                        <p className="text-2xl font-bold text-blue-600">{formatAmount(escrow)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Lock size={22} className="text-blue-600" />
                    </div>
                </div>
            </div>
            {payments.length > 0 && (
                <div>
                    {payments.map(p => (
                        <div key={p._id} className="flex justify-between p-3 bg-gray-50 rounded-xl mb-2">
                            <div>
                                <p className="text-sm font-medium">To: {p.freelancerId?.name}</p>
                                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-[#0d9f6f]">{formatAmount(p.amount)}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">In Escrow</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FreelancerPayment({ token, formatAmount }) {
    const [payments, setPayments] = useState([]);
    const [earned, setEarned] = useState(0);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/my-payments', { headers: { Authorization: `Bearer ${token}` } });
                setPayments(res.data.payments || []);
                setEarned(res.data.totalEarned || 0);
            } catch (e) {}
        };
        fetchEarnings();
    }, [token]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Total Earned</p>
                    {/* ✅ formatAmount converts to user's currency */}
                    <p className="text-xl font-bold text-green-600">{formatAmount(earned)}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">
                        {formatAmount(payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.freelancerAmount, 0))}
                    </p>
                </div>
            </div>
            {payments.slice(0, 3).map(p => (
                <div key={p._id} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                        <p className="text-sm font-medium">{p.gigId?.title}</p>
                        <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-[#0d9f6f]">{formatAmount(p.freelancerAmount)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'released' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.status === 'released' ? 'Paid' : 'In Escrow'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Dashboard() {
    const { user, logout, token, updateUser } = useAuth();
    const { formatAmount } = useCurrency();
    const { unreadCount } = useChat();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ activeProjects: 0, proposalsReceived: 0, totalSpent: 0, hiredFreelancers: 0, proposalsSent: 0, totalEarned: 0 });
    const [recentActivity, setRecentActivity] = useState([]);
    const [postedGigs, setPostedGigs] = useState([]);
    const [profileCompleteness, setProfileCompleteness] = useState(0);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', location: '', bio: '' });

    const isClient = user?.role === 'client';
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    useEffect(() => {
        if (user) {
            setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', location: user.location || '', bio: user.bio || '' });
            calcProfile();
        }
    }, [user]);

    useEffect(() => { if (user && token) fetchData(); }, [user, token]);

    const calcProfile = () => {
        let complete = 0;
        if (user?.name) complete += 25;
        if (user?.email) complete += 25;
        if (user?.phone) complete += 20;
        if (user?.location) complete += 15;
        if (user?.bio) complete += 15;
        setProfileCompleteness(complete);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (isClient) {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/gigs/my-gigs', { headers: { Authorization: `Bearer ${token}` } });
                const gigs = data.gigs || [];
                setPostedGigs(gigs);
                const activeGigs = gigs.filter(g => g.status === 'in_progress').length;
                const totalBudget = gigs.reduce((sum, g) => sum + (g.budget?.max || 0), 0);
                let totalProp = 0, hired = 0;
                for (const gig of gigs) {
                    try {
                        const { data: pData } = await axios.get(`http://localhost:5000/api/proposals/gig/${gig._id}`, { headers: { Authorization: `Bearer ${token}` } });
                        totalProp += pData.proposals.length;
                        hired += pData.proposals.filter(p => p.status === 'accepted').length;
                        setRecentActivity(prev => [...prev, ...pData.proposals.slice(0, 2).map(p => ({
                            title: `New proposal on "${p.gigId?.title}"`,
                            time: timeAgo(p.createdAt), color: '#0d9f6f', icon: Send, proposal: p
                        }))]);
                    } catch (e) {}
                }
                setStats({ activeProjects: activeGigs, proposalsReceived: totalProp, totalSpent: totalBudget, hiredFreelancers: hired, proposalsSent: 0, totalEarned: 0 });
            } else {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/proposals/my-proposals', { headers: { Authorization: `Bearer ${token}` } });
                const proposals = data.proposals || [];
                setStats({
                    activeProjects: proposals.filter(p => p.status === 'accepted').length,
                    proposalsReceived: 0, totalSpent: 0, hiredFreelancers: 0,
                    proposalsSent: proposals.length,
                    totalEarned: proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + (p.bidAmount || 0), 0)
                });
                setRecentActivity(proposals.slice(0, 5).map(p => ({
                    title: p.status === 'accepted' ? `Accepted for "${p.gigId?.title}"` : p.status === 'rejected' ? `Rejected for "${p.gigId?.title}"` : `Submitted to "${p.gigId?.title}"`,
                    time: timeAgo(p.createdAt),
                    color: p.status === 'accepted' ? '#0d9f6f' : p.status === 'rejected' ? '#dc2626' : '#f09f27',
                    icon: p.status === 'accepted' ? CheckCircle : p.status === 'rejected' ? XCircle : Send,
                    proposal: p
                })));
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const timeAgo = (date) => {
        const sec = Math.floor((new Date() - new Date(date)) / 1000);
        if (sec < 60) return `${sec} sec ago`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min} min ago`;
        const hrs = Math.floor(min / 60);
        if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
        return `${Math.floor(hrs / 24)} days ago`;
    };

    const handleProfileUpdate = async () => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/update-profile', profileForm, { headers: { Authorization: `Bearer ${token}` } });
            updateUser(res.data.user);
            setShowProfileEdit(false);
            calcProfile();
            alert('Profile updated!');
        } catch (e) { alert('Update failed'); }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good morning', Icon: Sunrise };
        if (hour < 17) return { text: 'Good afternoon', Icon: Sun };
        return { text: 'Good evening', Icon: Sparkles };
    };
    const { text: greetingText, Icon: GreetingIcon } = getGreeting();

    // ✅ formatAmount used for all money values
    const statCards = isClient ? [
        { label: 'Active Projects',    value: stats.activeProjects,          icon: Briefcase,  color: '#0d9f6f', bg: '#0d9f6f15' },
        { label: 'Proposals Received', value: stats.proposalsReceived,        icon: Send,       color: '#0a85a0', bg: '#0a85a015' },
        { label: 'Total Spent',        value: formatAmount(stats.totalSpent), icon: DollarSign, color: '#f09f27', bg: '#f09f2715' },
        { label: 'Hired',              value: stats.hiredFreelancers,         icon: Users,      color: '#8a2be2', bg: '#8a2be215' },
    ] : [
        { label: 'Active Projects', value: stats.activeProjects,           icon: Briefcase,  color: '#0d9f6f', bg: '#0d9f6f15' },
        { label: 'Proposals Sent',  value: stats.proposalsSent,            icon: Send,       color: '#0a85a0', bg: '#0a85a015' },
        { label: 'Total Earned',    value: formatAmount(stats.totalEarned), icon: DollarSign, color: '#f09f27', bg: '#f09f2715' },
        { label: 'Profile Views',   value: Math.floor(Math.random() * 100), icon: Eye,        color: '#8a2be2', bg: '#8a2be215' },
    ];

    const tabs = [
        { key: 'overview', icon: LayoutDashboard, label: 'Overview' },
        { key: 'projects', icon: FolderOpen,      label: isClient ? 'My Gigs' : 'Applications' },
        { key: 'messages', icon: MessageCircle,   label: 'Messages' },
        { key: 'payments', icon: CreditCard,      label: 'Payments' },
    ];

    const handleTabClick = (key) => {
        setActiveTab(key);
        if (key === 'projects') navigate(isClient ? '/my-gigs' : '/my-proposals');
        else if (key === 'messages') navigate('/messages');
        else if (key === 'payments') navigate(isClient ? '/my-payments' : '/my-earnings');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#0d9f6f]" />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className="hidden md:flex md:w-64 flex-col bg-[#1a2332] p-5 min-h-screen sticky top-0 h-screen">
                <Sidebar tabs={tabs} activeTab={activeTab} onTabClick={handleTabClick}
                    unreadCount={unreadCount} user={user}
                    onSettingsClick={() => navigate('/profile')}
                    onLogout={() => { logout(); navigate('/login'); }} />
            </aside>

            <button onClick={() => setMobileMenuOpen(true)} className="fixed top-4 left-4 z-50 md:hidden bg-[#1a2332] text-white p-2.5 rounded-xl">
                <Menu size={19} />
            </button>
            {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileMenuOpen(false)} />}
            <div className={`fixed inset-y-0 left-0 z-50 bg-[#1a2332] p-5 w-72 transform transition-transform md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 text-white/40"><X size={20} /></button>
                <Sidebar tabs={tabs} activeTab={activeTab}
                    onTabClick={(key) => { handleTabClick(key); setMobileMenuOpen(false); }}
                    unreadCount={unreadCount} user={user}
                    onSettingsClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                    onLogout={() => { logout(); navigate('/login'); }} />
            </div>

            <main className="flex-1 pb-12">
                <header className="bg-white border-b px-4 sm:px-6 md:px-8 py-4 sticky top-0 z-30">
                    <div className="flex justify-between">
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#0d9f6f]/10 items-center justify-center">
                                <GreetingIcon size={18} className="text-[#0d9f6f]" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-[#1a2332]">{greetingText}, {user?.name?.split(' ')[0]}</h1>
                                <p className="text-xs text-gray-400 hidden sm:block">Here's what's happening today.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate('/messages')} className="relative w-9 h-9 border rounded-xl flex items-center justify-center hover:bg-gray-50">
                                <MessageCircle size={17} className="text-gray-500" />
                                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4">{unreadCount}</span>}
                            </button>
                            <NotificationBell />
                            <div className="flex items-center gap-2.5 pl-2 border-l">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0d9f6f] to-[#0a7a55] text-white flex items-center justify-center text-sm font-bold">{initials}</div>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-semibold text-[#1a2332]">{user?.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="px-4 sm:px-6 md:px-8 py-6 space-y-5">
                    {/* Stats - all money values use formatAmount */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {statCards.map(stat => (
                            <div key={stat.label} className="bg-white rounded-xl p-4 border shadow-sm">
                                <div className="flex justify-between mb-3">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                                        <stat.icon size={18} style={{ color: stat.color }} />
                                    </div>
                                    <span className="text-[10px] text-gray-400">Total</span>
                                </div>
                                <p className="text-xl font-bold text-[#1a2332]">{stat.value}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Action & Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-[#0d9f6f] to-[#0a85a0]" />
                            <div className="p-5">
                                <h3 className="font-bold mb-2">{isClient ? 'Post a New Project' : 'Find New Work'}</h3>
                                <p className="text-sm text-gray-500 mb-4">{isClient ? 'Describe your project and receive proposals.' : 'Browse projects matching your skills.'}</p>
                                <button onClick={() => navigate(isClient ? '/post-gig' : '/browse-gigs')}
                                    className="w-full bg-[#0d9f6f] text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2">
                                    {isClient ? 'Post New Project' : 'Browse Gigs'} <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border shadow-sm p-5">
                            <div className="flex justify-between mb-4">
                                <h3 className="font-bold">Recent Activity</h3>
                                <button onClick={() => navigate(isClient ? '/my-gigs' : '/my-proposals')} className="text-xs text-[#0d9f6f]">
                                    View all <ChevronRight size={13} className="inline" />
                                </button>
                            </div>
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <FileText size={40} className="mx-auto mb-2 opacity-30" />
                                    <p>No activity yet</p>
                                </div>
                            ) : recentActivity.map((item, i) => (
                                <div key={i}
                                    onClick={() => navigate(isClient && item.proposal?.gigId?._id ? `/gigs/${item.proposal.gigId._id}/proposals` : !isClient && item.proposal?.gigId?._id ? `/gigs/${item.proposal.gigId._id}` : '#')}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                                        <item.icon size={14} style={{ color: item.color }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{item.title}</p>
                                        <p className="text-xs text-gray-400">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Profile */}
                    <div className="bg-white rounded-xl border shadow-sm p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0d9f6f] to-[#0a7a55] text-white flex items-center justify-center text-lg font-bold">{initials}</div>
                                <div>
                                    <p className="font-bold">{user?.name}</p>
                                    <p className="text-sm text-gray-400">{user?.email}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {user?.isVerified
                                            ? <span className="flex items-center gap-1 text-xs font-semibold text-[#0d9f6f] bg-[#0d9f6f]/10 px-2 py-0.5 rounded-md"><CheckCircle size={11} /> Verified</span>
                                            : <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"><AlertCircle size={11} /> Pending</span>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:items-end sm:min-w-[200px]">
                                <div className="w-full">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-gray-400">Profile</span>
                                        <span className="text-sm font-bold text-[#0d9f6f]">{profileCompleteness}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full">
                                        <div className="h-full rounded-full bg-gradient-to-r from-[#0d9f6f] to-[#0a85a0]" style={{ width: `${profileCompleteness}%` }} />
                                    </div>
                                </div>
                                <button onClick={() => navigate('/profile')}
                                    className="text-sm font-semibold text-[#0d9f6f] border border-[#0d9f6f] px-4 py-1.5 rounded-lg hover:bg-[#0d9f6f]/5 flex items-center justify-center gap-1">
                                    <Edit2 size={14} /> {profileCompleteness === 100 ? 'Update' : 'Complete'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payments - formatAmount passed as prop */}
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <CreditCard size={18} className="text-[#0d9f6f]" />
                                <h3 className="font-bold">{isClient ? 'Payment & Escrow' : 'Earnings'}</h3>
                            </div>
                            <button onClick={() => navigate(isClient ? '/my-payments' : '/my-earnings')} className="text-xs text-[#0d9f6f]">
                                View All <ChevronRight size={14} className="inline" />
                            </button>
                        </div>
                        <div className="p-5">
                            {isClient
                                ? <ClientPayment gigs={postedGigs} token={token} formatAmount={formatAmount} />
                                : <FreelancerPayment token={token} formatAmount={formatAmount} />
                            }
                        </div>
                    </div>
                    <AIRecommendations />
                </div>
            </main>

            {showProfileEdit && (
                <ProfileModal profileForm={profileForm} setProfileForm={setProfileForm}
                    onSave={handleProfileUpdate} onClose={() => setShowProfileEdit(false)} />
            )}
        </div>
    );
}

export default Dashboard;