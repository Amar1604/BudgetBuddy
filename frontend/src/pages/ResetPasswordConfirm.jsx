import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { profileAPI } from '../services/services';
import { RupeeBagIcon } from '../components/Logo';

const EyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeClosed = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function ResetPasswordConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const uidb64 = searchParams.get('uidb64') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uidb64 || !token) {
      setError('Invalid reset link. Missing token parameters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await profileAPI.resetPasswordConfirm({
        uidb64,
        token,
        new_password: password
      });
      setSuccess(true);
    } catch (err) {
      console.error("Password reset confirm error:", err);
      if (err.response && err.response.data) {
        setError(err.response.data.error || JSON.stringify(err.response.data));
      } else {
        setError('Failed to update password. Link may be invalid or expired.');
      }
    } finally {
      setLoading(false);
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
      {/* Left side panel: App Branding */}
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
          Reset your password
        </h1>
        <p style={{ color: '#9ca3af', fontSize: 15, margin: 0 }}>
          Securing your financial logs at <strong style={{ color: '#ececf1' }}>BudgetBuddy</strong>
        </p>
      </div>

      {/* Right side panel: Confirm Password Form */}
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
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Password Updated</h2>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
                Your password has been successfully updated. You can now use it to log into your account.
              </p>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/login')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Back to Login
              </button>
            </div>
          ) : !uidb64 || !token ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f43f5e', marginBottom: 8 }}>Invalid Link</h2>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
                This password reset link is malformed or invalid. Please check the URL or request a new reset link.
              </p>
              <Link 
                to="/login"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border)' }}
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px 0' }}>Create new password</h2>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 28px 0' }}>
                Please enter and confirm your new secure account password.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label>New Password * (Min 8 characters)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      style={{ paddingRight: '44px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeClosed /> : <EyeOpen />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="••••••••" 
                      style={{ paddingRight: '44px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
                    </button>
                  </div>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                >
                  {loading ? 'Updating Password…' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
