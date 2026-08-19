import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RupeeBagIcon } from '../components/Logo';

export default function OAuth2Callback() {
    const { provider } = useParams();
    const [searchParams] = useSearchParams();
    const { loginWithOAuth } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const hasCalled = useRef(false);

    const [isMockFlow, setIsMockFlow] = useState(false);
    const [mockToken, setMockToken] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customForm, setCustomForm] = useState({ name: '', email: '' });

    const mockAccounts = provider === 'google' ? [
        { name: 'AMAR DEEP', email: 'amardeep1604@gmail.com', avatarText: 'AD', color: '#10B981' },
        { name: '33-Amar Deep', email: 'amar02deep06@gmail.com', avatarText: '33', color: '#3B82F6' }
    ] : [
        { name: 'amardeep1604', email: 'amardeep1604@gmail.com', avatarText: 'AD', color: '#4B5563' },
        { name: 'amar02deep06', email: 'amar02deep06@gmail.com', avatarText: '33', color: '#1F2937' }
    ];

    useEffect(() => {
        const isMock = searchParams.get('mock') === 'true';
        const code = searchParams.get('code');

        if (isMock) {
            const mockId = Math.floor(1000 + Math.random() * 9000);
            const token = provider === 'google' ? `mock_google_${mockId}` : `mock_github_${mockId}`;
            setMockToken(token);
            setIsMockFlow(true);
        } else {
            if (!code) {
                setError('Authentication failed: missing redirect code.');
                return;
            }
            if (hasCalled.current) return;
            hasCalled.current = true;

            // Production login: submit immediately
            loginWithOAuth(provider, code)
                .then(() => {
                    setSuccess(true);
                    setTimeout(() => navigate('/'), 1500);
                })
                .catch((err) => {
                    console.error("OAuth authentication error:", err);
                    setError(err.response?.data?.error || 'Authentication failed. Please try again.');
                });
        }
    }, [provider, searchParams, loginWithOAuth, navigate]);

    const handleSelectAccount = async (account) => {
        try {
            await loginWithOAuth(provider, mockToken, {
                name: account.name,
                email: account.email
            });
            setSuccess(true);
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            console.error("OAuth simulation login error:", err);
            setError(err.response?.data?.error || 'Simulation login failed.');
        }
    };

    const handleCustomSubmit = async (e) => {
        e.preventDefault();
        if (!customForm.name.trim() || !customForm.email.trim()) {
            setError('Name and Email are required.');
            return;
        }
        try {
            await loginWithOAuth(provider, mockToken, {
                name: customForm.name,
                email: customForm.email
            });
            setSuccess(true);
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            console.error("OAuth simulation login error:", err);
            setError(err.response?.data?.error || 'Simulation login failed.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: '#0f0f10',
            color: '#ececf1',
            fontFamily: 'Outfit, Inter, sans-serif'
        }}>
            {/* Split Screen - Left Side: App Branding Banner */}
            <div className="oauth-left-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #131316 0%, #1e1e24 100%)',
                borderRight: '1px solid #2d2d34',
                padding: 40,
                textAlign: 'center'
            }}>
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    backgroundColor: '#1E3A8A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    boxShadow: '0 8px 24px rgba(30, 58, 138, 0.4)',
                    marginBottom: 24
                }}>
                    <RupeeBagIcon size={36} />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
                    Choose an account
                </h1>
                <p style={{ color: '#9ca3af', fontSize: 15, margin: 0 }}>
                    to continue to <strong style={{ color: '#ececf1' }}>BudgetBuddy</strong>
                </p>
            </div>

            {/* Split Screen - Right Side: Account Chooser List */}
            <div className="oauth-right-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '40px 80px',
                backgroundColor: '#0f0f10'
            }}>
                <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>
                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16, animation: 'bounce 1s infinite' }}>✅</div>
                            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Login Successful</h2>
                            <p style={{ color: '#9ca3af', fontSize: 14 }}>
                                Redirecting you to the dashboard...
                            </p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#f43f5e' }}>Login Failed</h2>
                            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>{error}</p>
                            <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center' }}>
                                Back to Login
                            </button>
                        </div>
                    ) : isMockFlow ? (
                        <div>
                            {!showCustomForm ? (
                                <>
                                    <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px 0' }}>Log in or sign up</h2>
                                    <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 28px 0' }}>
                                        Select a simulated account to login.
                                    </p>
                                    
                                    {/* Account List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                                        {mockAccounts.map((acc, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => handleSelectAccount(acc)}
                                                className="oauth-account-row"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 14,
                                                    padding: '14px 18px',
                                                    borderRadius: 12,
                                                    backgroundColor: '#18181b',
                                                    border: '1px solid #27272a',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease-in-out'
                                                }}
                                            >
                                                {/* Account Avatar */}
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    backgroundColor: acc.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: '#ffffff'
                                                }}>
                                                    {acc.avatarText}
                                                </div>
                                                {/* Account Details */}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{acc.name}</div>
                                                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 1 }}>{acc.email}</div>
                                                </div>
                                                <span style={{ color: '#71717a', fontSize: 16 }}>➔</span>
                                            </div>
                                        ))}

                                        {/* Use Another Account Button */}
                                        <div 
                                            onClick={() => setShowCustomForm(true)}
                                            className="oauth-account-row"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 14,
                                                padding: '14px 18px',
                                                borderRadius: 12,
                                                backgroundColor: '#18181b',
                                                border: '1px solid #27272a',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease-in-out'
                                            }}
                                        >
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                backgroundColor: '#3f3f46',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 18
                                            }}>
                                                👤
                                            </div>
                                            <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                                                Use another account
                                            </div>
                                            <span style={{ color: '#71717a', fontSize: 16 }}>➔</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <button 
                                        className="btn btn-ghost" 
                                        onClick={() => setShowCustomForm(false)}
                                        style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', marginBottom: 20 }}
                                    >
                                        ← Back to accounts
                                    </button>
                                    <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px 0' }}>Simulate custom profile</h2>
                                    <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 24px 0' }}>
                                        Enter any name and email to proceed.
                                    </p>
                                    
                                    <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: 13, fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Display Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={customForm.name}
                                                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    borderRadius: 8,
                                                    border: '1px solid #27272a',
                                                    backgroundColor: '#18181b',
                                                    color: '#ececf1',
                                                    fontSize: 14
                                                }}
                                                placeholder="e.g. Amar Deep"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: 13, fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={customForm.email}
                                                onChange={(e) => setCustomForm({ ...customForm, email: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    borderRadius: 8,
                                                    border: '1px solid #27272a',
                                                    backgroundColor: '#18181b',
                                                    color: '#ececf1',
                                                    fontSize: 14
                                                }}
                                                placeholder="e.g. amardeep@example.com"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14, borderRadius: 8, marginTop: 8 }}
                                        >
                                            Continue to Simulation
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Terms disclaimer */}
                            <p style={{
                                marginTop: 32,
                                fontSize: 12,
                                color: '#71717a',
                                lineHeight: '18px',
                                textAlign: 'center'
                            }}>
                                Before using this app, you can review BudgetBuddy's <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>.
                            </p>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 44, marginBottom: 16, animation: 'spin 1.5s linear infinite' }}>🔄</div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Authenticating</h2>
                            <p style={{ color: '#9ca3af', fontSize: 14 }}>
                                Connecting to {provider === 'google' ? 'Google' : 'GitHub'}... Please wait.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Embedded styles for hover effects and layout */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .oauth-account-row:hover {
                    background-color: #27272a !important;
                    border-color: #3f3f46 !important;
                }
                @media (max-width: 768px) {
                    .oauth-left-panel {
                        display: none !important;
                    }
                    .oauth-right-panel {
                        padding: 30px 24px !important;
                    }
                }
            `}</style>
        </div>
    );
}
