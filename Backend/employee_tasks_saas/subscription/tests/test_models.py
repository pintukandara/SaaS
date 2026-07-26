from datetime import timedelta

from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from subscription.models import (
    Invitation,
    Organisation,
    OrganisationMember,
    Subscription,
    SubscriptionPlan,
    UsageTracking,
)
from users.models import CustomUser


class SubscriptionPlanModelTests(TestCase):
    def test_str_representation(self):
        plan = SubscriptionPlan.objects.create(
            name='starter', display_name='Starter', description='d', price=10,
            billing_period='monthly',
        )
        self.assertEqual(str(plan), 'Starter - $10/monthly')

    def test_plan_name_must_be_unique(self):
        SubscriptionPlan.objects.create(
            name='free', display_name='Free', description='d', price=0
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                SubscriptionPlan.objects.create(
                    name='free', display_name='Free 2', description='d', price=0
                )


class OrganisationModelTests(TestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345'
        )
        self.org = Organisation.objects.create(
            name='Acme', slug='acme', owner=self.owner, email='acme@example.com'
        )
        self.plan = SubscriptionPlan.objects.create(
            name='free', display_name='Free', description='d', price=0
        )

    def test_str_representation(self):
        self.assertEqual(str(self.org), 'Acme')

    def test_active_subscription_none_by_default(self):
        self.assertIsNone(self.org.active_subscription)

    def test_active_subscription_returns_active_and_unexpired(self):
        Subscription.objects.create(
            organisation=self.org,
            plan=self.plan,
            status='active',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
        )
        self.assertIsNotNone(self.org.active_subscription)

    def test_active_subscription_ignores_expired(self):
        Subscription.objects.create(
            organisation=self.org,
            plan=self.plan,
            status='active',
            start_date=timezone.now() - timedelta(days=60),
            end_date=timezone.now() - timedelta(days=1),
        )
        self.assertIsNone(self.org.active_subscription)

    def test_current_plan_reflects_active_subscription(self):
        Subscription.objects.create(
            organisation=self.org,
            plan=self.plan,
            status='active',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
        )
        self.assertEqual(self.org.current_plan, self.plan)

    def test_member_count(self):
        OrganisationMember.objects.create(organisation=self.org, user=self.owner, role='owner')
        self.assertEqual(self.org.member_count, 1)


class SubscriptionModelTests(TestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345'
        )
        self.org = Organisation.objects.create(
            name='Acme', slug='acme', owner=self.owner, email='acme@example.com'
        )
        self.plan = SubscriptionPlan.objects.create(
            name='free', display_name='Free', description='d', price=0
        )

    def test_is_active_true_for_active_unexpired(self):
        sub = Subscription.objects.create(
            organisation=self.org, plan=self.plan, status='active',
            start_date=timezone.now(), end_date=timezone.now() + timedelta(days=1),
        )
        self.assertTrue(sub.is_active())

    def test_is_active_false_when_expired(self):
        sub = Subscription.objects.create(
            organisation=self.org, plan=self.plan, status='active',
            start_date=timezone.now() - timedelta(days=2),
            end_date=timezone.now() - timedelta(days=1),
        )
        self.assertFalse(sub.is_active())

    def test_days_remaining(self):
        sub = Subscription.objects.create(
            organisation=self.org, plan=self.plan, status='active',
            start_date=timezone.now(), end_date=timezone.now() + timedelta(days=5),
        )
        self.assertIn(sub.days_remaining(), (4, 5))

    def test_days_remaining_zero_when_expired(self):
        sub = Subscription.objects.create(
            organisation=self.org, plan=self.plan, status='expired',
            start_date=timezone.now() - timedelta(days=10),
            end_date=timezone.now() - timedelta(days=1),
        )
        self.assertEqual(sub.days_remaining(), 0)

    def test_can_use_features_true_for_trial(self):
        sub = Subscription.objects.create(
            organisation=self.org, plan=self.plan, status='trial', is_trial=True,
            start_date=timezone.now(), end_date=timezone.now() + timedelta(days=1),
        )
        self.assertTrue(sub.can_use_features())


class InvitationModelTests(TestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345'
        )
        self.org = Organisation.objects.create(
            name='Acme', slug='acme', owner=self.owner, email='acme@example.com'
        )

    def test_expires_at_defaults_to_7_days(self):
        invitation = Invitation.objects.create(
            organisation=self.org, email='invitee@example.com', role='employee'
        )
        delta = invitation.expires_at - invitation.created_at
        self.assertTrue(6 <= delta.days <= 7)

    def test_is_valid_true_for_pending_unexpired(self):
        invitation = Invitation.objects.create(
            organisation=self.org, email='invitee@example.com', role='employee'
        )
        self.assertTrue(invitation.is_valid())

    def test_is_valid_false_when_accepted(self):
        invitation = Invitation.objects.create(
            organisation=self.org, email='invitee@example.com', role='employee',
            status='accepted',
        )
        self.assertFalse(invitation.is_valid())

    def test_is_valid_false_when_expired(self):
        invitation = Invitation.objects.create(
            organisation=self.org, email='invitee@example.com', role='employee',
            expires_at=timezone.now() - timedelta(days=1),
        )
        self.assertFalse(invitation.is_valid())

    def test_unique_together_organisation_and_email(self):
        Invitation.objects.create(
            organisation=self.org, email='dup@example.com', role='employee'
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Invitation.objects.create(
                    organisation=self.org, email='dup@example.com', role='manager'
                )


class UsageTrackingModelTests(TestCase):
    def test_unique_together_org_year_month(self):
        owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345'
        )
        org = Organisation.objects.create(
            name='Acme', slug='acme', owner=owner, email='acme@example.com'
        )
        UsageTracking.objects.create(organisation=org, year=2026, month=1)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                UsageTracking.objects.create(organisation=org, year=2026, month=1)
