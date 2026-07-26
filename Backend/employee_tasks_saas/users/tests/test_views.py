"""
API endpoint tests for the users/auth app.

Covers:
    POST /api/auth/register/
    POST /api/auth/login/
    POST /api/auth/token/refresh/
    GET, PUT, PATCH /api/auth/me/
    POST /api/auth/logout/
    GET  /api/auth/users/            (list)
    GET  /api/auth/users/<pk>/       (retrieve)
    POST /api/auth/accept-invitation/
    GET  /api/auth/verify-invitation/<token>/
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from subscription.models import Invitation, Organisation, SubscriptionPlan
from teams.models import Department, Team, TeamMember
from users.models import CustomUser


class RegisterViewTests(APITestCase):
    url = reverse('register')

    def setUp(self):
        # RegisterSerializer.create() looks up a plan named "free"; make sure
        # it exists so the happy path is exercised the same way it would be
        # in production.
        SubscriptionPlan.objects.create(
            name='free', display_name='Free', description='Free plan', price=0
        )

    def valid_payload(self, **overrides):
        payload = {
            'username': 'newadmin',
            'email': 'newadmin@example.com',
            'password': 'StrongPass123',
            'password2': 'StrongPass123',
            'first_name': 'New',
            'last_name': 'Admin',
            'organisation_name': 'Acme Inc',
        }
        payload.update(overrides)
        return payload

    def test_register_is_public(self):
        """AllowAny: unauthenticated users can hit this endpoint."""
        response = self.client.post(self.url, self.valid_payload())
        # NOTE: see BUG-02 in the test-run notes below / README --
        # RegisterSerializer.create() uses `Subscription.objects.create(is_Trial=...)`
        # which is not a real model field (the field is `is_trial`), so this
        # currently raises a 500 instead of creating the user. We assert the
        # documented/expected behaviour here so this test fails loudly until
        # the typo is fixed.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(username='newadmin').exists())

    def test_register_password_mismatch(self):
        response = self.client.post(
            self.url, self.valid_payload(password2='Different123')
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_duplicate_email_rejected(self):
        CustomUser.objects.create_user(
            username='existing', email='newadmin@example.com', password='x'
        )
        response = self.client.post(self.url, self.valid_payload())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_required_field(self):
        payload = self.valid_payload()
        payload.pop('organisation_name')
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginViewTests(APITestCase):
    url = reverse('login')

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='loginuser', email='login@example.com', password='Password123'
        )

    def test_login_success_returns_tokens(self):
        response = self.client.post(
            self.url, {'username': 'loginuser', 'password': 'Password123'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password_rejected(self):
        response = self.client.post(
            self.url, {'username': 'loginuser', 'password': 'wrong'}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_unknown_user_rejected(self):
        response = self.client.post(
            self.url, {'username': 'ghost', 'password': 'whatever'}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        login = self.client.post(
            self.url, {'username': 'loginuser', 'password': 'Password123'}
        )
        refresh_token = login.data['refresh']
        response = self.client.post(
            reverse('token_refresh'), {'refresh': refresh_token}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


class UserDetailViewTests(APITestCase):
    url = reverse('user-detail')

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='meuser', email='me@example.com', password='pass12345',
            first_name='Me', last_name='User',
        )

    def test_me_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'meuser')

    def test_me_patch_updates_profile(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(self.url, {'first_name': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')

    def test_me_cannot_be_used_to_change_other_users(self):
        """get_object() always returns request.user, regardless of body."""
        other = CustomUser.objects.create_user(
            username='other', email='other@example.com', password='pass12345'
        )
        self.client.force_authenticate(self.user)
        self.client.patch(self.url, {'id': other.id, 'first_name': 'Hijack'})
        other.refresh_from_db()
        self.assertNotEqual(other.first_name, 'Hijack')


class LogoutViewTests(APITestCase):
    url = reverse('logout')

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='logoutuser', email='logout@example.com', password='pass12345'
        )

    def test_logout_requires_authentication(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_authenticated(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserViewSetTests(APITestCase):
    """GET /api/auth/users/ and /api/auth/users/<pk>/ (ReadOnlyModelViewSet)."""

    list_url = reverse('user-list')

    def setUp(self):
        self.department = Department.objects.create(name='Engineering')
        self.admin = CustomUser.objects.create_user(
            username='admin1', email='admin1@example.com', password='pass12345',
            role='admin',
        )
        self.manager = CustomUser.objects.create_user(
            username='manager1', email='manager1@example.com', password='pass12345',
            role='manager',
        )
        self.employee_in_team = CustomUser.objects.create_user(
            username='emp1', email='emp1@example.com', password='pass12345',
            role='employee',
        )
        self.employee_outside = CustomUser.objects.create_user(
            username='emp2', email='emp2@example.com', password='pass12345',
            role='employee',
        )
        team = Team.objects.create(
            name='Backend', department=self.department, manager=self.manager
        )
        TeamMember.objects.create(team=team, user=self.employee_in_team)

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_sees_all_users(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], CustomUser.objects.count())

    def test_manager_sees_only_team_members(self):
        self.client.force_authenticate(self.manager)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = {u['username'] for u in response.data['results']}
        self.assertEqual(usernames, {'emp1'})

    def test_employee_sees_no_users(self):
        self.client.force_authenticate(self.employee_outside)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_retrieve_single_user(self):
        self.client.force_authenticate(self.admin)
        url = reverse('user-detail', args=[self.employee_in_team.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'emp1')

    def test_write_methods_not_allowed(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(self.list_url, {'username': 'x'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class InvitationFlowTests(APITestCase):
    """AcceptInvitationView + VerifyInvitationView."""

    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345',
            role='admin',
        )
        self.org = Organisation.objects.create(
            name='Acme', slug='acme', owner=self.owner, email='acme@example.com'
        )
        self.invitation = Invitation.objects.create(
            organisation=self.org,
            email='invitee@example.com',
            role='employee',
            invited_by=self.owner,
        )

    def test_verify_valid_invitation(self):
        url = reverse('verify-invitation', args=[self.invitation.token])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['email'], 'invitee@example.com')

    def test_verify_invalid_token(self):
        url = reverse('verify-invitation', args=['not-a-real-token'])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_expired_or_used_invitation(self):
        self.invitation.status = 'accepted'
        self.invitation.save()
        url = reverse('verify-invitation', args=[self.invitation.token])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_invitation_creates_user(self):
        url = reverse('accept-invitation')
        payload = {
            'username': 'invitee',
            'password': 'Password123',
            'password2': 'Password123',
            'first_name': 'Invited',
            'last_name': 'User',
            'token': self.invitation.token,
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(username='invitee').exists())
        self.invitation.refresh_from_db()
        self.assertEqual(self.invitation.status, 'accepted')

    def test_accept_invitation_password_mismatch(self):
        url = reverse('accept-invitation')
        payload = {
            'username': 'invitee',
            'password': 'Password123',
            'password2': 'Mismatch123',
            'token': self.invitation.token,
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_invitation_bad_token(self):
        url = reverse('accept-invitation')
        payload = {
            'username': 'invitee',
            'password': 'Password123',
            'password2': 'Password123',
            'token': 'garbage-token',
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
