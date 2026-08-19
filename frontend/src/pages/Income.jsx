import { useEffect, useState } from 'react';
import Layout from '../layouts/Layout';
import Modal from '../components/Modal';
import { incomeAPI } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import { RupeeBagIcon } from '../components/Logo';

const SOURCES = ['SALARY','POCKET_MONEY','SCHOLARSHIP','FREELANCING','BUSINESS','OTHER'];
const EMPTY = { title: '', amount: '', source: 'SALARY', description: '', date: '' };

const formatSource = (s) => s.replace('_', ' ').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export default function Income() {
  const { user } = useAuth();
  const pref = user?.currency_preference || 'INR';
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | item
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => incomeAPI.list().then(({ data }) => setItems(data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm(EMPTY);
    setError('');
    setModal('add');
  };
  const openEdit = (item) => {
    setForm({ title: item.title || 'Income Log', amount: item.amount, source: item.source, description: item.description || '', date: item.date });
    setError('');
    setModal(item);
  };
  const close = () => {
    setModal(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (modal === 'add') await incomeAPI.create(form);
      else await incomeAPI.update(modal.id, form);
      await load();
      close();
    } catch (err) {
      console.error("Save income failed:", err);
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
        setError("Failed to save income. Please check your inputs.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this income entry?')) return;
    await incomeAPI.remove(id);
    load();
  };

  const total = items.reduce((s, i) => s + parseFloat(i.amount), 0);
  const fmt = (n) => formatCurrency(n, pref);

  return (
    <Layout title="Income">
      <div className="page-header">
        <div>
          <h2>Income</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total: <strong style={{ color: 'var(--success)' }}>{fmt(total)}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Export PDF</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Income</button>
        </div>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div className="empty-state">
            <div><RupeeBagIcon size={40} /></div>
            <p>No income entries yet. Add your first one!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.title || 'Income Log'}</strong></td>
                    <td><span className="badge badge-green">{item.source_display}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.description || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.date}</td>
                    <td><strong style={{ color: 'var(--success)' }}>{fmt(item.amount)}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Income' : 'Edit Income'} onClose={close} onSubmit={handleSubmit} loading={loading}>
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
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Monthly Paycheck" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount *</label>
              <input type="number" step="0.01" min="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Source *</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {SOURCES.map((s) => <option key={s} value={s}>{formatSource(s)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes…" />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
