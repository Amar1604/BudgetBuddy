import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/services';
import Modal from '../components/Modal';

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

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset password states
  const [forgotModal, setForgotModal] = useState(false);
  const [resetForm, setResetForm] = useState({ username: '', email: '', new_password: '', confirm_password: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (resetForm.new_password.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }
    if (resetForm.new_password !== resetForm.confirm_password) {
      setResetError('Passwords do not match.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    try {
      const { data } = await profileAPI.resetPassword({
        username: resetForm.username,
        email: resetForm.email,
        new_password: resetForm.new_password
      });
      setResetSuccess(data.detail || 'Password reset successfully! You can now log in.');
      setResetForm({ username: '', email: '', new_password: '', confirm_password: '' });
      setTimeout(() => {
        setForgotModal(false);
        setResetSuccess('');
      }, 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.response && err.response.data) {
        setResetError(err.response.data.detail || JSON.stringify(err.response.data));
      } else {
        setResetError('Failed to reset password.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div style={{ position: 'absolute', top: 20, left: 24 }}>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          textDecoration: 'none',
          color: 'var(--text-muted)',
          fontSize: 14,
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          ← Back to Home
        </Link>
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <span>💰 BudgetBuddy</span>
        </div>
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" autoFocus />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <button 
                type="button" 
                onClick={() => setForgotModal(true)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  fontSize: 12, 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
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
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  transition: 'color 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {showPassword ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="footer-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>

      {forgotModal && (
        <Modal 
          title="Reset Password" 
          onClose={() => { setForgotModal(false); setResetError(''); setResetSuccess(''); }} 
          onSubmit={handleResetSubmit} 
          loading={resetLoading}
          submitLabel="Reset Password"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
              Enter your username and email address to verify your account and set a new password.
            </p>
            <div className="form-group">
              <label>Username *</label>
              <input 
                type="text" 
                required 
                value={resetForm.username} 
                onChange={(e) => setResetForm({ ...resetForm, username: e.target.value })} 
                placeholder="Enter your username" 
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input 
                type="email" 
                required 
                value={resetForm.email} 
                onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })} 
                placeholder="you@example.com" 
              />
            </div>
            <div className="form-group">
              <label>New Password * (Min 8 characters)</label>
              <input 
                type="password" 
                required 
                value={resetForm.new_password} 
                onChange={(e) => setResetForm({ ...resetForm, new_password: e.target.value })} 
                placeholder="••••••••" 
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password *</label>
              <input 
                type="password" 
                required 
                value={resetForm.confirm_password} 
                onChange={(e) => setResetForm({ ...resetForm, confirm_password: e.target.value })} 
                placeholder="••••••••" 
              />
            </div>

            {resetError && <div className="error-msg">{resetError}</div>}
            {resetSuccess && <div style={{ color: 'var(--success)', fontSize: 13 }}>✓ {resetSuccess}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
