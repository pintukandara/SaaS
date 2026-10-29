from datetime import timedelta
from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from subscription.models import Invitation, Organisation
from users.models import CustomUser


class InvitationResendTests(APITestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='invite-owner', email='owner@example.com', password='OwnerPass123',
            role='admin',
        )
        self.org = Organisation.objects.create(
            name='Prodly Team', slug='prodly-team', owner=self.owner,
            email='team@example.com',
        )
        self.owner.current_organisation = self.org
        self.owner.save()
        self.client.force_authenticate(self.owner)
        self.url = reverse('organisations-invite-member', args=[self.org.pk])
        email_patch = patch('subscription.views.send_invitation_email.delay')
        self.send_email = email_patch.start()
        self.addCleanup(email_patch.stop)

    def send_invitation(self, email):
        before = timezone.now()
        response = self.client.post(self.url, {'email': email, 'role': 'employee'})
        after = timezone.now()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        invitation = Invitation.objects.get(organisation=self.org, email=email)
        self.assertEqual(invitation.status, 'pending')
        self.assertTrue(invitation.is_valid())
        self.assertGreaterEqual(invitation.expires_at, before + timedelta(days=7))
        self.assertLessEqual(invitation.expires_at, after + timedelta(days=7))
        self.assertTrue(response.data['invite_link'].endswith(f'/accept-invite/{invitation.token}'))
        self.send_email.assert_called_once_with(
            email, self.org.name, 'employee', response.data['invite_link'],
        )
        return invitation

    def test_new_invitation_has_seven_day_expiry_and_emailed_link(self):
        self.send_invitation('new@example.com')

    def test_resend_expired_invitation_can_be_verified_and_accepted(self):
        old = Invitation.objects.create(
            organisation=self.org, email='expired@example.com', status='expired',
            expires_at=timezone.now() - timedelta(days=1),
        )
        old_token = old.token
        renewed = self.send_invitation(old.email)
        self.assertEqual(renewed.pk, old.pk)
        self.assertNotEqual(renewed.token, old_token)
        self.assertEqual(Invitation.objects.filter(organisation=self.org, email=old.email).count(), 1)

        self.client.force_authenticate(user=None)
        old_response = self.client.get(reverse('verify-invitation', args=[old_token]))
        self.assertEqual(old_response.status_code, status.HTTP_400_BAD_REQUEST)
        verify_url = reverse('verify-invitation', args=[renewed.token])
        self.assertEqual(self.client.get(verify_url).status_code, status.HTTP_200_OK)

        payload = {
            'username': 'invited-teammate', 'password': 'TeammatePass123',
            'password2': 'TeammatePass123', 'token': old_token,
        }
        accept_url = reverse('accept-invitation')
        self.assertEqual(self.client.post(accept_url, payload).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(CustomUser.objects.filter(username=payload['username']).exists())
        payload['token'] = renewed.token
        self.assertEqual(self.client.post(accept_url, payload).status_code, status.HTTP_201_CREATED)
        renewed.refresh_from_db()
        self.assertEqual(renewed.status, 'accepted')
        self.assertEqual(self.client.get(verify_url).status_code, status.HTTP_400_BAD_REQUEST)

    def test_resend_pending_but_expired_invitation_invalidates_previous_link(self):
        old = Invitation.objects.create(
            organisation=self.org, email='pending@example.com', status='pending',
            expires_at=timezone.now() - timedelta(hours=1),
        )
        renewed = self.send_invitation(old.email)
        self.assertEqual(renewed.pk, old.pk)
        self.assertNotEqual(renewed.token, old.token)
        self.assertFalse(Invitation.objects.filter(token=old.token).exists())

    def test_existing_account_does_not_renew_accepted_invitation(self):
        CustomUser.objects.create_user(
            username='existing-teammate', email='existing@example.com', password='TeammatePass123',
        )
        invitation = Invitation.objects.create(
            organisation=self.org, email='existing@example.com', status='accepted',
        )
        original_token, original_expiry = invitation.token, invitation.expires_at
        response = self.client.post(self.url, {'email': invitation.email, 'role': 'employee'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'accepted')
        self.assertEqual(invitation.token, original_token)
        self.assertEqual(invitation.expires_at, original_expiry)
        self.send_email.assert_not_called()
