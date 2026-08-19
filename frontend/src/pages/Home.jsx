import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo, RupeeBagIcon } from '../components/Logo';

export default function Home() {
  const { user, logout } = useAuth();

  const [dark, setDark] = useState(() => {
    return localStorage.getItem('home-theme') === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('home-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('home-theme', 'light');
    }
  }, [dark]);

  const toggleTheme = () => setDark(d => !d);

  const features = [
    { icon: <RupeeBagIcon size={30} />, title: 'Income Tracking', desc: 'Log and monitor all your income sources. See earnings growth month over month.' },
    { icon: '\u{1F4B8}', title: 'Expense Management', desc: 'Record daily purchases, categorize transactions, and identify saving opportunities.' },
    { icon: '\u{1F4CB}', title: 'Smart Budgets', desc: 'Set monthly budgets per category and receive alerts when you approach limits.' },
    { icon: '\u{1F3AF}', title: 'Savings Goals', desc: 'Save for milestones like vacations or emergency funds and track your progress.' },
    { icon: '\u{1F4C8}', title: 'Reports & Analytics', desc: 'View financial summaries with interactive charts to understand trends.' },
    { icon: '\u{1F514}', title: 'Real-time Notifications', desc: 'Get budget warnings, savings reminders, and instant update confirmations.' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      {/* Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 40px',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--surface)',
        transition: 'background-color 0.3s'
      }}>
        <BrandLogo size={24} fontSize={20} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 20,
              cursor: 'pointer',
              padding: '6px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text)',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          >
            {dark ? '\u2600\uFE0F Light Mode' : '\u{1F319} Dark Mode'}
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/dashboard" style={{
                textDecoration: 'none', padding: '8px 18px', borderRadius: 6,
                backgroundColor: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 600,
                boxShadow: '0 4px 12px rgba(79,70,229,0.25)'
              }}>
                Go to Dashboard {'\u2192'}
              </Link>
              <button 
                onClick={logout}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" style={{
                textDecoration: 'none', padding: '8px 16px', borderRadius: 6,
                border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, fontWeight: 500
              }}>Sign In</Link>
              <Link to="/register" style={{
                textDecoration: 'none', padding: '8px 16px', borderRadius: 6,
                backgroundColor: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 600,
                boxShadow: '0 4px 12px rgba(79,70,229,0.2)'
              }}>Get Started</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1 }}>
        <section style={{
          padding: '90px 20px', textAlign: 'center', maxWidth: 900, margin: '0 auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24
        }}>
          <div style={{
            backgroundColor: 'rgba(79,70,229,0.12)', color: '#4f46e5',
            padding: '6px 18px', borderRadius: 20, fontSize: 12,
            fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>Personal Finance Simplified</div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, margin: 0, color: 'var(--text)' }}>
            Master Your Money,<br />Build Your Future.
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: 620, lineHeight: 1.7, margin: 0 }}>
            BudgetBuddy helps you track expenses, manage budgets, set savings goals,
            and visualize your financial health in one beautiful interface.
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {user ? (
              <Link to="/dashboard" style={{
                textDecoration: 'none', padding: '14px 32px', borderRadius: 8,
                backgroundColor: '#4f46e5', color: '#fff', fontSize: 16, fontWeight: 600,
                boxShadow: '0 6px 20px rgba(79,70,229,0.3)', transition: 'transform 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; }}>
                Open Dashboard {'\u2192'}
              </Link>
            ) : (
              <>
                <Link to="/register" style={{
                  textDecoration: 'none', padding: '14px 28px', borderRadius: 8,
                  backgroundColor: '#4f46e5', color: '#fff', fontSize: 16, fontWeight: 600,
                  boxShadow: '0 6px 20px rgba(79,70,229,0.25)', transition: 'transform 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; }}>
                  Start Free Trial
                </Link>
                <Link to="/login" style={{
                  textDecoration: 'none', padding: '14px 28px', borderRadius: 8,
                  border: '1px solid var(--border)', backgroundColor: 'var(--surface)',
                  color: 'var(--text)', fontSize: 16, fontWeight: 600, transition: 'background-color 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--bg)'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section style={{ padding: '60px 40px 100px', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', transition: 'background-color 0.3s' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: 48, color: 'var(--text)' }}>
              Features designed to keep you on track
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 24 }}>
              {features.map(f => (
                <div key={f.title} style={{
                  padding: 24, borderRadius: 12, backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                  gap: 12, transition: 'background-color 0.3s'
                }}>
                  <div style={{ fontSize: 30 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: 'var(--text)' }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: '28px 40px', textAlign: 'center', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', backgroundColor: 'var(--surface)', transition: 'background-color 0.3s' }}>
        &copy; {new Date().getFullYear()} BudgetBuddy &mdash; All rights reserved.
      </footer>
    </div>
  );
}
