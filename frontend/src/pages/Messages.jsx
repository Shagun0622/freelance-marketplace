import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, CheckCheck, Clock, Briefcase, MessageCircle } from 'lucide-react';

function Messages() {
    const { user } = useAuth();
    const {
        conversations,
        messages,
        currentConversation,
        setCurrentConversation,
        fetchConversations,
        fetchMessages,
        sendMessage,
        handleTyping,   // ✅ use the context version — it manages its own timeout
        typingUsers,
        socketConnected,
    } = useChat();
    const navigate = useNavigate();

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (currentConversation) {
            fetchMessages(currentConversation._id);
        }
    }, [currentConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ✅ Normalise: some auth flows store id, others store _id
    const myId = user?.id || user?._id;

    // ✅ String coercion so ObjectId !== string comparisons never bite us
    const getOtherUser = (conversation) => {
        if (!conversation?.participants || !myId) return null;
        return conversation.participants.find(
            (p) => String(p._id) !== String(myId)
        );
    };

    const handleConversationClick = (conversation) => {
        setCurrentConversation(conversation);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentConversation) return;

        const receiver = getOtherUser(currentConversation);
        if (!receiver) return;

        sendMessage(
            currentConversation._id,
            receiver._id,
            newMessage,
            currentConversation.gigId?._id
        );
        setNewMessage('');
    };

    // ✅ Delegate typing indicator entirely to the context helper
    const onInputChange = (e) => {
        setNewMessage(e.target.value);
        if (!currentConversation) return;
        const receiver = getOtherUser(currentConversation);
        if (!receiver) return;
        handleTyping(receiver._id, currentConversation._id);
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const days = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (days === 0)
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (days === 1) return 'Yesterday';
        return d.toLocaleDateString();
    };

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">

            {/* ── Sidebar ── */}
            <div className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-[#1a2332] tracking-tight">Messages</h1>
                    {/* ✅ Live connection indicator */}
                    <span
                        className={`w-2 h-2 rounded-full ${
                            socketConnected ? 'bg-[#0d9f6f]' : 'bg-red-400'
                        }`}
                        title={socketConnected ? 'Connected' : 'Disconnected'}
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <MessageCircle size={40} className="mb-3 opacity-25" />
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs mt-1 opacity-70">Start a conversation from a gig</p>
                        </div>
                    ) : (
                        conversations.map((conversation) => {
                            const otherUser = getOtherUser(conversation);
                            const isActive = currentConversation?._id === conversation._id;
                            return (
                                <button
                                    key={conversation._id}
                                    onClick={() => handleConversationClick(conversation)}
                                    className={`w-full px-4 py-3 text-left border-b border-gray-100 flex items-center gap-3 transition-colors
                                        ${isActive
                                            ? 'bg-[#0d9f6f]/5 border-l-[3px] border-l-[#0d9f6f]'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="w-9 h-9 rounded-full bg-[#0d9f6f]/10 text-[#0d9f6f] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                        {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#1a2332] truncate">
                                            {otherUser?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">
                                            {conversation.lastMessage || 'Start a conversation'}
                                        </p>
                                    </div>
                                    {conversation.lastMessageTime && (
                                        <span className="text-[11px] text-gray-400 flex-shrink-0">
                                            {formatTime(conversation.lastMessageTime)}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Chat Area ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {currentConversation ? (
                    <>
                        {/* Header */}
                        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-[#1a2332] transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            <div className="w-9 h-9 rounded-full bg-[#0d9f6f]/10 text-[#0d9f6f] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {getOtherUser(currentConversation)?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#1a2332] leading-tight">
                                    {getOtherUser(currentConversation)?.name || 'Unknown'}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {getOtherUser(currentConversation)?.role === 'client'
                                        ? 'Client'
                                        : 'Freelancer'}
                                </p>
                            </div>

                            {currentConversation.gigId && (
                                <span className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md whitespace-nowrap">
                                    {currentConversation.gigId.title}
                                </span>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 bg-gray-50">
                            {messages.map((msg, idx) => {
                                // ✅ Guard: if senderId is missing (shouldn't happen) default to non-own
                                const isOwn =
                                    msg.senderId?._id != null &&
                                    String(msg.senderId._id) === String(myId);

                                return (
                                    <div
                                        key={msg._id || idx}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[65%] px-4 py-2.5 shadow-sm
                                                ${isOwn
                                                    ? 'bg-[#0d9f6f] text-white rounded-2xl rounded-br-sm'
                                                    : 'bg-white text-[#1a2332] rounded-2xl rounded-bl-sm border border-gray-100'
                                                }
                                                ${msg.isTemp ? 'opacity-70' : 'opacity-100'}
                                            `}
                                        >
                                            <p className="text-sm leading-relaxed break-words">
                                                {msg.message}
                                            </p>
                                            <div
                                                className={`flex items-center justify-end gap-1 mt-1 text-[10px]
                                                    ${isOwn ? 'text-white/60' : 'text-gray-400'}`}
                                            >
                                                <span>{formatTime(msg.createdAt)}</span>
                                                {/* ✅ Tick logic: temp → clock, read → double tick, sent → single clock */}
                                                {isOwn && (
                                                    msg.isTemp ? (
                                                        <Clock size={11} className="opacity-50" />
                                                    ) : msg.read ? (
                                                        <CheckCheck size={11} />
                                                    ) : (
                                                        <Clock size={11} />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Typing indicator */}
                            {typingUsers[getOtherUser(currentConversation)?._id] && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1 items-center shadow-sm">
                                        {[0, 1, 2].map((i) => (
                                            <span
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-[#0d9f6f] opacity-40 animate-bounce"
                                                style={{ animationDelay: `${i * 0.15}s` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={handleSendMessage}
                            className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={newMessage}
                                // ✅ onChange handles both value update AND typing indicator
                                onChange={onInputChange}
                                placeholder="Type a message…"
                                className="flex-1 px-4 py-2 rounded-full border-2 border-gray-200 bg-gray-50 text-sm text-[#1a2332] placeholder-gray-400 outline-none focus:border-[#0d9f6f] focus:bg-white transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="w-9 h-9 rounded-full bg-[#0d9f6f] hover:bg-[#0a8560] disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Briefcase size={48} className="opacity-20" />
                        <p className="text-base text-[#1a2332] font-medium">Select a conversation</p>
                        <p className="text-sm opacity-60">
                            Choose a chat from the sidebar to start messaging
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Messages;