-- ============================================================
-- BudgetBuddy - Neon DB (PostgreSQL) Migration Schema
-- Generated from Django models
-- ============================================================
-- Run this SQL against your Neon DB to create all tables.
-- After running, configure Django's settings.py to connect
-- to Neon DB using the PostgreSQL backend.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Django Built-in Tables
-- ============================================================

-- django_content_type
CREATE TABLE IF NOT EXISTS django_content_type (
    id SERIAL PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    CONSTRAINT django_content_type_app_label_model_uniq UNIQUE (app_label, model)
);

-- django_migrations
CREATE TABLE IF NOT EXISTS django_migrations (
    id BIGSERIAL PRIMARY KEY,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- django_session
CREATE TABLE IF NOT EXISTS django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data TEXT NOT NULL,
    expire_date TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS django_session_expire_date_idx ON django_session (expire_date);

-- django_admin_log
CREATE TABLE IF NOT EXISTS django_admin_log (
    id SERIAL PRIMARY KEY,
    action_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    object_id TEXT,
    object_repr VARCHAR(200) NOT NULL,
    action_flag SMALLINT NOT NULL CHECK (action_flag >= 0),
    change_message TEXT NOT NULL DEFAULT '',
    content_type_id INTEGER REFERENCES django_content_type(id) ON DELETE SET NULL,
    user_id BIGINT NOT NULL  -- FK added after users_user table creation
);

-- ============================================================
-- 2. Custom User Model (users.User extends AbstractUser)
-- ============================================================

CREATE TABLE IF NOT EXISTS users_user (
    id BIGSERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMPTZ,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    email VARCHAR(254) NOT NULL DEFAULT '',
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Custom field
    role VARCHAR(20) NOT NULL DEFAULT 'student'
        CHECK (role IN ('student', 'premium', 'admin'))
);

-- Django auth permission
CREATE TABLE IF NOT EXISTS auth_permission (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content_type_id INTEGER NOT NULL REFERENCES django_content_type(id) ON DELETE CASCADE,
    codename VARCHAR(100) NOT NULL,
    CONSTRAINT auth_permission_content_type_id_codename_uniq UNIQUE (content_type_id, codename)
);

-- Django auth group
CREATE TABLE IF NOT EXISTS auth_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

-- auth_group_permissions (M2M)
CREATE TABLE IF NOT EXISTS auth_group_permissions (
    id BIGSERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    CONSTRAINT auth_group_permissions_group_id_permission_id_uniq UNIQUE (group_id, permission_id)
);

-- users_user_groups (M2M: User <-> Group)
CREATE TABLE IF NOT EXISTS users_user_groups (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    CONSTRAINT users_user_groups_user_id_group_id_uniq UNIQUE (user_id, group_id)
);

-- users_user_user_permissions (M2M: User <-> Permission)
CREATE TABLE IF NOT EXISTS users_user_user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    CONSTRAINT users_user_user_permissions_user_id_permission_id_uniq UNIQUE (user_id, permission_id)
);

-- Now add FK from django_admin_log to users_user
ALTER TABLE django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE;

-- ============================================================
-- 3. User Profile (users.Profile)
-- ============================================================

CREATE TABLE IF NOT EXISTS users_profile (
    id BIGSERIAL PRIMARY KEY,
    bio TEXT,
    avatar VARCHAR(100),  -- ImageField stores relative path
    currency_preference VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id BIGINT NOT NULL UNIQUE REFERENCES users_user(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. Expenses (expenses.Expense)
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses_expense (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('FOOD', 'TRAVEL', 'SHOPPING', 'EDUCATION', 'ENTERTAINMENT', 'HEALTHCARE', 'BILLS', 'MISCELLANEOUS')),
    description TEXT,
    expense_date DATE NOT NULL,
    merchant VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS expenses_expense_user_id_idx ON expenses_expense (user_id);
CREATE INDEX IF NOT EXISTS expenses_expense_expense_date_idx ON expenses_expense (expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_expense_category_idx ON expenses_expense (category);

-- ============================================================
-- 5. Income (income.Income)
-- ============================================================

CREATE TABLE IF NOT EXISTS income_income (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL DEFAULT 'Income Log',
    amount NUMERIC(12, 2) NOT NULL,
    source VARCHAR(50) NOT NULL
        CHECK (source IN ('SALARY', 'POCKET_MONEY', 'SCHOLARSHIP', 'FREELANCING', 'BUSINESS', 'OTHER')),
    description TEXT,
    income_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS income_income_user_id_idx ON income_income (user_id);
CREATE INDEX IF NOT EXISTS income_income_income_date_idx ON income_income (income_date DESC);

-- ============================================================
-- 6. Budgets (budgets.Budget)
-- ============================================================

CREATE TABLE IF NOT EXISTS budgets_budget (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('FOOD', 'TRAVEL', 'SHOPPING', 'EDUCATION', 'ENTERTAINMENT', 'HEALTHCARE', 'BILLS', 'MISCELLANEOUS')),
    budget_amount NUMERIC(12, 2) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
    CONSTRAINT unique_budget_user_category_month_year UNIQUE (user_id, category, month, year)
);
CREATE INDEX IF NOT EXISTS budgets_budget_user_id_idx ON budgets_budget (user_id);

-- ============================================================
-- 7. Savings Goals (savings.SavingsGoal)
-- ============================================================

CREATE TABLE IF NOT EXISTS savings_savingsgoal (
    id BIGSERIAL PRIMARY KEY,
    goal_name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    saved_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    target_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS'
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS savings_savingsgoal_user_id_idx ON savings_savingsgoal (user_id);
CREATE INDEX IF NOT EXISTS savings_savingsgoal_target_date_idx ON savings_savingsgoal (target_date);

-- ============================================================
-- 8. Notifications (notifications.Notification)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications_notification (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL
        CHECK (notification_type IN ('budget_alert', 'goal_milestone', 'reminder', 'info')),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS notifications_notification_user_id_idx ON notifications_notification (user_id);
CREATE INDEX IF NOT EXISTS notifications_notification_created_at_idx ON notifications_notification (created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_notification_is_read_idx ON notifications_notification (is_read);

-- ============================================================
-- 9. FCM Tokens (notifications.FCMToken)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications_fcmtoken (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS notifications_fcmtoken_user_id_idx ON notifications_fcmtoken (user_id);

-- ============================================================
-- 10. Reports (reports.Report)
-- ============================================================

CREATE TABLE IF NOT EXISTS reports_report (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL
        CHECK (report_type IN ('income_summary', 'expense_summary', 'budget_vs_actual', 'net_worth', 'custom')),
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    data JSONB,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS reports_report_user_id_idx ON reports_report (user_id);
CREATE INDEX IF NOT EXISTS reports_report_generated_at_idx ON reports_report (generated_at DESC);

-- ============================================================
-- 11. Simple JWT Token Blacklist
-- ============================================================

CREATE TABLE IF NOT EXISTS token_blacklist_outstandingtoken (
    id BIGSERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    user_id BIGINT REFERENCES users_user(id) ON DELETE SET NULL,
    jti VARCHAR(255) NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS token_blacklist_outstandingtoken_user_id_idx ON token_blacklist_outstandingtoken (user_id);
CREATE INDEX IF NOT EXISTS token_blacklist_outstandingtoken_jti_idx ON token_blacklist_outstandingtoken (jti);

CREATE TABLE IF NOT EXISTS token_blacklist_blacklistedtoken (
    id BIGSERIAL PRIMARY KEY,
    blacklisted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    token_id BIGINT NOT NULL UNIQUE REFERENCES token_blacklist_outstandingtoken(id) ON DELETE CASCADE
);

COMMIT;

-- ============================================================
-- DONE! All tables created for Neon DB.
--
-- Next steps:
-- 1. Run this SQL in Neon DB's SQL Editor or via psql.
-- 2. Update your .env with Neon DB credentials:
--      DB_ENGINE=django.db.backends.postgresql
--      DB_NAME=your_neon_db_name
--      DB_USER=your_neon_user
--      DB_PASSWORD=your_neon_password
--      DB_HOST=your-project.us-east-2.aws.neon.tech
--      DB_PORT=5432
-- 3. Install psycopg2:  pip install psycopg2-binary
-- 4. Run: python manage.py migrate --fake
--    (since tables already exist from this SQL)
-- ============================================================
