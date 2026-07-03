# BudgetBuddy - Setup & Installation Guide

## Overview
BudgetBuddy is a personal finance management application built with Django REST Framework (backend) and React (frontend).

## Prerequisites
- Python 3.9+
- Node.js 16+
- pip (Python package manager)
- npm (Node package manager)

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
```

### 3. Activate Virtual Environment
**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Environment Configuration
The `.env` file is already created with default development settings. For production, update:
- `SECRET_KEY` - Change to a secure random key
- `DEBUG` - Set to `False` for production
- `ALLOWED_HOSTS` - Add your domain
- Database credentials if using PostgreSQL

### 6. Run Migrations
```bash
python manage.py migrate
```

### 7. Create Superuser (Admin)
```bash
python manage.py createsuperuser
```
Follow the prompts to create an admin account.

### 8. Start Backend Server
```bash
python manage.py runserver
```
The backend will be available at `http://127.0.0.1:8000`

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

---

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login (returns JWT tokens)
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user info

### Profile
- `GET /api/profile/` - Get user profile
- `PATCH /api/profile/{id}/` - Update user profile

### Incomes
- `GET /api/incomes/` - List all incomes
- `POST /api/incomes/` - Create new income
- `GET /api/incomes/{id}/` - Get specific income
- `PUT/PATCH /api/incomes/{id}/` - Update income
- `DELETE /api/incomes/{id}/` - Delete income

### Expenses
- `GET /api/expenses/` - List all expenses
- `POST /api/expenses/` - Create new expense
- `GET /api/expenses/{id}/` - Get specific expense
- `PUT/PATCH /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense

### Budgets
- `GET /api/budgets/` - List all budgets
- `POST /api/budgets/` - Create new budget
- `GET /api/budgets/{id}/` - Get specific budget
- `PUT/PATCH /api/budgets/{id}/` - Update budget
- `DELETE /api/budgets/{id}/` - Delete budget

### Savings Goals
- `GET /api/savings-goals/` - List all savings goals
- `POST /api/savings-goals/` - Create new savings goal
- `GET /api/savings-goals/{id}/` - Get specific goal
- `PUT/PATCH /api/savings-goals/{id}/` - Update goal
- `DELETE /api/savings-goals/{id}/` - Delete goal

### Notifications
- `GET /api/notifications/` - List all notifications
- `GET /api/notifications/{id}/` - Get specific notification
- `PATCH /api/notifications/{id}/` - Mark as read

### Reports
- `GET /api/reports/` - List all reports
- `POST /api/reports/` - Create new report
- `GET /api/reports/{id}/` - Get specific report

---

## Testing Authentication Flow

### 1. Register a User
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### 2. Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

Response will include `access` and `refresh` tokens.

### 3. Use Access Token
```bash
curl -X GET http://127.0.0.1:8000/api/auth/me/ \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Database Switching

### Using SQLite (Default - Development)
Already configured in `.env`

### Using PostgreSQL (Production)
1. Install PostgreSQL
2. Create database: `createdb budgetbuddy`
3. Update `.env`:
   ```
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=budgetbuddy
   DB_USER=postgres
   DB_PASSWORD=your-password
   DB_HOST=localhost
   DB_PORT=5432
   ```
4. Run migrations: `python manage.py migrate`

---

## Admin Panel
Access Django admin panel at `http://127.0.0.1:8000/admin/` with superuser credentials.

---

## Troubleshooting

### Port Already in Use
Backend: `python manage.py runserver 8001`
Frontend: `npm run dev -- --port 5174`

### CORS Issues
Ensure `CORS_ALLOWED_ORIGINS` in `.env` includes your frontend URL.

### Migration Issues
```bash
python manage.py migrate --run-syncdb
```

### Clear Database
```bash
rm db.sqlite3
python manage.py migrate
```

---

## Project Structure
```
BudgetBuddy/
├── backend/
│   ├── config/          # Django settings & URLs
│   ├── users/           # User authentication & profile
│   ├── income/          # Income tracking
│   ├── expenses/        # Expense tracking
│   ├── budgets/         # Budget management
│   ├── savings/         # Savings goals
│   ├── notifications/   # Notifications
│   ├── reports/         # Financial reports
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios configuration
│   │   ├── context/     # React context (auth)
│   │   ├── pages/       # React pages
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
```

---

## Next Steps
1. Run migrations: `python manage.py migrate`
2. Start backend: `python manage.py runserver`
3. Start frontend: `npm run dev`
4. Test authentication in UI
5. Build out feature pages in frontend
