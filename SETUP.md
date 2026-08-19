# BudgetBuddy Setup & Deployment Guide 🚀

This document provides complete, step-by-step instructions to configure, install, and run **BudgetBuddy** locally on your machine.

---

## 📋 Prerequisites
Ensure you have the following software installed on your system before proceeding:
* **Python**: Version `3.9` or higher
* **Node.js**: Version `16` or higher
* **PostgreSQL** (Optional, but recommended for production): Local server active on port `5432`

---

## 🛢️ Database Configuration

BudgetBuddy is pre-configured to easily switch between **SQLite** (for simple local development) and **PostgreSQL** (for production deployments).

### Option A: SQLite (Quick Setup)
No installation needed! In the `backend/.env` file, simply configure:
```ini
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

### Option B: PostgreSQL (Active Production Database)
1. Open your PostgreSQL console and create a new database:
   ```sql
   CREATE DATABASE budgetbuddy;
   ```
2. Configure the database credentials in `backend/.env`:
   ```ini
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=budgetbuddy
   DB_USER=postgres
   DB_PASSWORD=your-postgresql-password
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```

---

## 🐍 Backend Installation & Launch

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```
2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   ```
3. **Activate the Virtual Environment**:
   * **Windows (PowerShell/CMD)**:
     ```bash
     venv\Scripts\activate
     ```
   * **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
4. **Install Required Packages**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Run Database Migrations**:
   ```bash
   python manage.py migrate
   ```
6. **Create a Superuser (Admin Dashboard Access)**:
   ```bash
   python manage.py createsuperuser
   ```
7. **Start the Development Server**:
   ```bash
   python manage.py runserver
   ```
   *The Django backend API server will start on `http://127.0.0.1:8000`.*

### 🐳 Alternative: Run Backend via Docker
If you have Docker installed, you can build and run the backend container locally:
1. **Build the Docker Image**:
   ```bash
   docker build -t budgetbuddy-backend backend/
   ```
2. **Run the Container**:
   ```bash
   docker run -p 8000:10000 --env PORT=10000 --env-file backend/.env budgetbuddy-backend
   ```

---

## 💻 Frontend Installation & Launch

1. **Navigate to the Frontend Directory**:
   ```bash
   cd frontend
   ```
2. **Install Node.js Packages**:
   ```bash
   npm install
   ```
3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   *The React client will launch on `http://localhost:5173`.*

---

## 🧪 Testing Suites

### 1. Backend Python Unit Tests (68 Tests)
To run backend unit tests verifying endpoints, signal alerts, and SMTP handlers:
```bash
cd backend
python manage.py test
```

### 2. Frontend Playwright E2E Tests (7 Tests)
Playwright validates full login/logout, CRUD operations, budget thresholds, and savings deposit milestones in a Chromium driver sandbox.

* **First-time Playwright setup** (Downloads browser binaries):
  ```bash
  cd frontend
  npx playwright install chromium
  ```
* **Run Tests (Headless Mode)**:
  ```bash
  npx playwright test
  ```
* **Run Tests (Interactive UI Mode)**:
  ```bash
  npx playwright test --ui
  ```
* **View HTML Report**:
  ```bash
  npx playwright show-report
  ```

---

## 🔌 Unified API Endpoints Guide

| Module | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Authentication** | `POST` | `/api/auth/register/` | Create a new user account |
| | `POST` | `/api/auth/login/` | Retrieve JWT access and refresh tokens |
| | `POST` | `/api/auth/token/refresh/` | Refresh expired JWT access token |
| | `POST` | `/api/auth/logout/` | Blacklist active JWT refresh token |
| | `POST` | `/api/auth/reset-password/confirm/` | Confirm password reset via email link |
| | `POST` | `/api/auth/oauth2/google/` | Log in using Google OAuth Credentials |
| | `POST` | `/api/auth/oauth2/github/` | Log in using GitHub OAuth Credentials |
| **Profile** | `GET` | `/api/profile/` | Fetch current user preference settings |
| | `PATCH` | `/api/profile/me/` | Update bio, avatar, and currency settings |
| **Incomes** | `GET` | `/api/incomes/` | List income logs |
| | `POST` | `/api/incomes/` | Add a new income transaction |
| | `DELETE`| `/api/incomes/{id}/` | Delete an income log |
| **Expenses** | `GET` | `/api/expenses/` | List expense logs |
| | `POST` | `/api/expenses/` | Add a new categorized expense |
| **Budgets** | `GET` | `/api/budgets/` | List target category budgets |
| | `POST` | `/api/budgets/` | Set a category limit |
| **Savings Goals** | `POST` | `/api/savings-goals/` | Create goal target |
| | `POST` | `/api/savings-goals/{id}/deposit/` | Deposit funds towards savings goal |
| **Notifications**| `GET` | `/api/notifications/` | Retrieve priority inbox alerts |
| **Reports** | `GET` | `/api/reports/combined-summary/?export=csv` | Stream combined statement to CSV format |
| | `GET` | `/api/reports/combined-summary/?export=excel` | Stream combined statement to Excel format |
| | `GET` | `/api/reports/monthly-financial/{id}/export-excel/` | Export monthly report directly to Excel format |
| **Analytics** | `GET` | `/api/analytics/dashboard/` | Consolidate metrics, trends, and charts |

---

## 🛠️ Troubleshooting

### 1. Port is Already in Use
* **Django Backend**: Run server on a custom port if 8000 is occupied:
  ```bash
  python manage.py runserver 8001
  ```
* **React Frontend**: Configure Vite to run on custom port:
  ```bash
  npm run dev -- --port 5174
  ```

### 2. CORS Block Errors
Verify that your backend `.env` file lists the exact frontend URL inside `CORS_ALLOWED_ORIGINS` (e.g. `CORS_ALLOWED_ORIGINS=http://localhost:5173`).

### 3. Clear/Reset Local Databases
To start with a fresh database:
1. Delete the active database:
   * **SQLite**: Delete the file `db.sqlite3`.
   * **PostgreSQL**: Drop database (`DROP DATABASE budgetbuddy;`) and create it again.
2. Re-run migrations and create a superuser:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```
