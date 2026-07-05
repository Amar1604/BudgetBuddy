import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { reportAPI, incomeAPI, expenseAPI, budgetAPI } from '../api/services';

const TYPES = ['income_summary','expense_summary','budget_vs_actual','net_worth','custom'];
const EMPTY = { title: '', report_type: 'expense_summary', date_range_start: '', date_range_end: '' };

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () => reportAPI.list().then(({ data }) => setReports(data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const generateData = async (type, start, end) => {
    const [inc, exp, bud] = await Promise.all([incomeAPI.list(), expenseAPI.list(), budgetAPI.list()]);
    const inRange = (date) => (!start || date >= start) && (!end || date <= end);

    const incomes = inc.data.filter((i) => inRange(i.date));
    const expenses = exp.data.filter((e) => inRange(e.date));

    const totalIncome = incomes.reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category_display] = (acc[e.category_display] || 0) + parseFloat(e.amount);
      return acc;
    }, {});

    const bySource = incomes.reduce((acc, i) => {
      acc[i.source_display] = (acc[i.source_display] || 0) + parseFloat(i.amount);
      return acc;
    }, {});

    const budgetVsActual = bud.data.map((b) => ({
      category: b.category_display,
      budget: parseFloat(b.amount),
      spent: expenses.filter((e) => e.category === b.category).reduce((s, e) => s + parseFloat(e.amount), 0),
    }));

    return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, byCategory, bySource, budgetVsActual };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await generateData(form.report_type, form.date_range_start, form.date_range_end);
      await reportAPI.create({ ...form, data });
      await load();
      setModal(false);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    await reportAPI.remove(id);
    load();
  };

  const fmt = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <Layout title="Reports">
      <div className="page-header">
        <h2>Financial Reports</h2>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>+ Generate Report</button>
      </div>

      {reports.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>📈</div>
            <p>No reports yet. Generate your first financial report!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 15 }}>{r.title}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {r.report_type_display} · {r.date_range_start} → {r.date_range_end} · Generated {new Date(r.generated_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                    {expanded === r.id ? 'Hide' : 'View'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
              </div>

              {expanded === r.id && r.data && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div className="stat-grid" style={{ marginBottom: 16 }}>
                    <div className="stat-card green">
                      <div className="stat-label">Total Income</div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{fmt(r.data.totalIncome)}</div>
                    </div>
                    <div className="stat-card red">
                      <div className="stat-label">Total Expenses</div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{fmt(r.data.totalExpenses)}</div>
                    </div>
                    <div className="stat-card blue">
                      <div className="stat-label">Net Balance</div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{fmt(r.data.netBalance)}</div>
                    </div>
                  </div>

                  {Object.keys(r.data.byCategory).length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ fontSize: 13 }}>Expenses by Category</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {Object.entries(r.data.byCategory).map(([cat, amt]) => (
                          <div key={cat} style={{ background: 'var(--bg)', padding: '6px 12px', borderRadius: 6, fontSize: 13 }}>
                            {cat}: <strong style={{ color: 'var(--danger)' }}>{fmt(amt)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(r.data.bySource).length > 0 && (
                    <div>
                      <strong style={{ fontSize: 13 }}>Income by Source</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {Object.entries(r.data.bySource).map(([src, amt]) => (
                          <div key={src} style={{ background: 'var(--bg)', padding: '6px 12px', borderRadius: 6, fontSize: 13 }}>
                            {src}: <strong style={{ color: 'var(--success)' }}>{fmt(amt)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="Generate Report" onClose={() => setModal(false)} onSubmit={handleSubmit} loading={loading}>
          <div className="form-group">
            <label>Report Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. June 2025 Summary" />
          </div>
          <div className="form-group">
            <label>Report Type *</label>
            <select value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" required value={form.date_range_start} onChange={(e) => setForm({ ...form, date_range_start: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" required value={form.date_range_end} onChange={(e) => setForm({ ...form, date_range_end: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
