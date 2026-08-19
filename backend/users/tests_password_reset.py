from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='reset_test_user',
            email='testreset@example.com',
            password='oldpassword123',
            first_name='Reset',
            last_name='User'
        )
        self.request_url = reverse('reset_password_request')
        self.confirm_url = reverse('reset_password_confirm')

    def test_password_reset_request_success(self):
        response = self.client.post(self.request_url, {'email': 'testreset@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)
        self.assertEqual(
            response.data['detail'],
            'If an account exists with this email address, a password reset link has been sent.'
        )

    def test_password_reset_request_non_existent_email(self):
        response = self.client.post(self.request_url, {'email': 'nonexistent@example.com'})
        # Assert same success status and message (security best practice against user enumeration)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data['detail'],
            'If an account exists with this email address, a password reset link has been sent.'
        )

    def test_password_reset_confirm_success(self):
        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(self.confirm_url, {
            'uidb64': uidb64,
            'token': token,
            'new_password': 'newsecurepassword123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Password reset successful. You can now log in.')

        # Verify password is updated and user can log in
        login_url = reverse('token_obtain_pair')
        login_response = self.client.post(login_url, {
            'username': 'reset_test_user',
            'password': 'newsecurepassword123'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)

    def test_password_reset_confirm_invalid_token(self):
        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        invalid_token = 'invalid-token-12345'

        response = self.client.post(self.confirm_url, {
            'uidb64': uidb64,
            'token': invalid_token,
            'new_password': 'newsecurepassword123'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Invalid or expired password reset link.')

        # Verify old password still works
        login_url = reverse('token_obtain_pair')
        login_response = self.client.post(login_url, {
            'username': 'reset_test_user',
            'password': 'oldpassword123'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
