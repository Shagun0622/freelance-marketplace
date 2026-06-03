import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import {
    Shield, ArrowLeft, Send, CheckCircle,
    Clock, AlertCircle, XCircle, Loader, MessageCircle
} from 'lucide-react';

const statusConfig = {
    open:                { label: 'Open',                    color: '#f09f27', bg: '#f09f2715' },
    under_review:        { label: 'Under Review',            color: '#0a85a0', bg: '#0a85a015' },
    resolved_client:     { label: 'Resolved for Client',     color: '#0d9f6f', bg: '#0d9f6f15' },
    resolved_freelancer: { label: 'Resolved for Freelancer', color: '#0d9f6f', bg: '#0d9f6f15' },
    closed:              { label: 'Closed',                  color: '#9ca3af', bg: '#9ca3af15' },
};

function DisputeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { formatAmount } = useCurrency();
    const bottomRef = useRef(null);

    const [dispute, setDispute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { fetchDispute(); }, [id]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [dispute?.messages]);

    const fetchDispute = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/disputes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDispute(res.data.dispute);
        } catch {
            setError('Failed to load dispute');
        }
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!message.trim()) return;
        setSending(true);
        try {
            await axios.post(`http://localhost:5000/api/disputes/${id}/message`,
                { message },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('');
            await fetchDispute();
        } catch {
            setError('Failed to send message');
        }
        setSending(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0d9f6f]" />
        </div>
    );

    if (!dispute) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-400">Dispute not found</p>
        </div>
    );

    const s = statusConfig[dispute.status] || statusConfig.open;
    const isResolved = ['resolved_client', 'resolved_freelancer', 'closed'].includes(dispute.status);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                <button onClick={() => navigate('/disputes')}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#0d9f6f] mb-6">
                    <ArrowLeft size={16} /> Back to Disputes
                </button>

                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-4">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                {/* Dispute Info Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
                    <div className="h-1 bg-gradient-to-r from-red-400 to-orange-400" />
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={16} className="text-red-400" />
                                    <h1 className="font-bold text-gray-800">{dispute.gigId?.title}</h1>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-md"
                                    style={{ color: s.color, background: s.bg }}>
                                    {s.label}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-[#0d9f6f]">
                                    {formatAmount(dispute.paymentId?.amount || 0)}
                                </p>
                                <p className="text-xs text-gray-400">Disputed amount</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl text-sm">
                            <div>
                                <p className="text-xs text-gray-400">Raised by</p>
                                <p className="font-semibold">{dispute.raisedBy?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Against</p>
                                <p className="font-semibold">{dispute.againstUser?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Reason</p>
                                <p className="font-semibold">{dispute.reason}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Filed on</p>
                                <p className="font-semibold">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{dispute.description}</p>
                        </div>

                        {/* Resolution */}
                        {isResolved && dispute.resolution && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Admin Resolution</p>
                                <p className="text-sm text-green-700">{dispute.resolution}</p>
                                <p className="text-xs text-green-500 mt-1">
                                    Resolved on {new Date(dispute.resolvedAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Thread */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <MessageCircle size={16} className="text-[#0d9f6f]" />
                        <h2 className="font-bold text-gray-800">Discussion</h2>
                        <span className="ml-auto text-xs text-gray-400">{dispute.messages?.length || 0} messages</span>
                    </div>

                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {dispute.messages?.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-8">No messages yet. Start the discussion.</p>
                        ) : (
                            dispute.messages.map((msg, i) => {
                                const isMe = msg.senderId?._id === user?._id || msg.senderId?._id === user?.id;
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs sm:max-w-sm rounded-xl px-4 py-2.5 text-sm ${
                                            msg.isAdmin
                                                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                                                : isMe
                                                    ? 'bg-[#0d9f6f] text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            <p className={`text-[10px] font-semibold mb-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                                {msg.isAdmin ? '🛡️ Admin' : msg.senderId?.name}
                                            </p>
                                            <p>{msg.message}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Message Input */}
                    {!isResolved && (
                        <div className="p-4 border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0d9f6f]"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={sending || !message.trim()}
                                className="bg-[#0d9f6f] text-white px-4 py-2.5 rounded-lg hover:bg-[#0a8560] disabled:opacity-50 flex items-center gap-1.5 text-sm font-semibold"
                            >
                                {sending ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DisputeDetail;