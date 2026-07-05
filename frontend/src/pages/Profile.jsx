import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { profileAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';

const CURRENCIES = ['USD','EUR','GBP','JPY','CAD','AUD','INR','BRL','MXN','CHF'];

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ bio: '', currency_preference: 'USD' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    profileAPI.get().then(({ data }) => {
      // DRF router returns a list for ViewSet list action
      const profile = Array.isArray(data) ? data[0] : data;
      if (profile) setForm({ bio: profile.bio || '', currency_preference: profile.currency_preference || 'USD' });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await profileAPI.update(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Profile">
      <div className="page-header">
        <h2>Profile Settings</h2>
      </div>

      <div style={{ maxWidth: 520 }}>
        {/* Account info (read-only) */}
        <div className="card" style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>Account Info</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Username</span>
              <strong>{user?.username}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Email</span>
              <strong>{user?.email || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Member since</span>
              <strong>{user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—'}</strong>
            </div>
          </div>
        </div>

        {/* Editable profile */}
        <div className="card">
          <strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>Preferences</strong>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Currency</label>
              <select value={form.currency_preference} onChange={(e) => setForm({ ...form, currency_preference: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us a bit about yourself…" />
            </div>
            {error && <div className="error-msg">{error}</div>}
            {saved && <div style={{ color: 'var(--success)', fontSize: 13 }}>✓ Profile saved successfully!</div>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
