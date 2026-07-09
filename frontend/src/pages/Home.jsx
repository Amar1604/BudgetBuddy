import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--card-bg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 700 }}>
          <span>💰</span>
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>BudgetBuddy</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/login" className="btn" style={{
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s'
          }}>
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary" style={{
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            backgroundColor: 'var(--primary)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            transition: 'all 0.2s'
          }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1 }}>
        <section style={{
          padding: '80px 20px',
          textAlign: 'center',
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24
        }}>
          <div style={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--primary)',
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Welcome to Personal Finance Simplified
          </div>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.15,
            margin: 0,
            background: 'linear-gradient(135deg, var(--text), var(--text-muted))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Master Your Money,<br />Build Your Future.
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            maxWidth: 640,
            lineHeight: 1.6,
            margin: 0
          }}>
            BudgetBuddy helps you track expenses, manage budgets, set savings goals, and visualize your financial health—all in one beautiful interface.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <Link to="/register" style={{
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: 8,
              backgroundColor: 'var(--primary)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.25)';
            }}>
              Start Free Trial
            </Link>
            <Link to="/login" style={{
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text)',
              fontSize: 16,
              fontWeight: 600,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}>
              Request Demo
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section style={{
          padding: '60px 40px 100px',
          backgroundColor: 'var(--card-bg)',
          borderTop: '1px solid var(--border)'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: 48 }}>
              Features designed to keep you on track
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1-fraction))',
              gap: 24
            }}>
              {/* Feature 1 */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 28 }}>💰</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Income Tracking</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  Log and monitor all your income sources. Categorize them and see your total earnings growth month over month.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 28 }}>💸</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Expense Management</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  Record daily purchases, categorize transactions, and inspect spending breakdowns to identify saving opportunities.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 28 }}>📋</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Smart Budgets</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  Establish monthly budgets for categories (e.g. food, rent, travel) and receive alerts when you approach limits.
                </p>
              </div>
              {/* Feature 4 */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 28 }}>🎯</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Savings Goals</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  Set aside money for specific milestones (vacation, emergency fund, tech purchases) and trace your completion progress.
                </p>
              </div>
              {/* Feature 5 */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 28 }}>📈</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Reports & Analytics</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  Generate and view comprehensive monthly financial summaries, using interactive charts to understand trends.
                </p>
              </div>
              {/* Feature 6 */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 28 }}>🔔</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Real-time Notifications</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  Stay informed with warnings for budget overspending, reminders for savings targets, and confirmation of updates.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '30px 40px',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        fontSize: 13,
        color: 'var(--text-muted)'
      }}>
        &copy; {new Date().getFullYear()} BudgetBuddy. All rights reserved. Built for Milestone 1 Presentation.
      </footer>
    </div>
  );
}
