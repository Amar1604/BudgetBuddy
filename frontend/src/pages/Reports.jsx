import { useEffect, useState } from 'react';
import Layout from '../layouts/Layout';
import Modal from '../components/Modal';
import { reportAPI, incomeAPI, expenseAPI, budgetAPI } from '../services/services';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const TYPES = ['income_summary', 'expense_summary', 'budget_vs_actual', 'net_worth', 'custom'];
const EMPTY = { title: '', report_type: 'expense_summary', date_range_start: '', date_range_end: '' };

export default function Reports() {
  const { user } = useAuth();
  const pref = user?.currency_preference || 'USD';
  const fmt = (n) => formatCurrency(n, pref);

  // Tabs: 'interactive' or 'saved'
  const [activeTab, setActiveTab] = useState('interactive');

  // Saved Reports State
  const [reports, setReports] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Interactive Report State
  const [filterType, setFilterType] = useState('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Load saved reports
  const loadSaved = () => reportAPI.list().then(({ data }) => setReports(data)).catch(() => {});
  
  useEffect(() => {
    loadSaved();
  }, []);

  useEffect(() => {
    const loadInteractiveData = () => {
      setLiveLoading(true);
      const params = {
        filter_type: filterType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      reportAPI.getCombinedSummary(params)
        .then(({ data }) => {
          setLiveData(data);
        })
        .catch((err) => {
          console.error("Error loading interactive summary:", err);
        })
        .finally(() => {
          setLiveLoading(false);
        });
    };

    if (activeTab === 'interactive') {
      loadInteractiveData();
    }
  }, [activeTab, filterType, startDate, endDate]);

  const handleExportCSV = async (type) => {
    setExportLoading(true);
    try {
      const params = {
        filter_type: filterType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      
      let res;
      let filename = `report_${filterType}.csv`;
      if (type === 'expenses') {
        res = await reportAPI.exportExpenseCSV(params);
        filename = `expense_report_${filterType}.csv`;
      } else {
        res = await reportAPI.exportCombinedCSV(params);
        filename = `financial_statement_${filterType}.csv`;
      }

      // Download file blob
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("CSV Export failed", err);
    } finally {
      setExportLoading(false);
    }
  };

  // Saved report generator
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
      await loadSaved();
      setModal(false);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    await reportAPI.remove(id);
    loadSaved();
  };

  return (
    <Layout title="Reports">
      <div className="page-header">
        <h2>Financial Reports</h2>
        {activeTab === 'saved' && (
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>+ Generate Report</button>
        )}
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          className={`btn ${activeTab === 'interactive' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('interactive')}
        >
          📊 Live Statement
        </button>
        <button
          className={`btn ${activeTab === 'saved' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('saved')}
        >
          📂 Saved Summaries
        </button>
      </div>

      {/* Interactive Statements Tab */}
      {activeTab === 'interactive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Filters & Export Options */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Date Filter</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                  >
                    <option value="current_month">Current Month</option>
                    <option value="previous_month">Previous Month</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {filterType === 'custom' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Start Date</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ padding: '5px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>End Date</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ padding: '5px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-outline"
                  disabled={exportLoading || liveLoading}
                  onClick={() => handleExportCSV('expenses')}
                >
                  📥 Export Expenses CSV
                </button>
                <button
                  className="btn btn-primary"
                  disabled={exportLoading || liveLoading}
                  onClick={() => handleExportCSV('combined')}
                >
                  📥 Download Full Statement (CSV)
                </button>
              </div>
            </div>
          </div>

          {liveLoading && !liveData ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading statement data...</div>
          ) : liveData ? (
            <>
              {/* Financial Summary Stat Cards */}
              <div className="stat-grid">
                <div className="stat-card green">
                  <div className="stat-label">Total Income</div>
                  <div className="stat-value">{fmt(liveData.financial_summary.total_income)}</div>
                  <div className="stat-sub">For selected period</div>
                </div>
                <div className="stat-card red">
                  <div className="stat-label">Total Expenses</div>
                  <div className="stat-value">{fmt(liveData.financial_summary.total_expense)}</div>
                  <div className="stat-sub">For selected period</div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-label">Net Balance</div>
                  <div className="stat-value">{fmt(liveData.financial_summary.current_balance)}</div>
                  <div className="stat-sub">Income - Expenses</div>
                </div>
                <div className="stat-card yellow">
                  <div className="stat-label">Remaining Budget</div>
                  <div className="stat-value">{fmt(liveData.financial_summary.remaining_budget)}</div>
                  <div className="stat-sub">{fmt(liveData.financial_summary.total_budget)} total limit</div>
                </div>
              </div>

              {/* Detail Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                
                {/* Left Side: Expense Categories & Budgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Expense Breakdown */}
                  <div className="card">
                    <strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>Expense Allocation</strong>
                    {liveData.expense_summary.length === 0 ? (
                      <div className="empty-state"><p>No expenses recorded in this period.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {liveData.expense_summary.map((item) => (
                          <div key={item.category}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                              <span>{item.category}</span>
                              <span style={{ fontWeight: 500 }}>{fmt(item.total_amount)} ({item.percentage}%)</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${item.percentage}%`,
                                  background: 'var(--danger)',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Budget Allocation vs Actual */}
                  <div className="card">
                    <strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>Budget Limits vs Spent</strong>
                    {liveData.budget_summary.length === 0 ? (
                      <div className="empty-state"><p>No budgets set for this period.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {liveData.budget_summary.map((b, idx) => {
                          const pct = b.budget_amount > 0 ? Math.min((b.actual_spent / b.budget_amount) * 100, 100) : 0;
                          return (
                            <div key={idx}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                <span>{b.category} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({b.month}/{b.year})</span></span>
                                <span style={{ color: pct >= 90 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                  {fmt(b.actual_spent)} / {fmt(b.budget_amount)}
                                </span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--primary)',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Side: Savings Goals & Latest Notifications */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Savings Goals Status */}
                  <div className="card">
                    <strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>Savings Target Report</strong>
                    {liveData.savings_summary.length === 0 ? (
                      <div className="empty-state"><p>No savings goals set.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {liveData.savings_summary.map((s, idx) => (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                              <strong>{s.goal_name}</strong>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.status}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                              <span>Progress: {s.progress_percentage}%</span>
                              <span>{fmt(s.saved_amount)} / {fmt(s.target_amount)}</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${s.progress_percentage}%`,
                                  background: s.status === 'Completed' ? 'var(--success)' : 'var(--warning)',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Latest Notifications */}
                  <div className="card">
                    <strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>Latest Alerts & Notifications</strong>
                    {liveData.latest_notifications.length === 0 ? (
                      <div className="empty-state"><p>No recent alerts.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {liveData.latest_notifications.map((n, idx) => (
                          <div key={idx} style={{ padding: '8px 12px', borderLeft: `3px solid ${n.priority === 'High' ? 'var(--danger)' : n.priority === 'Medium' ? 'var(--warning)' : 'var(--primary)'}`, background: 'var(--bg)', borderRadius: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: 13 }}>{n.title}</strong>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.created_at}</span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>Failed to load statement details.</div>
          )}
        </div>
      )}

      {/* Saved Summaries Tab */}
      {activeTab === 'saved' && (
        <>
          {reports.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div style={{ fontSize: 40 }}>📈</div>
                <p>No saved reports yet. Generate your first custom financial report!</p>
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

                      {r.data.budgetVsActual && r.data.budgetVsActual.length > 0 && (
                        <div style={{ marginTop: 16, marginBottom: 20 }}>
                          <strong style={{ fontSize: 13 }}>Budget vs Actual Spend</strong>
                          <div style={{ width: '100%', height: 250, marginTop: 8 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={r.data.budgetVsActual} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value) => formatCurrency(value, pref)} />
                                <Legend />
                                <Bar dataKey="budget" fill="#2196f3" name="Budget Limit" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="spent" fill="#e91e63" name="Actual Spent" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {Object.keys(r.data.byCategory || {}).length > 0 && (
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

                      {Object.keys(r.data.bySource || {}).length > 0 && (
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
        </>
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
