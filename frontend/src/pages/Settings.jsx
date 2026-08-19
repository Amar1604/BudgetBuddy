import { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/services';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'BRL', 'MXN', 'CHF'];

export default function Settings() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('INR');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [monthlyNewsletter, setMonthlyNewsletter] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    profileAPI.get().then(({ data }) => {
      const profile = Array.isArray(data) ? data[0] : data;
      if (profile && profile.currency_preference) {
        setCurrency(profile.currency_preference);
      }
    }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Save currency to API
    const formData = new FormData();
    formData.append('currency_preference', currency);

    try {
      await profileAPI.update(formData);
      
      // Save local preferences
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
      setError('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Settings">
      <div className="page-header">
        <h2>App & Preferences Settings</h2>
      </div>

      <div style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Visual Preferences Card */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Visual Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>System Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Preferred Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <small style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                  This currency symbol will be displayed across dashboard widgets and charts.
                </small>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Notification Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  style={{ width: 'auto', margin: 0 }}
                />
                Receive email alerts when spending exceeds 80% of category budget.
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={monthlyNewsletter}
                  onChange={(e) => setMonthlyNewsletter(e.target.checked)}
                  style={{ width: 'auto', margin: 0 }}
                />
                Subscribe to monthly financial health summary newsletters.
              </label>
            </div>
          </div>

          {/* Account Management Card */}
          <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--danger)', marginTop: 0, marginBottom: 16 }}>
              Danger Zone
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Once you delete or reset your data, there is no going back. Please be certain.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 13,
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
                onClick={() => alert("This will clear your local app configurations.")}
              >
                Reset Preferences
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{
                  backgroundColor: 'var(--danger)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
                onClick={() => alert("This action is irreversible. Account deletion endpoint is currently disabled.")}
              >
                Delete Account
              </button>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}
          {saved && <div style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✓ Preferences updated successfully!</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 20px' }}>
            {loading ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
