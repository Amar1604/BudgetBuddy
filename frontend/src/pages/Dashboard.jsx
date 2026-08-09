import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { analyticsAPI } from '../services/services';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#19FFD8', '#8673FF'];

export default function Dashboard() {
  const { user } = useAuth();
  const pref = user?.currency_preference || 'USD';
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsAPI.getDashboard().then((res) => {
      const summary = res.data.financial_summary;
      const budgetUsageList = res.data.budget_usage || [];
      const savingsGoalsList = res.data.active_savings_goals || [];
      const categoryAnalysisList = res.data.category_analysis || [];
      const recentTransactionsList = res.data.recent_transactions || [];

      const totalIncome = summary.total_income;
      const totalExpenses = summary.total_expense;
      const activeBudgets = budgetUsageList.length;
      const activeGoals = savingsGoalsList.length;

      // Filter recent expenses
      const recentExpenses = recentTransactionsList
        .filter((t) => t.type === 'expense')
        .slice(0, 5);

      // Pie chart data
      const pieData = categoryAnalysisList.map((cat) => ({
        name: cat.category_display,
        value: cat.total_amount,
      }));

      // Bar chart data
      const barData = [
        { name: 'Summary', Income: totalIncome, Expenses: totalExpenses },
      ];

      setData({
        totalIncome,
        totalExpenses,
        activeBudgets,
        activeGoals,
        recentExpenses,
        budgetUsage: budgetUsageList.slice(0, 4),
        pieData,
        barData,
      });
    }).catch((err) => {
      console.error("Dashboard fetch error:", err);
      setData({
        totalIncome: 0,
        totalExpenses: 0,
        activeBudgets: 0,
        activeGoals: 0,
        recentExpenses: [],
        budgetUsage: [],
        pieData: [],
        barData: [{ name: 'Summary', Income: 0, Expenses: 0 }],
        error: "Server connection failed."
      });
    });
  }, []);



  const fmt = (n) => formatCurrency(n, pref);


  return (
    <Layout title="Dashboard">
      {!data ? (
        <div className="loading-screen">Loading…</div>
      ) : (
        <>
          {data.error && (
            <div style={{
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              marginBottom: 16,
              fontSize: 14,
              border: '1px solid var(--danger)'
            }}>
              ⚠️ {data.error} Please make sure your backend Django server is running (`python manage.py runserver`).
            </div>
          )}
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

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Pie Chart: Category Breakdown */}
            <div className="card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 10 }}><strong>Expense Allocation</strong></div>
              {data.pieData.length === 0 ? (
                <div className="empty-state" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p>No expenses logged yet</p></div>
              ) : (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ bottom: 20 }}>
                      <Pie
                        data={data.pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                      >
                        {data.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value, pref)} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>

                </div>
              )}
            </div>

            {/* Bar Chart: Income vs Expenses */}
            <div className="card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 10 }}><strong>Income vs Expenses</strong></div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value, pref)} />
                    <Legend />
                    <Bar dataKey="Income" fill="#4caf50" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#f44336" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
