import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { incomeAPI, expenseAPI, budgetAPI, savingsAPI } from '../api/services';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      incomeAPI.list(),
      expenseAPI.list(),
      budgetAPI.list(),
      savingsAPI.list(),
    ]).then(([inc, exp, bud, sav]) => {
      const totalIncome = inc.data.reduce((s, i) => s + parseFloat(i.amount), 0);
      const totalExpenses = exp.data.reduce((s, i) => s + parseFloat(i.amount), 0);
      const activeBudgets = bud.data.length;
      const activeGoals = sav.data.filter((g) => !g.is_completed).length;

      // recent 5 expenses
      const recentExpenses = exp.data.slice(0, 5);

      // budget usage: match expenses by category
      const budgetUsage = bud.data.map((b) => {
        const spent = exp.data
          .filter((e) => e.category === b.category)
          .reduce((s, e) => s + parseFloat(e.amount), 0);
        const pct = b.amount > 0 ? Math.min((spent / parseFloat(b.amount)) * 100, 100) : 0;
        return { ...b, spent, pct };
      }).slice(0, 4);

      setData({ totalIncome, totalExpenses, activeBudgets, activeGoals, recentExpenses, budgetUsage });
    }).catch(() => {});
  }, []);

  const fmt = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <Layout title="Dashboard">
      {!data ? (
        <div className="loading-screen">Loading…</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card green">
              <div className="stat-label">Total Income</div>
              <div className="stat-value">{fmt(data.totalIncome)}</div>
              <div className="stat-sub">All time</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value">{fmt(data.totalExpenses)}</div>
              <div className="stat-sub">All time</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Net Balance</div>
              <div className="stat-value">{fmt(data.totalIncome - data.totalExpenses)}</div>
              <div className="stat-sub">Income − Expenses</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-label">Active Goals</div>
              <div className="stat-value">{data.activeGoals}</div>
              <div className="stat-sub">{data.activeBudgets} budgets set</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Recent Expenses */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <strong>Recent Expenses</strong>
                <Link to="/expenses" style={{ fontSize: 13 }}>View all →</Link>
              </div>
              {data.recentExpenses.length === 0 ? (
                <div className="empty-state"><p>No expenses yet</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.recentExpenses.map((e) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{e.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.category_display} · {e.date}</div>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Budget Overview */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <strong>Budget Overview</strong>
                <Link to="/budgets" style={{ fontSize: 13 }}>View all →</Link>
              </div>
              {data.budgetUsage.length === 0 ? (
                <div className="empty-state"><p>No budgets set</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {data.budgetUsage.map((b) => (
                    <div key={b.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span>{b.category_display}</span>
                        <span style={{ color: b.pct >= 90 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {fmt(b.spent)} / {fmt(b.amount)}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${b.pct}%`,
                            background: b.pct >= 90 ? 'var(--danger)' : b.pct >= 70 ? 'var(--warning)' : 'var(--primary)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
