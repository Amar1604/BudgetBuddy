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

export default function Notifications() {
  const [items, setItems] = useState([]);
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

  return (
    <Layout title="Notifications">
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          {unread > 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unread} unread</div>}
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost" onClick={markAll}>Mark all as read</button>
        )}
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>🔔</div>
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((n, i) => (
              <div
                key={n.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  background: n.is_read ? 'transparent' : 'var(--primary-light)',
                  borderRadius: 6, paddingLeft: n.is_read ? 0 : 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <strong style={{ fontSize: 14 }}>{n.title}</strong>
                    <span className={`badge ${TYPE_BADGE[n.notification_type] || 'badge-gray'}`}>
                      {n.notification_type_display}
                    </span>
                    {!n.is_read && <span className="badge badge-blue">New</span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{n.message}</p>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!n.is_read && (
                    <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>✓ Read</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(n.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
