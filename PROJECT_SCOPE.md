# BudgetBuddy — Project Scope & User Roles

## Project Overview
BudgetBuddy is a personal finance management application that helps users track income, expenses, set budgets, manage savings goals, and generate financial reports. The system provides notifications to keep users informed about their financial health.

## User Roles

### 1. Unauthenticated User (Visitor)
- Can register a new account
- Can log in to existing account
- No access to any financial data

### 2. Regular User (Authenticated)
- Full CRUD on own incomes and expenses
- Create and manage budgets per category
- Set savings goals and track progress
- View financial reports and summaries
- Receive notifications (budget alerts, goal milestones)
- Manage personal profile settings

### 3. Admin User (Django Admin)
- All Regular User permissions
- Access Django admin panel
- Manage all users and their data
- System-wide configuration

## Core Features
1. **Income Tracking** — Log and categorize income sources
2. **Expense Management** — Record and categorize expenses
3. **Budget Planning** — Set category-wise budgets with period tracking
4. **Savings Goals** — Define targets and track progress
5. **Notifications** — Alerts for overspending, goal achievements
6. **Reports** — Income/expense summaries, budget vs actual analysis

## Tech Stack
- **Backend:** Django 6 + Django REST Framework
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Auth:** JWT (djangorestframework-simplejwt)
- **Frontend:** React 19 + Vite
