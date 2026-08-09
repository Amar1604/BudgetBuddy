import { useEffect, useState } from 'react';
import Layout from '../layouts/Layout';
import { notificationAPI } from '../services/services';
import { useNotifRefresh } from '../context/NotifContext';

const TYPE_BADGE = {
  budget_alert: 'badge-red',
  goal_milestone: 'badge-green',
  reminder: 'badge-yellow',
  info: 'badge-blue',
};


const PRIORITY_WEIGHTS = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'priority'
  const refresh = useNotifRefresh();

  const load = () => notificationAPI.list().then(({ data }) => setItems(data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    load();
    refresh();
  };

  const markAll = async () => {
    await notificationAPI.markAllRead();
    load();
    refresh();
  };

  const remove = async (id) => {
    await notificationAPI.remove(id);
    load();
    refresh();
  };

  const unread = items.filter((n) => !n.is_read).length;

  // 1. Filter items by priority
  const filteredItems = items.filter(n => {
    if (priorityFilter === 'ALL') return true;
    return n.priority === priorityFilter;
  });

  // 2. Sort items (by priority weight or date)
  const processedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'priority') {
      const weightA = PRIORITY_WEIGHTS[a.priority] || 1;
      const weightB = PRIORITY_WEIGHTS[b.priority] || 1;
      if (weightA !== weightB) {
        return weightB - weightA; // High priority first
      }
    }
    // Fallback or default: Date descending (most recent first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <Layout title="Notifications">
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          {unread > 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unread} unread</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {unread > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all as read</button>
          )}
        </div>
      </div>

      {/* Priority Filters & Sorting Controls */}
      <div className="card" style={{ padding: 12, marginBottom: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${priorityFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPriorityFilter('ALL')}
          >
            All ({items.length})
          </button>
          <button
            className={`btn btn-sm ${priorityFilter === 'HIGH' ? 'btn-danger' : 'btn-ghost'}`}
            onClick={() => setPriorityFilter('HIGH')}
            style={priorityFilter !== 'HIGH' ? { color: 'var(--danger)' } : {}}
          >
            🔴 High ({items.filter(n => n.priority === 'HIGH').length})
          </button>
          <button
            className={`btn btn-sm ${priorityFilter === 'MEDIUM' ? 'btn-warning' : 'btn-ghost'}`}
            onClick={() => setPriorityFilter('MEDIUM')}
            style={priorityFilter !== 'MEDIUM' ? { color: 'var(--warning)' } : {}}
          >
            🟡 Medium ({items.filter(n => n.priority === 'MEDIUM').length})
          </button>
          <button
            className={`btn btn-sm ${priorityFilter === 'LOW' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPriorityFilter('LOW')}
            style={priorityFilter !== 'LOW' ? { color: 'var(--primary)' } : {}}
          >
            🔵 Low ({items.filter(n => n.priority === 'LOW').length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 13
            }}
          >
            <option value="date">Most Recent</option>
            <option value="priority">Priority (High → Low)</option>
          </select>
        </div>
      </div>

      <div className="card">
        {processedItems.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>🔔</div>
            <p>No notifications match the filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {processedItems.map((n) => {
              const accentColor = n.priority === 'HIGH' ? 'var(--danger)' : n.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--primary)';
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 12px',
                    borderLeft: `4px solid ${accentColor}`,
                    background: n.is_read ? 'transparent' : 'var(--primary-light)',
                    borderRadius: 4,
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <strong style={{ fontSize: 14 }}>{n.title}</strong>
                      <span className={`badge ${TYPE_BADGE[n.notification_type] || 'badge-gray'}`}>
                        {n.notification_type_display}
                      </span>
                      {!n.is_read && <span className="badge badge-blue">New</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignSelf: 'center' }}>
                    {!n.is_read && (
                      <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>✓ Read</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => remove(n.id)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
