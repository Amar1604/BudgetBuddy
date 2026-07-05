import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifCount } from '../context/NotifContext';

const NAV = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/income', icon: '💰', label: 'Income' },
  { to: '/expenses', icon: '💸', label: 'Expenses' },
  { to: '/budgets', icon: '📋', label: 'Budgets' },
  { to: '/savings', icon: '🎯', label: 'Savings Goals' },
  { to: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
  { to: '/reports', icon: '📈', label: 'Reports' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const unread = useNotifCount();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>💰 BudgetBuddy</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="icon">{icon}</span>
              {label}
              {badge && unread > 0 && <span className="nav-badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%' }}>
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-right">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.username}</span>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
