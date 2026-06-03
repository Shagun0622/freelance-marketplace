import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Shield, AlertCircle, CheckCircle, Clock, XCircle,
    Plus, ChevronRight, Loader, MessageCircle
} from 'lucide-react';

const statusConfig = {
    open:                { label: 'Open',               color: '#f09f27', bg: '#f09f2715', icon: Clock },
    under_review:        { label: 'Under Review',       color: '#0a85a0', bg: '#0a85a015', icon: Loader },
    resolved_client:     { label: 'Resolved for Client',     color: '#0d9f6f', bg: '#0d9f6f15', icon: CheckCircle },
    resolved_freelancer: { label: 'Resolved for Freelancer', color: '#0d9f6f', bg: '#0d9f6f15', icon: CheckCircle },
    closed:              { label: 'Closed',             color: '#9ca3af', bg: '#9ca3af15', icon: XCircle },
};

function DisputeCenter() {
    const { token } = useAuth();
    const { formatAmount } = useCurrency();
    const navigate = useNavigate();

    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchDisputes(); }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/disputes/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDisputes(res.data.disputes || []);
        } catch (err) {
            setError('Failed to load disputes');
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9f6f]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <Shield size={20} className="text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Dispute Center</h1>
                            <p className="text-xs text-gray-400">Manage and track your disputes</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/raise-dispute')}
                        className="flex items-center gap-2 bg-[#0d9f6f] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a8560] transition-colors"
                    >
                        <Plus size={15} /> Raise Dispute
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm mb-4">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {disputes.length === 0 ? (
                    <div className="bg-white rounded-xl border shadow-sm p-16 text-center">
                        <Shield size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-base font-bold text-gray-600">No disputes</h3>
                        <p className="text-sm text-gray-400 mt-1">You have no active or past disputes.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {disputes.map(dispute => {
                            const s = statusConfig[dispute.status] || statusConfig.open;
                            const StatusIcon = s.icon;
                            return (
                                <div
                                    key={dispute._id}
                                    onClick={() => navigate(`/disputes/${dispute._id}`)}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className="text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1"
                                                    style={{ color: s.color, background: s.bg }}
                                                >
                                                    <StatusIcon size={11} /> {s.label}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-sm">
                                                {dispute.gigId?.title || 'Gig'}
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-1">{dispute.reason}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                <span>vs {dispute.againstUser?.name}</span>
                                                <span>·</span>
                                                <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                                                {dispute.messages?.length > 0 && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageCircle size={11} /> {dispute.messages.length} messages
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-[#0d9f6f]">
                                                {formatAmount(dispute.paymentId?.amount || 0)}
                                            </p>
                                            <ChevronRight size={16} className="text-gray-300 mt-2 ml-auto" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DisputeCenter;