# Developer Quick Reference

## 🚀 Starting the Application

### Terminal 1: Backend
```bash
cd backend
venv\Scripts\activate
python manage.py runserver
# Backend at: http://127.0.0.1:8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# Frontend at: http://localhost:5173
```

### Terminal 3: Database Admin (Optional)
```bash
cd backend
python manage.py dbshell
```

---

## 🔑 Authentication Workflow

### 1. Register User
```bash
POST /api/auth/register/
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "date_joined": "2024-01-15T10:30:00Z"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Login User
```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 3. Get Current User
```bash
GET /api/auth/me/
Authorization: Bearer <access_token>

Response:
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "date_joined": "2024-01-15T10:30:00Z"
}
```

### 4. Refresh Token
```bash
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 5. Google OAuth2 Authentication
```bash
POST /api/auth/oauth2/google/
Content-Type: application/json

{
  "token": "google-id-token-or-auth-code"
}

Response:
{
  "user": {
    "id": 1,
    "username": "google_user_12345",
    "email": "google_user_12345@example.com"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 6. GitHub OAuth2 Authentication
```bash
POST /api/auth/oauth2/github/
Content-Type: application/json

{
  "code": "github-authorization-code"
}

Response:
{
  "user": {
    "id": 2,
    "username": "github_user_67890",
    "email": "github_user_67890@example.com"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 7. Register Firebase Cloud Messaging (FCM) Device Token
```bash
POST /api/auth/register-fcm-token/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token": "fcm-device-token-string"
}

Response:
{
  "message": "Token registered successfully"
}
```

---

## 💰 Income Endpoints

### List All Incomes
```bash
GET /api/incomes/
Authorization: Bearer <access_token>

Response:
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "amount": 5000.00,
      "source": "salary",
      "source_display": "Salary",
      "description": "Monthly salary",
      "date": "2024-01-15",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create Income
```bash
POST /api/incomes/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 5000.00,
  "source": "salary",
  "description": "Monthly salary",
  "date": "2024-01-15"
}

Response:
{
  "id": 1,
  "amount": 5000.00,
  "source": "salary",
  "source_display": "Salary",
  "description": "Monthly salary",
  "date": "2024-01-15",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Update Income
```bash
PATCH /api/incomes/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 5500.00,
  "description": "Bonus included"
}
```

### Delete Income
```bash
DELETE /api/incomes/{id}/
Authorization: Bearer <access_token>
```

---

## 💸 Expense Endpoints

### Create Expense
```bash
POST /api/expenses/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 50.00,
  "category": "food",
  "description": "Grocery shopping",
  "date": "2024-01-15",
  "merchant": "Whole Foods"
}

Response:
{
  "id": 1,
  "amount": 50.00,
  "category": "food",
  "category_display": "Food & Dining",
  "description": "Grocery shopping",
  "date": "2024-01-15",
  "merchant": "Whole Foods",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Valid Categories
- housing
- food
- transport
- utilities
- healthcare
- entertainment
- shopping
- education
- other

---

## 💼 Budget Endpoints

### Create Budget
```bash
POST /api/budgets/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "category": "food",
  "amount": 500.00,
  "period": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}

Response:
{
  "id": 1,
  "category": "food",
  "category_display": "Food & Dining",
  "amount": 500.00,
  "period": "monthly",
  "period_display": "Monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Valid Periods
- weekly
- monthly
- yearly

---

## 🎯 Savings Goal Endpoints

### Create Savings Goal
```bash
POST /api/savings-goals/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Emergency Fund",
  "target_amount": 10000.00,
  "current_amount": 2500.00,
  "deadline": "2025-01-15",
  "description": "6 months of living expenses"
}

Response:
{
  "id": 1,
  "name": "Emergency Fund",
  "target_amount": 10000.00,
  "current_amount": 2500.00,
  "progress_percentage": 25.0,
  "deadline": "2025-01-15",
  "description": "6 months of living expenses",
  "is_completed": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## 🔔 Notification Endpoints

### Get Notifications
```bash
GET /api/notifications/
Authorization: Bearer <access_token>

Query Parameters:
- is_read: true/false (filter by read status)

Response:
{
  "results": [
    {
      "id": 1,
      "title": "Budget Alert",
      "message": "You've spent 80% of your food budget",
      "notification_type": "budget_alert",
      "notification_type_display": "Budget Alert",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Mark as Read
```bash
PATCH /api/notifications/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "is_read": true
}
```

---

## 📊 Report Endpoints

### Create Report
```bash
POST /api/reports/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "January Income Summary",
  "report_type": "income_summary",
  "date_range_start": "2024-01-01",
  "date_range_end": "2024-01-31",
  "data": {
    "total_income": 10000.00,
    "sources": {
      "salary": 5000.00,
      "freelance": 5000.00
    }
  }
}

Response:
{
  "id": 1,
  "title": "January Income Summary",
  "report_type": "income_summary",
  "report_type_display": "Income Summary",
  "date_range_start": "2024-01-01",
  "date_range_end": "2024-01-31",
  "data": { ... },
  "generated_at": "2024-01-15T10:30:00Z"
}
```

### Valid Report Types
- income_summary
- expense_summary
- budget_vs_actual
- net_worth
- custom

### Export Combined Statement (CSV or Excel)
```bash
# Export as CSV:
GET /api/reports/combined-summary/?export=csv
Authorization: Bearer <access_token>

# Export as Excel:
GET /api/reports/combined-summary/?export=excel
Authorization: Bearer <access_token>

Response: File download (attachment; filename="financial_statement_...")
```

### Export Monthly Report as Excel
```bash
GET /api/reports/monthly-financial/<id>/export-excel/
Authorization: Bearer <access_token>

Response: File download (attachment; filename="BudgetBuddy_<id>.xlsx")
```

---

## 👤 Profile Endpoints

### Get Profile
```bash
GET /api/profile/
Authorization: Bearer <access_token>

Response:
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "bio": "Personal finance enthusiast",
  "avatar": null,
  "currency_preference": "USD",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Update Profile
```bash
PATCH /api/profile/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "currency_preference": "EUR"
}
```

---

## 🧪 Testing with cURL

### Sample Test Script
```bash
#!/bin/bash

# Register
echo "Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }')

ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"access":"[^"]*' | cut -d'"' -f4)
echo "Access Token: $ACCESS_TOKEN"

# Get current user
echo "Getting current user..."
curl -s -X GET http://127.0.0.1:8000/api/auth/me/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Create income
echo "Creating income..."
curl -s -X POST http://127.0.0.1:8000/api/incomes/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000.00,
    "source": "salary",
    "description": "Monthly salary",
    "date": "2024-01-15"
  }' | jq

# List incomes
echo "Listing incomes..."
curl -s -X GET http://127.0.0.1:8000/api/incomes/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

---

## 🔍 Common Issues & Solutions

### CORS Error
**Problem**: Frontend can't communicate with backend
**Solution**: 
1. Check `.env` file has `CORS_ALLOWED_ORIGINS=http://localhost:5173`
2. Restart backend: `python manage.py runserver`

### 401 Unauthorized
**Problem**: Token is invalid or expired
**Solution**: 
1. Register/login again to get new token
2. Use refresh token endpoint to get new access token

### 404 Not Found
**Problem**: Endpoint doesn't exist
**Solution**: 
1. Check URL spelling and format
2. Verify app is registered in INSTALLED_APPS
3. Verify URL patterns are correctly configured

### 400 Bad Request
**Problem**: Invalid data sent
**Solution**: 
1. Check request payload format
2. Verify required fields are included
3. Check field values match expected types

---

## 🎯 Testing Checklist

- [ ] User can register
- [ ] User can login
- [ ] JWT token is returned on login
- [ ] User can access protected routes with token
- [ ] User is redirected to login without token
- [ ] User can create/read/update/delete income
- [ ] User can create/read/update/delete expenses
- [ ] User can create/read/update/delete budgets
- [ ] User can create/read/update/delete savings goals
- [ ] User can view notifications
- [ ] User can create reports
- [ ] User can update profile
- [ ] Token refresh works correctly
- [ ] Users can only see their own data

---

## 📚 Useful Resources

- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [JWT Authentication Guide](https://django-rest-framework-simplejwt.readthedocs.io/)
- [React Router Docs](https://reactrouter.com/)
- [Axios Docs](https://axios-http.com/)
- [Vite Docs](https://vitejs.dev/)

---

Happy coding! 🎉
