import { useEffect, useState } from 'react';
import Layout from '../layouts/Layout';
import Modal from '../components/Modal';
import { savingsAPI } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const EMPTY = { name: '', target_amount: '', current_amount: '0', deadline: '', description: '' };

export default function Savings() {
  const { user } = useAuth();
  const pref = user?.currency_preference || 'INR';
  const [goals, setGoals] = useState([]);
  const [modal, setModal] = useState(null);   // null | 'add' | goal-obj | {deposit: goal}
  const [form, setForm] = useState(EMPTY);
  const [deposit, setDeposit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => savingsAPI.list().then(({ data }) => setGoals(data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit = (g) => {
    setForm({ name: g.goal_name, target_amount: g.target_amount, current_amount: g.saved_amount, deadline: g.target_date || '', description: g.description || '' });
    setError('');
    setModal(g);
  };
  const openDeposit = (g) => { setDeposit(''); setError(''); setModal({ deposit: g }); };
  const close = () => { setModal(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Map form fields to match backend expectations (backend model uses 'goal_name' & 'saved_amount')
    const payload = {
      goal_name: form.name,
      target_amount: form.target_amount,
      saved_amount: form.current_amount || '0.00',
      target_date: form.deadline || null,
      description: form.description
    };

    try {
      if (modal === 'add') await savingsAPI.create(payload);
      else await savingsAPI.update(modal.id, payload);
      await load();
      close();
    } catch (err) {
      console.error("Save savings goal failed:", err);
      const errors = err.response?.data;
      if (errors) {
        const msg = Object.entries(errors)
          .map(([key, val]) => {
            const field = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const text = Array.isArray(val) ? val.join(' ') : val;
            return `${field}: ${text}`;
          })
          .join('\n');
        setError(msg);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally { setLoading(false); }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const goal = modal.deposit;
    const newAmount = Math.min(parseFloat(goal.saved_amount) + parseFloat(deposit), parseFloat(goal.target_amount));
    const payload = {
      saved_amount: newAmount.toFixed(2)
    };
    if (newAmount >= parseFloat(goal.target_amount)) {
      payload.status = 'COMPLETED';
    }
    try {
      await savingsAPI.update(goal.id, payload);
      await load();
      close();
    } catch (err) {
      console.error("Deposit failed:", err);
      const errors = err.response?.data;
      if (errors) {
        const msg = Object.entries(errors)
          .map(([key, val]) => {
            const field = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const text = Array.isArray(val) ? val.join(' ') : val;
            return `${field}: ${text}`;
          })
          .join('\n');
        setError(msg);
      } else {
        setError("Failed to process deposit.");
      }
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this savings goal?')) return;
    await savingsAPI.remove(id);
    load();
  };

  const fmt = (n) => formatCurrency(n, pref);

  return (
    <Layout title="Savings Goals">
      <div className="page-header">
        <h2>Savings Goals</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ New Goal</button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>🎯</div>
            <p>No savings goals yet. Set your first goal!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {goals.map((g) => {
            const pct = parseFloat(g.progress_percentage);
            return (
              <div key={g.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{g.goal_name}</div>
                    {g.target_date && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deadline: {g.target_date}</div>}
                  </div>
                  {g.status === 'Completed' || g.status === 'COMPLETED'
                    ? <span className="badge badge-green">✓ Completed</span>
                    : <span className="badge badge-blue">{pct}%</span>
                  }
                </div>

                {g.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{g.description}</p>}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>{fmt(g.saved_amount)} saved</span>
                  <span style={{ color: 'var(--text-muted)' }}>Goal: {fmt(g.target_amount)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${pct}%`,
                    background: (g.status === 'Completed' || g.status === 'COMPLETED') ? 'var(--success)' : pct >= 75 ? 'var(--primary)' : 'var(--warning)',
                  }} />
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  {!(g.status === 'Completed' || g.status === 'COMPLETED') && (
                    <button className="btn btn-primary btn-sm" onClick={() => openDeposit(g)}>+ Deposit</button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(modal === 'add' || (modal && !modal.deposit)) && (
        <Modal title={modal === 'add' ? 'New Savings Goal' : 'Edit Goal'} onClose={close} onSubmit={handleSubmit} loading={loading}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              marginBottom: 16,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              whiteSpace: 'pre-line'
            }}>
              ⚠️ {error}
            </div>
          )}
          <div className="form-group">
            <label>Goal Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency Fund" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Target Amount *</label>
              <input type="number" step="0.01" min="0.01" required value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Current Amount</label>
              <input type="number" step="0.01" min="0" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} placeholder="0.00" />
            </div>
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes…" />
          </div>
        </Modal>
      )}

      {/* Deposit modal */}
      {modal?.deposit && (
        <Modal title={`Deposit to "${modal.deposit.goal_name}"`} onClose={close} onSubmit={handleDeposit} loading={loading}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              marginBottom: 16,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              whiteSpace: 'pre-line'
            }}>
              ⚠️ {error}
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Current: {fmt(modal.deposit.saved_amount)} / {fmt(modal.deposit.target_amount)}
          </div>
          <div className="form-group">
            <label>Deposit Amount *</label>
            <input
              type="number" step="0.01" min="0.01"
              max={parseFloat(modal.deposit.target_amount) - parseFloat(modal.deposit.saved_amount)}
              required value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
