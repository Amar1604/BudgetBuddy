from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

class RequestPasswordResetAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get host origin for the reset link
        origin = request.headers.get('Origin', 'http://localhost:5173')

        try:
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{origin}/reset-password?uidb64={uidb64}&token={token}"

            subject = "Reset Your BudgetBuddy Password"
            message_text = f"""Hello {user.first_name or user.username},

We received a request to reset the password for your BudgetBuddy account.

Click the link below to set a new password:
{reset_url}

This link will expire in 24 hours. If you did not request this reset, you can safely ignore this email.

Best regards,
The BudgetBuddy Team
"""

            # HTML version of the email for premium look
            message_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 32px;">💰</span>
                    <h2 style="color: #1e3a8a; margin-top: 10px;">BudgetBuddy</h2>
                </div>
                <p>Hello {user.first_name or user.username},</p>
                <p>We received a request to reset the password for your personal finance account. Click the button below to secure your account and set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">This link will expire in 24 hours. If you did not make this request, you can safely ignore this email and your password will remain unchanged.</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">BudgetBuddy &copy; 2026. Secure expense planning made simple.</p>
            </div>
            """

            send_mail(
                subject=subject,
                message=message_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=message_html,
                fail_silently=False,
            )
            if settings.DEBUG:
                with open("reset_link_debug.log", "w") as f:
                    f.write(reset_url)
        except User.DoesNotExist:
            # Generic success response even if user doesn't exist (prevents email harvesting)
            pass

        return Response({
            'detail': 'If an account exists with this email address, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)


class ConfirmPasswordResetAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response({'error': 'UID, Token and New Password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'detail': 'Password reset successful. You can now log in.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid or expired password reset link.'}, status=status.HTTP_400_BAD_REQUEST)
