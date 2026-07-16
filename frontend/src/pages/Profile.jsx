import { useEffect, useState } from 'react';
import Layout from '../layouts/Layout';
import { profileAPI } from '../services/services';
import { useAuth } from '../context/AuthContext';

const CURRENCIES = ['USD','EUR','GBP','JPY','CAD','AUD','INR','BRL','MXN','CHF'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ bio: '', currency_preference: 'USD' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password change state
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    profileAPI.get().then(({ data }) => {
      const profile = Array.isArray(data) ? data[0] : data;
      if (profile) {
        setForm({ bio: profile.bio || '', currency_preference: profile.currency_preference || 'USD' });
        setAvatarUrl(profile.avatar || '');
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('bio', form.bio);
    formData.append('currency_preference', form.currency_preference);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const { data } = await profileAPI.update(formData);
      setForm({ bio: data.bio || '', currency_preference: data.currency_preference || 'USD' });
      setAvatarUrl(data.avatar || '');
      setUser({ ...user, avatar: data.avatar });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

    } catch (err) {
      console.error("Profile save error:", err);
      if (err.response && err.response.data) {
        setError(typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data);
      } else {
        setError('Failed to save profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.new_password.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwSuccess(false);
    try {
      await profileAPI.changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password
      });
      setPwSuccess(true);
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(false), 5000);
    } catch (err) {
      console.error("Password change error:", err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.old_password) setPwError(data.old_password[0]);
        else if (data.new_password) setPwError(data.new_password[0]);
        else if (data.non_field_errors) setPwError(data.non_field_errors[0]);
        else setPwError(typeof data === 'object' ? JSON.stringify(data) : data);
      } else {
        setPwError('Failed to update password.');
      }
    } finally {
      setPwLoading(false);
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
            {/* Avatar Preview & Upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid var(--border)'
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 24 }}>👤</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Profile Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarUrl(URL.createObjectURL(file));
                    }
                  }}
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>

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

        {/* Change Password Card */}
        <div className="card" style={{ marginTop: 16 }}>
          <strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>Change Password</strong>
          <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Current Password *</label>
              <input 
                type="password" 
                required 
                value={pwForm.old_password} 
                onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })} 
                placeholder="Enter current password" 
              />
            </div>
            <div className="form-group">
              <label>New Password * (Min 8 characters)</label>
              <input 
                type="password" 
                required 
                value={pwForm.new_password} 
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} 
                placeholder="Enter new password" 
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password *</label>
              <input 
                type="password" 
                required 
                value={pwForm.confirm_password} 
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} 
                placeholder="Confirm new password" 
              />
            </div>
            
            {pwError && <div className="error-msg">{pwError}</div>}
            {pwSuccess && <div style={{ color: 'var(--success)', fontSize: 13 }}>✓ Password updated successfully!</div>}
            
            <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ alignSelf: 'flex-start' }}>
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

