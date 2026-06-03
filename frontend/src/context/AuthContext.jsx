import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Set axios default header whenever token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        if (token) {
            try {
                const res = await axios.get('http://localhost:5000/api/auth/me');
                setUser(res.data.user);
                // Also store user in localStorage for persistence
                localStorage.setItem('user', JSON.stringify(res.data.user));
            } catch (error) {
                console.error('Token validation failed:', error);
                logout();
            }
        }
        setLoading(false);
    };

    const register = async (userData) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', userData);
            const { token: newToken, user: newUser } = res.data;
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));
            setToken(newToken);
            setUser(newUser);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Registration failed' };
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            const { token: newToken, user: newUser } = res.data;
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));
            setToken(newToken);
            setUser(newUser);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    // 🔥 NEW: Update user profile (for Dashboard edit profile)
    const updateUser = async (updatedUserData) => {
        try {
            const res = await axios.put('http://localhost:5000/api/auth/update-profile', updatedUserData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Profile update failed:', error);
            return { success: false, error: error.response?.data?.message || 'Profile update failed' };
        }
    };

    // 🔥 NEW: Update user state directly (for local updates)
    const setUserData = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            token, 
            register, 
            login, 
            logout,
            updateUser,
            setUserData
        }}>
            {children}
        </AuthContext.Provider>
    );
};