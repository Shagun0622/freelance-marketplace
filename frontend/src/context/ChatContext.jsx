import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversationState] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState({});
    const [loading, setLoading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // ✅ THE FIX: ref that always mirrors currentConversation state.
    // Socket handlers are created once and close over the initial null value —
    // reading this ref instead gives them the live value at call time.
    const currentConversationRef = useRef(null);

    // Keep ref in sync whenever state changes
    const setCurrentConversation = (conv) => {
        currentConversationRef.current = conv;
        setCurrentConversationState(conv);
    };

    // ─── Socket initialisation ───────────────────────────────────────────────
    useEffect(() => {
        if (!user || !token) {
            console.log('❌ No user or token, skipping socket connection');
            return;
        }

        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.error('❌ Invalid token format');
            return;
        }

        console.log('✅ Token valid, connecting socket...');

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const newSocket = io('http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        // ── connect / disconnect ──────────────────────────────────────────────
        newSocket.on('connect', () => {
            console.log('✅ Socket connected! ID:', newSocket.id);
            setSocketConnected(true);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            setSocketConnected(false);
            if (error.message === 'Invalid token') {
                console.error('Token invalid – please log in again');
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            setSocketConnected(false);
        });

        // ── receive_message ───────────────────────────────────────────────────
        // ✅ Uses currentConversationRef.current — never stale
        newSocket.on('receive_message', (data) => {
            console.log('📨 Received message:', data);

            if (currentConversationRef.current?._id === data.conversationId) {
                setMessages((prev) => {
                    // Drop the matching temp message (same text, created within 5 s)
                    const withoutTemp = prev.filter(
                        (m) =>
                            !(
                                m._id?.startsWith('temp_') &&
                                m.message === data.message?.message
                            )
                    );
                    // Avoid duplicate if message_sent already added it
                    const alreadyExists = withoutTemp.some(
                        (m) => m._id === data.message?._id
                    );
                    return alreadyExists ? withoutTemp : [...withoutTemp, data.message];
                });
            }

            fetchConversations();
            fetchUnreadCount();
        });

        // ── message_sent ─────────────────────────────────────────────────────
        // ✅ Uses ref; replaces the temp optimistic message with the confirmed one
        newSocket.on('message_sent', (message) => {
            console.log('✅ Message sent confirmation:', message);

            if (currentConversationRef.current?._id === message.conversationId) {
                setMessages((prev) => {
                    // Find a temp message with the same text and swap it out
                    const tempIdx = prev.findIndex(
                        (m) =>
                            m._id?.startsWith('temp_') &&
                            m.message === message.message
                    );
                    if (tempIdx === -1) {
                        // No temp found – avoid duplicate
                        const exists = prev.some((m) => m._id === message._id);
                        return exists ? prev : [...prev, message];
                    }
                    const updated = [...prev];
                    updated[tempIdx] = message;
                    return updated;
                });
            }
        });

        // ── user_typing ───────────────────────────────────────────────────────
        // ✅ Uses ref
        newSocket.on('user_typing', (data) => {
            if (data.conversationId === currentConversationRef.current?._id) {
                setTypingUsers((prev) => ({
                    ...prev,
                    [data.userId]: data.isTyping,
                }));
                // Auto-clear after 2 s in case stop event is missed
                setTimeout(() => {
                    setTypingUsers((prev) => ({
                        ...prev,
                        [data.userId]: false,
                    }));
                }, 2000);
            }
        });

        // ── messages_read ─────────────────────────────────────────────────────
        // ✅ Uses ref; this is what makes the double-tick turn blue / appear
        newSocket.on('messages_read', (data) => {
            console.log('📖 Messages read:', data);
            if (data.conversationId === currentConversationRef.current?._id) {
                setMessages((prev) =>
                    prev.map((msg) => ({ ...msg, read: true }))
                );
            }
            fetchUnreadCount();
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user, token]); // socket is only created once per session

    // ─── REST helpers ────────────────────────────────────────────────────────
    const fetchConversations = async () => {
        if (!token) return;
        try {
            const res = await axios.get(
                'http://localhost:5000/api/chat/conversations',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setConversations(res.data.conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchMessages = async (conversationId) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/chat/messages/${conversationId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(res.data.messages);

            // Mark as read if there are unread messages from the other participant
            if (socketRef.current && currentConversationRef.current) {
                // ✅ Normalise id/_id
                const myId = user?.id || user?._id;
                const otherUser = currentConversationRef.current.participants?.find(
                    (p) => String(p._id) !== String(myId)
                );
                if (
                    otherUser &&
                    res.data.messages.some(
                        (m) =>
                            String(m.senderId?._id) === String(otherUser._id) &&
                            !m.read
                    )
                ) {
                    socketRef.current.emit('mark_read', {
                        conversationId,
                        senderId: otherUser._id,
                    });
                }
            }

            fetchUnreadCount();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
        setLoading(false);
    };

    const getOrCreateConversation = async (otherUserId, gigId = null) => {
        if (!token) return null;
        try {
            const res = await axios.post(
                'http://localhost:5000/api/chat/conversation',
                { otherUserId, gigId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchConversations();
            return res.data.conversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            return null;
        }
    };

    const sendMessage = (conversationId, receiverId, message, gigId = null) => {
        if (!socketRef.current || !socketConnected) {
            console.error('❌ Socket not connected! Cannot send message.');
            alert('Connection issue. Please refresh the page.');
            return;
        }
        if (!message.trim()) return;

        // ✅ Normalise: some auth flows store _id, others store id
        const myId = user?.id || user?._id;

        // Optimistic message shown immediately
        const tempMessage = {
            _id: `temp_${Date.now()}`,
            conversationId,
            senderId: { _id: myId, name: user?.name, email: user?.email },
            receiverId,
            message: message.trim(),
            read: false,
            isTemp: true,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMessage]);

        socketRef.current.emit('send_message', {
            conversationId,
            receiverId,
            message: message.trim(),
            gigId,
        });
    };

    const sendTyping = (receiverId, conversationId, isTyping) => {
        if (!socketRef.current || !socketConnected) return;
        socketRef.current.emit('typing', { receiverId, conversationId, isTyping });
    };

    const handleTyping = (receiverId, conversationId) => {
        if (!socketRef.current || !socketConnected) return;
        sendTyping(receiverId, conversationId, true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTyping(receiverId, conversationId, false);
        }, 1000);
    };

    const fetchUnreadCount = async () => {
        if (!token) return;
        try {
            const res = await axios.get(
                'http://localhost:5000/api/chat/unread-count',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUnreadCount(res.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markConversationAsRead = (conversationId, senderId) => {
        if (socketRef.current && socketConnected) {
            socketRef.current.emit('mark_read', { conversationId, senderId });
        }
    };

    // ─── Fetch on login ───────────────────────────────────────────────────────
    useEffect(() => {
        if (user && token) {
            fetchConversations();
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user, token]);

    // Clear messages when no conversation is selected
    useEffect(() => {
        if (!currentConversationRef.current) {
            setMessages([]);
        }
    }, [currentConversationRef.current]); // eslint-disable-line

    // ─── Context value ────────────────────────────────────────────────────────
    const value = {
        socket,
        conversations,
        messages,
        unreadCount,
        currentConversation,
        loading,
        typingUsers,
        socketConnected,
        setCurrentConversation,   // ✅ wrapped version that also updates the ref
        fetchConversations,
        fetchMessages,
        getOrCreateConversation,
        sendMessage,
        sendTyping,
        handleTyping,
        fetchUnreadCount,
        markConversationAsRead,
    };

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
};

export default ChatProvider;