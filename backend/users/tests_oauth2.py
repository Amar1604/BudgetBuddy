from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class OAuth2APITests(APITestCase):

    def test_google_oauth2_success(self):
        url = reverse('oauth2_google')
        data = {
            "token": "mock_google_12345"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'google_user_12345')

    def test_google_oauth2_code_success(self):
        url = reverse('oauth2_google')
        data = {
            "code": "mock_google_99999"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['username'], 'google_user_99999')

    def test_google_oauth2_missing_token(self):
        url = reverse('oauth2_google')
        data = {}
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)

    def test_github_oauth2_success(self):
        url = reverse('oauth2_github')
        data = {
            "code": "mock_github_54321"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'github_user_54321')

    def test_github_oauth2_missing_code(self):
        url = reverse('oauth2_github')
        data = {}
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)

    def test_google_oauth2_custom_profile_success(self):
        url = reverse('oauth2_google')
        data = {
            "token": "mock_google_77777",
            "name": "Kashyap Singh",
            "email": "kashyapsingh7737@gmail.com"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['first_name'], 'Kashyap')
        self.assertEqual(res.data['user']['last_name'], 'Singh')
        self.assertEqual(res.data['user']['email'], 'kashyapsingh7737@gmail.com')
        self.assertEqual(res.data['user']['username'], 'kashyapsingh7737')

    def test_github_oauth2_custom_profile_success(self):
        url = reverse('oauth2_github')
        data = {
            "code": "mock_github_88888",
            "name": "Kashyap Singh",
            "email": "kashyapsingh7737@gmail.com"
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['first_name'], 'Kashyap')
        self.assertEqual(res.data['user']['last_name'], 'Singh')
        self.assertEqual(res.data['user']['email'], 'kashyapsingh7737@gmail.com')
        self.assertEqual(res.data['user']['username'], 'kashyapsingh7737')
