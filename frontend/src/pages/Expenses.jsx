import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { expenseAPI } from '../api/services';

const CATEGORIES = ['housing','food','transport','utilities','healthcare','entertainment','shopping','education','other'];
const EMPTY = { title: '', amount: '', category: 'food', description: '', date: '', merchant: '' };

const BADGE = { housing:'badge-blue', food:'badge-green', transport:'badge-yellow', utilities:'badge-gray', healthcare:'badge-red', entertainment:'badge-blue', shopping:'badge-yellow', education:'badge-green', other:'badge-gray' };

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = () => expenseAPI.list().then(({ data }) => setItems(data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (item) => {
    setForm({ title: item.title, amount: item.amount, category: item.category, description: item.description || '', date: item.date, merchant: item.merchant || '' });
    setModal(item);
  };
  const close = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modal === 'add') await expenseAPI.create(form);
      else await expenseAPI.update(modal.id, form);
      await load();
      close();
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await expenseAPI.remove(id);
    load();
  };

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);
  const total = filtered.reduce((s, i) => s + parseFloat(i.amount), 0);
  const fmt = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <Layout title="Expenses">
      <div className="page-header">
        <div>
          <h2>Expenses</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Showing: <strong style={{ color: 'var(--danger)' }}>{fmt(total)}</strong></div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Expense</button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`btn btn-sm ${filter === c ? 'btn-primary' : 'btn-ghost'}`}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>💸</div>
            <p>{filter === 'all' ? 'No expenses yet.' : `No expenses in "${filter}".`}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Category</th><th>Merchant</th><th>Date</th><th>Amount</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.title}</strong></td>
                    <td><span className={`badge ${BADGE[item.category] || 'badge-gray'}`}>{item.category_display}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.merchant || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.date}</td>
                    <td><strong style={{ color: 'var(--danger)' }}>{fmt(item.amount)}</strong></td>
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
        <Modal title={modal === 'add' ? 'Add Expense' : 'Edit Expense'} onClose={close} onSubmit={handleSubmit} loading={loading}>
          <div className="form-group">
            <label>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Grocery run" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount *</label>
              <input type="number" step="0.01" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Merchant</label>
              <input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="Optional" />
            </div>
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
