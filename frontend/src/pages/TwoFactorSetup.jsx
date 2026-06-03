import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function TwoFactorSetup() {
    const { token } = useAuth();
    const [secret, setSecret] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        check2FAStatus();
    }, []);

    const check2FAStatus = async () => {
        const res = await axios.get('http://localhost:5000/api/2fa/status', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setIsEnabled(res.data.enabled);
    };

    const setup2FA = async () => {
        setLoading(true);
        const res = await axios.post('http://localhost:5000/api/2fa/setup', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSecret(res.data.secret);
        setQrCode(res.data.qrCode);
        setLoading(false);
    };

    const enable2FA = async () => {
        await axios.post('http://localhost:5000/api/2fa/verify-enable', {
            token: verificationCode
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert('2FA enabled successfully!');
        setIsEnabled(true);
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Two-Factor Authentication</h1>
            
            {!isEnabled ? (
                !qrCode ? (
                    <button onClick={setup2FA} className="bg-[#0d9f6f] text-white px-4 py-2 rounded">
                        Set up 2FA
                    </button>
                ) : (
                    <div>
                        <p>Scan this QR code with Google Authenticator:</p>
                        <img src={qrCode} alt="QR Code" className="my-4" />
                        <p>Or enter this secret manually: <strong>{secret}</strong></p>
                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="border p-2 rounded w-full my-2"
                        />
                        <button onClick={enable2FA} className="bg-green-500 text-white px-4 py-2 rounded">
                            Verify & Enable
                        </button>
                    </div>
                )
            ) : (
                <div className="bg-green-100 p-4 rounded">
                    ✅ 2FA is enabled on your account
                </div>
            )}
        </div>
    );
}