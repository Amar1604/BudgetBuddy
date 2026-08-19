# BudgetBuddy Frontend 💻

This directory contains the React client application for **BudgetBuddy**—a personal finance planning and expense management platform. Built on **React 19** and **Vite**, it utilizes vanilla CSS, custom variables, and responsive layouts to provide a clean, modern user experience.

---

## 🏗️ Folder Structure

```bash
frontend/
├── src/
│   ├── components/      # Reusable UI parts (Modal, Brand Logo, etc.)
│   ├── context/         # React Context Providers (AuthContext, NotifContext)
│   ├── layouts/         # Shared Page Wrappers (Layout, Sidebar, Navbar)
│   ├── pages/           # Application views (Dashboard, Income, Expenses, Budgets, Savings, etc.)
│   ├── services/        # Axios API clients & JWT refresh interceptors
│   ├── utils/           # Helper scripts (currency formatting, date parsing)
│   ├── App.jsx          # Route mapping and Route Guards (ProtectedRoute, PublicRoute)
│   └── main.jsx         # React DOM insertion point
├── tests/
│   └── e2e/             # Playwright End-to-End Test Suites (auth.spec.js, finance.spec.js)
├── playwright.config.js # E2E Test Suite Configurations
└── package.json         # Node.js dependencies and scripts
```

---

## 🌟 Key Features Implemented

* **📊 Dynamic Dashboard**: A consolidated viewport loading metrics, recent logs, budget status percentages, and active savings goals via a single backend API call.
* **🔐 Authentication & Protected Routes**: Fully integrated JWT Authentication with secure Axios interceptors. Automatically refreshes access tokens using `refresh_token` storage or redirects on session expiry.
* **💸 Currency Switching (INR / USD / EUR)**: Seamless integration with user preference profiles. Changing the currency preference updates symbols (e.g. **₹**, **$**, **€**) globally across charts, cards, tables, and alerts.
* **📋 Budget Indicators**: Color-coded progress bars that dynamically reflect budget usage (Green = Normal, Orange = 80-90% alert threshold, Red = Over-budget).
* **🎯 Savings Goal Deposits**: Linear progress meters with completing action buttons. Fully funded goals render a green `✓ Completed` status badge.
* **🔔 Priority Notification Inbox**: Tabs-based inbox allowing filter switching between priority levels (High, Medium, Low) and sorting by dates or importance.

---

## ⚙️ Environment Configuration

Create a `.env` file in the `frontend/` directory to configure variables:

```ini
# Production API Base URL (defaults to '/api' for unified proxy/domain deployments)
VITE_API_URL=http://localhost:8000/api
```

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   *The application will start on loopback `http://localhost:5173`.*

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🧪 E2E Testing with Playwright

We use **Playwright** to run end-to-end automation test suites validating user signup, credentials, currency preferences, CRUD actions, savings deposits, and budget breaches.

* **Install Playwright Browsers** (First-time setup):
  ```bash
  npx playwright install chromium
  ```
* **Run Tests (Headless)**:
  ```bash
  npx playwright test
  ```
* **Run Tests (Interactive UI)**:
  ```bash
  npx playwright test --ui
  ```
* **View Last HTML Report**:
  ```bash
  npx playwright show-report
  ```
