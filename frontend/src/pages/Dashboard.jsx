import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header>
        <h1>BudgetBuddy</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main>
        <h2>Dashboard</h2>
        <p>Your personal finance dashboard is ready.</p>
        <div className="card-grid">
          <div className="card">Incomes</div>
          <div className="card">Expenses</div>
          <div className="card">Budgets</div>
          <div className="card">Savings Goals</div>
        </div>
      </main>
    </div>
  );
}
