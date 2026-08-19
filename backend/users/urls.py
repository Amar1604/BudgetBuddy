from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, LogoutView, ChangePasswordView, ResetPasswordView, SubscribePremiumAPIView, RegisterFCMTokenAPIView
from .oauth2_views import GoogleOAuth2LoginAPIView, GitHubOAuth2LoginAPIView
from .password_reset_views import RequestPasswordResetAPIView, ConfirmPasswordResetAPIView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('reset-password/request/', RequestPasswordResetAPIView.as_view(), name='reset_password_request'),
    path('reset-password/confirm/', ConfirmPasswordResetAPIView.as_view(), name='reset_password_confirm'),
    path('subscribe-premium/', SubscribePremiumAPIView.as_view(), name='subscribe_premium'),
    path('oauth2/google/', GoogleOAuth2LoginAPIView.as_view(), name='oauth2_google'),
    path('oauth2/github/', GitHubOAuth2LoginAPIView.as_view(), name='oauth2_github'),
    path('register-fcm-token/', RegisterFCMTokenAPIView.as_view(), name='register_fcm_token'),
]

