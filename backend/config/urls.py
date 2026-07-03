from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import ProfileViewSet

# Create a router for API endpoints
router = DefaultRouter()
router.register(r'profile', ProfileViewSet, basename='profile')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/incomes/', include('income.urls')),
    path('api/expenses/', include('expenses.urls')),
    path('api/budgets/', include('budgets.urls')),
    path('api/savings-goals/', include('savings.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/', include(router.urls)),
]
