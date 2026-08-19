import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { analyticsAPI } from '../services/services';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#19FFD8', '#8673FF'];

export default function Dashboard() {
  const { user } = useAuth();
  const pref = user?.currency_preference || 'INR';
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsAPI.getDashboard().then((res) => {
      const summary = res.data.financial_summary;
      const budgetUsageList = res.data.budget_usage || [];
      const savingsGoalsList = res.data.active_savings_goals || [];
      const categoryAnalysisList = res.data.category_analysis || [];
      const recentTransactionsList = res.data.recent_transactions || [];
      const monthlyTrendList = res.data.monthly_trend || [];
      const latestNotificationsList = res.data.latest_notifications || [];

      const totalIncome = summary.total_income;
      const totalExpenses = summary.total_expense;
      const activeBudgets = budgetUsageList.length;
      const activeGoals = savingsGoalsList.length;

      // Slice recent combined transactions
      const recentTransactions = recentTransactionsList.slice(0, 5);

      // Pie chart data
      const pieData = categoryAnalysisList.map((cat) => ({
        name: cat.category_display,
        value: cat.total_amount,
      }));

      // Bar chart data
      const barData = [
        { name: 'Summary', Income: totalIncome, Expenses: totalExpenses },
      ];

      // Line chart data
      const lineData = monthlyTrendList.map((item) => ({
        name: `${item.month_name.slice(0, 3)} ${item.year}`,
        Amount: item.total_amount,
      }));

      setData({
        totalIncome,
        totalExpenses,
        activeBudgets,
        activeGoals,
        recentTransactions,
        budgetUsage: budgetUsageList.slice(0, 4),
        pieData,
        barData,
        lineData,
        activeSavingsGoals: savingsGoalsList.slice(0, 4),
        latestNotifications: latestNotificationsList.slice(0, 5),
      });
    }).catch((err) => {
      console.error("Dashboard fetch error:", err);
      setData({
        totalIncome: 0,
        totalExpenses: 0,
        activeBudgets: 0,
        activeGoals: 0,
        recentTransactions: [],
        budgetUsage: [],
        pieData: [],
        barData: [{ name: 'Summary', Income: 0, Expenses: 0 }],
        lineData: [],
        activeSavingsGoals: [],
        latestNotifications: [],
        error: "Server connection failed."
      });
    });
  }, []);



  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-md)',
      color: 'var(--text)',
      fontSize: '13px',
      fontFamily: 'inherit',
      padding: '8px 12px'
    },
    itemStyle: {
      color: 'var(--text)',
      fontWeight: '500'
    },
    labelStyle: {
      color: 'var(--text-muted)',
      fontWeight: '600',
      marginBottom: '4px'
    }
  };

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
          <div className="dashboard-grid" style={{ marginBottom: 16 }}>
            {/* Line Chart: Monthly Expense Trend */}
            <div className="card" style={{ height: 320, display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
              <div style={{ marginBottom: 10 }}><strong>Monthly Expense Trends</strong></div>
              {data.lineData.length === 0 ? (
                <div className="empty-state" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p>No historical monthly trends found.</p></div>
              ) : (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip {...tooltipStyle} formatter={(value) => formatCurrency(value, pref)} />
                      <Legend />
                      <Line type="monotone" dataKey="Amount" stroke="#AF19FF" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pie Chart: Category Breakdown */}
            <div className="card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 10 }}><strong>Expense Allocation</strong></div>
              {data.pieData.length === 0 ? (
                <div className="empty-state" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><p>No expenses logged yet</p></div>
              ) : (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height={240}>
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
                      <Tooltip {...tooltipStyle} formatter={(value) => formatCurrency(value, pref)} />
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
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(128, 128, 128, 0.08)', radius: 8 }} formatter={(value) => formatCurrency(value, pref)} />
                    <Legend />
                    <Bar dataKey="Income" fill="#4caf50" radius={[4, 4, 0, 0]} activeBar={{ fill: '#81c784', stroke: '#4caf50', strokeWidth: 1 }} />
                    <Bar dataKey="Expenses" fill="#f44336" radius={[4, 4, 0, 0]} activeBar={{ fill: '#e57373', stroke: '#f44336', strokeWidth: 1 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Recent Transactions */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <strong>Recent Transactions</strong>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to="/income" style={{ fontSize: 12 }}>Income</Link>
                  <span style={{ color: 'var(--border)' }}>|</span>
                  <Link to="/expenses" style={{ fontSize: 12 }}>Expenses</Link>
                </div>
              </div>
              {data.recentTransactions.length === 0 ? (
                <div className="empty-state"><p>No transactions logged yet</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.recentTransactions.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.category_display} · {t.date}</div>
                      </div>
                      <span style={{ fontWeight: 600, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </span>
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

            {/* Savings Goals Progress */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <strong>Savings Progress</strong>
                <Link to="/savings" style={{ fontSize: 13 }}>View all →</Link>
              </div>
              {data.activeSavingsGoals.length === 0 ? (
                <div className="empty-state"><p>No active savings goals found.</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {data.activeSavingsGoals.map((g) => {
                    const pct = parseFloat(g.progress_percentage || 0);
                    return (
                      <div key={g.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span>{g.goal_name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{fmt(g.saved_amount)} / {fmt(g.target_amount)}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 100 ? 'var(--success)' : 'var(--primary)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Alerts */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <strong>Recent Alerts & Reminders</strong>
                <Link to="/notifications" style={{ fontSize: 13 }}>Inbox →</Link>
              </div>
              {data.latestNotifications.length === 0 ? (
                <div className="empty-state"><p>No recent alerts.</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.latestNotifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '8px 10px',
                      borderLeft: `3px solid ${n.priority === 'High' ? 'var(--danger)' : n.priority === 'Medium' ? 'var(--warning)' : 'var(--primary)'}`,
                      backgroundColor: 'var(--bg)',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      <div className="dashboard-notif-header">
                        <span>{n.title}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</div>
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
