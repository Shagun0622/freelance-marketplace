import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const { socket } = useChat();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications?limit=20', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
        setLoading(false);
    }, [token]);

    const markAsRead = async (notificationId) => {
        try {
            await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => 
                n._id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            if (!notifications.find(n => n._id === notificationId)?.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Listen for real-time notifications via socket
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            console.log('🔔 New notification:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/logo.png'
                });
            }
        };

        socket.on('new_notification', handleNewNotification);
        
        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Fetch notifications when user logs in
    useEffect(() => {
        if (user && token) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user, token, fetchNotifications]);

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'proposal_submitted': return '📩';
            case 'proposal_accepted': return '🎉';
            case 'proposal_rejected': return '❌';
            case 'new_message': return '💬';
            case 'payment_received': return '💰';
            case 'gig_posted': return '📋';
            default: return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch(type) {
            case 'proposal_accepted': return 'bg-green-100 text-green-700';
            case 'proposal_rejected': return 'bg-red-100 text-red-700';
            case 'new_message': return 'bg-blue-100 text-blue-700';
            case 'payment_received': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            showDropdown,
            setShowDropdown,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            fetchNotifications,
            getNotificationIcon,
            getNotificationColor
        }}>
            {children}
        </NotificationContext.Provider>
    );
};