"""
API endpoint tests for the subscription app.

Only covers routes that are ACTUALLY registered (verified via
`manage.py show_urls`):

    GET            /api/subscription/plans/
    GET            /api/subscription/plans/<pk>/
    GET/POST       /api/subscription/organisations/
    GET/PUT/PATCH/DELETE /api/subscription/organisations/<pk>/
    GET/POST       /api/subscription/subscriptions/
    POST           /api/subscription/subscriptions/current/
    POST           /api/subscription/subscriptions/upgrade/
    GET            /api/subscription/usage/
    GET            /api/subscription/usage/current_month/

NOTE (BUG-05, see subscription/views.py): `invite_member`, `leave_organisation`,
`transform_ownership`, `remove_member` (org), `my_organisation` and
`delete_organisation` are written as if they were @action methods on
OrganisationViewSet, but due to an indentation mistake they are nested
*inside* the stray module-level `invite_member` function instead of inside
the class body. DRF's router therefore never registers them, and calling
their intended URLs (e.g. POST /api/subscription/organisations/<pk>/invite_member/)
returns a plain 404. There is nothing to test at the API layer for these
until the indentation bug is fixed and they are re-registered on the class.
"""
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from subscription.models import Organisation, OrganisationMember, Subscription, SubscriptionPlan
from users.models import CustomUser


class SubscriptionPlanViewSetTests(APITestCase):
    def setUp(self):
        self.plan = SubscriptionPlan.objects.create(
            name='free', display_name='Free', description='d', price=0
        )
        self.inactive_plan = SubscriptionPlan.objects.create(
            name='enterprise', display_name='Enterprise', description='d', price=999,
            is_active=False,
        )

    def test_plans_are_public(self):
        """permission_classes = [] on the viewset means no auth is required."""
        response = self.client.get(reverse('subscription-plan-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_only_active_plans_listed(self):
        response = self.client.get(reverse('subscription-plan-list'))
        names = {p['name'] for p in response.data['results']}
        self.assertIn('free', names)
        self.assertNotIn('enterprise', names)

    def test_plans_are_read_only(self):
        response = self.client.post(
            reverse('subscription-plan-list'),
            {'name': 'starter', 'display_name': 'Starter', 'description': 'd', 'price': 10},
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class OrganisationViewSetTests(APITestCase):
    list_url = reverse('organisations-list')

    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345'
        )
        self.member = CustomUser.objects.create_user(
            username='member', email='member@example.com', password='pass12345'
        )
        self.outsider = CustomUser.objects.create_user(
            username='outsider', email='outsider@example.com', password='pass12345'
        )
        self.org = Organisation.objects.create(
            name='Acme', slug='acme', owner=self.owner, email='acme@example.com'
        )
        OrganisationMember.objects.create(
            organisation=self.org, user=self.member, role='member', is_active=True
        )

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_sees_their_organisation(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = {o['name'] for o in response.data['results']}
        self.assertIn('Acme', names)

    def test_outsider_incorrectly_sees_organisations_with_any_active_member(self):
        """
        NOTE (BUG-08): OrganisationViewSet.get_queryset() ORs together
        Q(owner=user), Q(member__user=user), and a bare Q(member__is_active=True)
        with no user filter on that third clause. That last clause matches
        ANY organisation that has ANY active member at all, so every
        organisation that has ever activated a member becomes visible to
        every authenticated user, not just its owner/members. This test
        documents that actual (leaky) behaviour; once the stray
        `Q(member__is_active=True)` clause is removed, flip this back to
        asserting count == 0.
        """
        self.client.force_authenticate(self.outsider)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_create_organisation_sets_owner_from_request_user(self):
        self.client.force_authenticate(self.outsider)
        response = self.client.post(
            self.list_url,
            {'name': 'New Org', 'slug': 'new-org', 'email': 'new@example.com'},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        org = Organisation.objects.get(slug='new-org')
        self.assertEqual(org.owner, self.outsider)
        # perform_create also auto-adds the creator as an active 'owner' member
        self.assertTrue(
            OrganisationMember.objects.filter(
                organisation=org, user=self.outsider, role='owner'
            ).exists()
        )

    def test_member_non_owner_can_still_update_organisation(self):
        """
        NOTE (BUG-06): OrganisationViewSet only requires IsAuthenticated;
        there is no object-level "must be owner/admin" check on the default
        update/delete actions (IsOrganisationOwner is only ever wired up to
        the Subscription 'upgrade' action). Any active member of an
        organisation -- not just its owner -- can rename or delete it. This
        test documents that current behaviour.
        """
        self.client.force_authenticate(self.member)
        url = reverse('organisations-detail', args=[self.org.id])
        response = self.client.patch(url, {'name': 'Renamed by non-owner'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.org.refresh_from_db()
        self.assertEqual(self.org.name, 'Renamed by non-owner')

    def test_outsider_can_retrieve_organisation_due_to_queryset_leak(self):
        """See BUG-08 above -- same leaky get_queryset() clause."""
        self.client.force_authenticate(self.outsider)
        url = reverse('organisations-detail', args=[self.org.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class SubscriptionViewSetTests(APITestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345'
        )
        self.org = Organisation.objects.create(
            name='Acme', slug='acme', owner=self.owner, email='acme@example.com'
        )
        self.owner.current_organisation = self.org
        self.owner.save()
        self.plan = SubscriptionPlan.objects.create(
            name='free', display_name='Free', description='d', price=0
        )
        self.no_org_user = CustomUser.objects.create_user(
            username='noorg', email='noorg@example.com', password='pass12345'
        )

    def test_list_requires_authentication(self):
        response = self.client.get(reverse('subscription-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_without_organisation(self):
        self.client.force_authenticate(self.no_org_user)
        response = self.client.get(reverse('subscription-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_current_action_no_active_subscription(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(reverse('subscription-current'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_current_action_no_organisation(self):
        self.client.force_authenticate(self.no_org_user)
        response = self.client.post(reverse('subscription-current'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_current_action_returns_active_subscription(self):
        Subscription.objects.create(
            organisation=self.org, plan=self.plan, status='active',
            start_date=timezone.now(), end_date=timezone.now() + timedelta(days=30),
        )
        self.client.force_authenticate(self.owner)
        response = self.client.post(reverse('subscription-current'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'active')

    def test_upgrade_crashes_due_to_organization_field_typo(self):
        """
        NOTE (BUG-09): SubscriptionViewSet.upgrade() calls
        `Subscription.objects.create(organization=org, ...)` but the model
        field is `organisation` (British spelling). This raises a TypeError
        for every caller, owner or not, before IsOrganisationOwner is even
        meaningfully exercised (that permission class also only implements
        has_object_permission, which DRF never calls for a detail=False
        action like this one).
        """
        self.client.force_authenticate(self.owner)
        self.client.raise_request_exception = False
        response = self.client.post(
            reverse('subscription-upgrade'), {'plan_id': self.plan.id}
        )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class UsageTrackingViewSetTests(APITestCase):
    """
    NOTE (BUG-07): UsageTrackingViewSet.get_queryset() and its
    `current_month` action both read `self.request.user.current_organization`
    (American spelling) but CustomUser only defines `current_organisation`
    (British spelling). Any authenticated request with an active
    subscription therefore raises AttributeError -> 500, instead of the
    intended "no organisation" 400 response.
    """

    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345'
        )
        self.org = Organisation.objects.create(
            name='Acme', slug='acme', owner=self.owner, email='acme@example.com'
        )
        self.owner.current_organisation = self.org
        self.owner.save()
        self.plan = SubscriptionPlan.objects.create(
            name='free', display_name='Free', description='d', price=0
        )
        Subscription.objects.create(
            organisation=self.org, plan=self.plan, status='active',
            start_date=timezone.now(), end_date=timezone.now() + timedelta(days=30),
        )

    def test_list_requires_authentication(self):
        response = self.client.get(reverse('usage-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_blocked_without_active_subscription_permission_check(self):
        no_sub_user = CustomUser.objects.create_user(
            username='nosub', email='nosub@example.com', password='pass12345'
        )
        self.client.force_authenticate(no_sub_user)
        response = self.client.get(reverse('usage-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_crashes_due_to_organisation_attribute_typo(self):
        self.client.force_authenticate(self.owner)
        self.client.raise_request_exception = False
        response = self.client.get(reverse('usage-list'))
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
