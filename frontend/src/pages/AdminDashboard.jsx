import { useEffect, useState } from 'react';
import Layout from '../layouts/Layout';
import api from '../services/axios';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/analytics/admin-stats/')
            .then((res) => {
                setStats(res.data);
            })
            .catch((err) => {
                console.error("Admin stats fetch error:", err);
                setError(err.response?.data?.detail || 'Failed to fetch admin stats.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Layout title="Admin Panel">
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <span>Loading statistics…</span>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title="Admin Panel">
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                    <h3 style={{ color: 'var(--danger)', marginBottom: 8 }}>Access Denied</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{error}</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Admin Panel">
            <div className="page-header">
                <h2>System Administration Panel</h2>
            </div>

            {/* Metrics cards grid */}
            <div className="stat-grid" style={{ marginBottom: 24 }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 20px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Accounts</span>
                    <strong style={{ fontSize: 28, color: 'var(--primary)' }}>{stats?.total_users}</strong>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 20px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Expenses Logged</span>
                    <strong style={{ fontSize: 28 }}>{stats?.total_expenses}</strong>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 20px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Incomes Logged</span>
                    <strong style={{ fontSize: 28, color: 'var(--success)' }}>{stats?.total_incomes}</strong>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 20px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Budgets Defined</span>
                    <strong style={{ fontSize: 28 }}>{stats?.total_budgets}</strong>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 20px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Savings Targets</span>
                    <strong style={{ fontSize: 28, color: 'var(--warning)' }}>{stats?.total_savings_goals}</strong>
                </div>
            </div>

            {/* Recent users table */}
            <div className="card">
                <strong style={{ fontSize: 15, display: 'block', marginBottom: 16 }}>Recent Registered Accounts</strong>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>ID</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Username</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Email</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Role</th>
                                <th style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Joined Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recent_users?.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px 12px' }}>{u.id}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.username}</td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.email}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <span className={`badge ${u.role === 'student' ? 'badge-blue' : u.role === 'premium' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 9, padding: '2px 6px', textTransform: 'uppercase' }}>
                                            {u.role === 'student' ? 'Student' : u.role === 'premium' ? 'Premium' : 'Admin'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                                        {new Date(u.date_joined).toLocaleDateString()} {new Date(u.date_joined).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
