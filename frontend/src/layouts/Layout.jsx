import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifCount } from '../context/NotifContext';
import { BrandLogo, RupeeBagIcon } from '../components/Logo';

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/income', icon: <RupeeBagIcon size={18} />, label: 'Income' },
  { to: '/expenses', icon: '💸', label: 'Expenses' },
  { to: '/budgets', icon: '📋', label: 'Budgets' },
  { to: '/savings', icon: '🎯', label: 'Savings Goals' },
  { to: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
  { to: '/reports', icon: '📈', label: 'Reports' },
  { to: '/profile', icon: '👤', label: 'Profile' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const unread = useNotifCount();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const closeDropdown = () => setDropdownOpen(false);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [dropdownOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const toggleTheme = (e) => {
    if (e) e.stopPropagation();
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => { logout(); navigate('/login'); };


  const navItems = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    ...(user?.role === 'admin' ? [{ to: '/admin-dashboard', icon: '👑', label: 'Admin Panel' }] : []),
    { to: '/income', icon: <RupeeBagIcon size={18} />, label: 'Income' },
    { to: '/expenses', icon: '💸', label: 'Expenses' },
    { to: '/budgets', icon: '📋', label: 'Budgets' },
    { to: '/savings', icon: '🎯', label: 'Savings Goals' },
    { to: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
    { to: '/reports', icon: '📈', label: 'Reports' },
    { to: '/profile', icon: '👤', label: 'Profile' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <BrandLogo size={22} fontSize={18} />
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-right">
            <button
              onClick={() => navigate('/notifications')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                marginRight: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '50%',
                transition: 'background-color 0.2s',
                position: 'relative',
              }}
              title="Notifications"
              className="theme-toggle-btn"
            >
              🔔
              {unread > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: 9,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {unread}
                </span>
              )}
            </button>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                marginRight: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '50%',
                transition: 'background-color 0.2s',
              }}
              title="Toggle Dark Mode"
              className="theme-toggle-btn"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div 
              className="profile-menu-trigger" 
              onClick={toggleDropdown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                position: 'relative',
                transition: 'background-color 0.2s',
                userSelect: 'none',
              }}
            >
              <div className="user-avatar" style={{ margin: 0 }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.username?.[0]?.toUpperCase()
                )}
              </div>
              <div className="profile-menu-text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, lineHeight: 1.2 }}>{user?.username}</span>
                  {user?.role && (
                    <span style={{ fontSize: 9, color: user.role === 'student' ? 'var(--primary)' : user.role === 'premium' ? 'var(--success)' : 'var(--danger)', fontWeight: 700, textTransform: 'uppercase', marginTop: 1, letterSpacing: '0.04em' }}>
                      {user.role === 'student' ? 'Student' : user.role === 'premium' ? 'Premium' : 'Admin'}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.7 }}>▼</span>
              </div>

              {dropdownOpen && (
                <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{user?.username}</span>
                      {user?.role && (
                        <span className={`badge ${user.role === 'student' ? 'badge-role badge-blue' : user.role === 'premium' ? 'badge-role badge-green' : 'badge-role badge-red'}`} style={{ fontSize: 8, padding: '1px 5px', fontWeight: 800, textTransform: 'uppercase' }}>
                          {user.role === 'student' ? 'Student' : user.role === 'premium' ? 'Premium' : 'Admin'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user?.email || 'Active User'}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <NavLink to="/profile" className="dropdown-item">
                    👤 Profile settings
                  </NavLink>
                  <NavLink to="/settings" className="dropdown-item">
                    ⚙️ Settings
                  </NavLink>
                  <button className="dropdown-item" onClick={toggleTheme}>
                    {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
