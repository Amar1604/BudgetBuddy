import { useEffect, useState } from 'react';
import Layout from '../layouts/Layout';
import Modal from '../components/Modal';
import { budgetAPI, expenseAPI } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const CATEGORIES = ['FOOD','TRAVEL','SHOPPING','EDUCATION','ENTERTAINMENT','HEALTHCARE','BILLS','MISCELLANEOUS'];
const PERIODS = ['weekly','monthly','yearly'];
const EMPTY = { category: 'FOOD', amount: '', period: 'monthly', start_date: '', end_date: '' };

export default function Budgets() {
  const { user } = useAuth();
  const pref = user?.currency_preference || 'USD';
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = () => Promise.all([budgetAPI.list(), expenseAPI.list()])
    .then(([b, e]) => { setBudgets(b.data); setExpenses(e.data); })
    .catch(() => {});

  useEffect(() => { load(); }, []);

  const getSpent = (category) =>
    expenses.filter((e) => e.category === category).reduce((s, e) => s + parseFloat(e.amount), 0);

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (b) => {
    setForm({ category: b.category, amount: b.amount, period: b.period, start_date: b.start_date, end_date: b.end_date || '' });
    setModal(b);
  };
  const close = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, end_date: form.end_date || null };
      if (modal === 'add') await budgetAPI.create(payload);
      else await budgetAPI.update(modal.id, payload);
      await load();
      close();
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    await budgetAPI.remove(id);
    load();
  };

  const fmt = (n) => formatCurrency(n, pref);

  return (
    <Layout title="Budgets">
      <div className="page-header">
        <h2>Budgets</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Budget</button>
      </div>

      {budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>📋</div>
            <p>No budgets set. Create one to start tracking!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {budgets.map((b) => {
            const spent = getSpent(b.category);
            const limit = parseFloat(b.amount);
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over = spent > limit;
            return (
              <div key={b.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{b.category_display}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.period_display} · from {b.start_date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>✕</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: over ? 'var(--danger)' : 'var(--text-muted)' }}>
                    Spent: <strong>{fmt(spent)}</strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>Limit: <strong>{fmt(limit)}</strong></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${pct}%`,
                    background: over ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--primary)',
                  }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: over ? 'var(--danger)' : 'var(--text-muted)', fontWeight: over ? 600 : 400 }}>
                  {over ? `⚠ Over budget by ${fmt(spent - limit)}` : `${fmt(limit - spent)} remaining (${Math.round(pct)}% used)`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Budget' : 'Edit Budget'} onClose={close} onSubmit={handleSubmit} loading={loading}>
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Period *</label>
              <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                {PERIODS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Budget Limit *</label>
            <input type="number" step="0.01" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
