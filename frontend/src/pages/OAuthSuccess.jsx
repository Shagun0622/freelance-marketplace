import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function OAuthSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');

        if (token) {
            // Store token
            localStorage.setItem('token', token);
            
            // Fetch user data
            const fetchUser = async () => {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    navigate('/dashboard');
                } catch (err) {
                    console.error('Failed to fetch user:', err);
                    navigate('/login?error=google_auth_failed');
                }
            };
            fetchUser();
        } else if (error) {
            navigate('/login?error=google_auth_failed');
        } else {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9f6f] mx-auto mb-4"></div>
                <p className="text-gray-600">Completing login...</p>
            </div>
        </div>
    );
}

export default OAuthSuccess;