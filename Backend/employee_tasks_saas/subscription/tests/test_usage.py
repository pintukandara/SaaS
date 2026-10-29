from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone as datetime_timezone
from threading import Barrier
from unittest.mock import patch

from django.db import close_old_connections, connections
from django.test import TransactionTestCase, override_settings, skipUnlessDBFeature
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from projects.models import Project
from subscription.models import Organisation, OrganisationMember, Subscription, SubscriptionPlan, UsageTracking
from subscription.services import get_usage_record, track_usage
from tasks.models import Task
from users.models import CustomUser


NOW = datetime(2026, 10, 15, 12, tzinfo=datetime_timezone.utc)


class UsageFixtures:
    def setUp(self):
        super().setUp()
        clock = patch('django.utils.timezone.now', return_value=NOW)
        clock.start()
        self.addCleanup(clock.stop)
        self.owner = CustomUser.objects.create_user(username='usage-owner', role='admin')
        self.teammate = CustomUser.objects.create_user(username='usage-teammate', role='admin')
        self.org = Organisation.objects.create(
            name='FreeMind', slug='freemind', owner=self.owner, email='team@example.com',
        )
        for user in (self.owner, self.teammate):
            user.current_organisation = self.org
            user.save()
            OrganisationMember.objects.create(organisation=self.org, user=user, role='admin')
        self.plan = SubscriptionPlan.objects.create(
            name='free', display_name='Free', price=0, max_tasks_per_month=2,
            max_projects=2, max_users=1,
        )
        Subscription.objects.create(
            organisation=self.org, plan=self.plan, status='active',
            start_date=NOW - timedelta(days=365), end_date=NOW + timedelta(days=365),
        )
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def other_organisation(self):
        owner = CustomUser.objects.create_user(username='other-owner', role='admin')
        org = Organisation.objects.create(
            name='Other Team', slug='other-team', owner=owner, email='other@example.com',
        )
        owner.current_organisation = org
        owner.save()
        OrganisationMember.objects.create(organisation=org, user=owner, role='owner')
        Subscription.objects.create(
            organisation=org, plan=self.plan, status='active',
            start_date=NOW - timedelta(days=365), end_date=NOW + timedelta(days=365),
        )
        return org, owner


@override_settings(TIME_ZONE='UTC')
class UsageTrackingTests(UsageFixtures, APITestCase):
    def create_task(self, **overrides):
        return self.client.post(reverse('task-list'), {'title': 'Plan the release', **overrides})

    def create_project(self, **overrides):
        return self.client.post(reverse('project-list'), {'name': 'Release planning', **overrides})

    def test_task_allowance_is_shared_across_teammates_and_counts_once(self):
        self.assertEqual(self.create_task().status_code, 201)
        self.client.force_authenticate(self.teammate)
        self.assertEqual(self.create_task().status_code, 201)
        response = self.create_task()
        self.assertEqual(response.status_code, 403)
        self.assertIn('Monthly task limit reached', str(response.data))
        self.assertEqual(Task.objects.filter(organisation=self.org).count(), 2)
        self.assertEqual(get_usage_record(self.org).tasks_created, 2)

    def test_editing_and_deleting_tasks_does_not_refund_monthly_usage(self):
        first = self.create_task()
        self.assertEqual(self.create_task().status_code, 201)
        url = reverse('task-detail', args=[first.data['id']])
        self.assertEqual(self.client.patch(url, {'status': 'done'}).status_code, 200)
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(get_usage_record(self.org).tasks_created, 2)
        self.assertEqual(self.create_task().status_code, 403)

    def test_invalid_task_or_project_does_not_consume_usage(self):
        self.assertEqual(self.client.post(reverse('task-list'), {}).status_code, 400)
        self.assertEqual(self.client.post(reverse('project-list'), {}).status_code, 400)
        self.assertFalse(UsageTracking.objects.filter(organisation=self.org).exists())

    def test_task_and_counter_both_roll_back_if_accounting_fails(self):
        self.assertEqual(self.create_task().status_code, 201)

        def increment_then_fail(*args, **kwargs):
            track_usage(*args, **kwargs)
            raise RuntimeError('Simulated accounting failure')

        with patch('tasks.signals.track_usage', side_effect=increment_then_fail):
            with self.assertRaisesMessage(RuntimeError, 'Simulated accounting failure'):
                self.create_task()
        self.assertEqual(Task.objects.filter(organisation=self.org).count(), 1)
        self.assertEqual(get_usage_record(self.org).tasks_created, 1)

    def test_project_limit_uses_current_capacity_not_monthly_creations(self):
        first = self.create_project()
        self.assertEqual(first.status_code, 201)
        self.assertEqual(self.create_project().status_code, 201)
        self.assertEqual(self.create_project().status_code, 403)
        self.assertEqual(get_usage_record(self.org).projects_created, 2)
        self.assertEqual(self.client.delete(reverse('project-detail', args=[first.data['id']])).status_code, 204)
        self.assertEqual(self.create_project().status_code, 201)
        self.assertEqual(self.org.projects.count(), 2)
        self.assertEqual(get_usage_record(self.org).projects_created, 3)

    def test_user_limit_does_not_block_project_creation_reading_or_editing(self):
        self.assertGreaterEqual(self.org.member_count, self.plan.max_users)
        created = self.create_project()
        self.assertEqual(created.status_code, 201)
        self.assertEqual(self.client.get(reverse('project-list')).status_code, 200)
        url = reverse('project-detail', args=[created.data['id']])
        self.assertEqual(self.client.patch(url, {'name': 'Updated release'}).status_code, 200)
        self.assertEqual(get_usage_record(self.org).projects_created, 1)

    def test_project_counter_rolls_back_with_rejected_creation(self):
        self.plan.max_projects = 0
        self.plan.save()
        self.assertEqual(self.create_project().status_code, 403)
        self.assertFalse(self.org.projects.exists())
        self.assertFalse(UsageTracking.objects.filter(organisation=self.org).exists())

    def test_workspace_switch_does_not_move_tasks_or_project_usage(self):
        task = Task.objects.create(title='Original task', created_by=self.owner)
        other_org, _ = self.other_organisation()
        self.owner.current_organisation = other_org
        self.owner.save()
        # The project's organisation, not the owner's selection, owns its usage.
        Project.objects.create(name='Original workspace project', owner=self.owner, organisation=self.org)
        task.refresh_from_db()
        self.assertEqual(task.organisation_id, self.org.pk)
        self.assertEqual(get_usage_record(self.org).tasks_created, 1)
        self.assertEqual(get_usage_record(self.org).projects_created, 1)
        self.assertFalse(UsageTracking.objects.filter(organisation=other_org).exists())
        self.assertEqual(self.client.get(reverse('task-list')).data['count'], 0)
        self.client.force_authenticate(self.teammate)
        self.assertEqual(self.client.get(reverse('task-list')).data['count'], 1)

    def test_project_limit_counts_the_projects_organisation_after_owner_switch(self):
        other_org, _ = self.other_organisation()
        self.owner.current_organisation = other_org
        self.owner.save()
        for name in ('Release', 'Research'):
            Project.objects.create(name=name, owner=self.owner, organisation=self.org)
        self.client.force_authenticate(self.teammate)
        self.assertEqual(self.create_project().status_code, 403)
        self.assertEqual(self.org.projects.count(), 2)

    def test_cross_workspace_project_or_assignee_is_rejected_without_usage(self):
        other_org, other_owner = self.other_organisation()
        project = Project.objects.create(name='Other release', owner=other_owner, organisation=other_org)
        self.assertEqual(self.create_task(project=project.pk).status_code, 400)
        self.assertEqual(self.create_task(assigned_to=other_owner.pk).status_code, 400)
        self.assertFalse(UsageTracking.objects.filter(organisation=self.org).exists())

    def test_request_cannot_choose_the_organisation_to_charge(self):
        other_org, _ = self.other_organisation()
        created = self.create_task(organisation=other_org.pk)
        self.assertEqual(created.status_code, 201)
        self.assertEqual(Task.objects.get(pk=created.data['id']).organisation_id, self.org.pk)
        self.assertFalse(UsageTracking.objects.filter(organisation=other_org).exists())

    def test_next_month_starts_at_zero_and_preserves_previous_usage(self):
        self.assertEqual(self.create_task().status_code, 201)
        self.assertEqual(self.create_task().status_code, 201)
        november = datetime(2026, 11, 1, tzinfo=datetime_timezone.utc)
        with patch('django.utils.timezone.now', return_value=november):
            self.assertEqual(self.create_task().status_code, 201)
            self.assertEqual(get_usage_record(self.org).tasks_created, 1)
        self.assertEqual(get_usage_record(self.org).tasks_created, 2)

    @override_settings(TIME_ZONE='Asia/Kolkata')
    def test_counting_and_usage_endpoint_use_the_same_local_month(self):
        utc_october = datetime(2026, 10, 31, 20, tzinfo=datetime_timezone.utc)
        with patch('django.utils.timezone.now', return_value=utc_october):
            self.assertEqual(self.create_task().status_code, 201)
            response = self.client.get(reverse('usage-current-month'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual((response.data['year'], response.data['month']), (2026, 11))
        self.assertEqual(response.data['tasks_created'], 1)
        self.assertEqual(response.data['period_timezone'], 'Asia/Kolkata')
        self.assertEqual(response.data['resets_at'], '2026-12-01T00:00:00+05:30')

    def test_usage_response_separates_monthly_project_creations_and_capacity(self):
        project = self.create_project()
        self.client.delete(reverse('project-detail', args=[project.data['id']]))
        self.create_task()
        inactive = CustomUser.objects.create_user(username='inactive-teammate')
        OrganisationMember.objects.create(organisation=self.org, user=inactive, is_active=False)
        response = self.client.get(reverse('usage-current-month'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['projects_created'], 1)
        self.assertEqual(response.data['current_projects'], 0)
        self.assertEqual(response.data['remaining_projects'], 2)
        self.assertEqual(response.data['tasks_created'], 1)
        self.assertEqual(response.data['remaining_tasks'], 1)
        self.assertEqual(response.data['current_users'], 2)
        other_org, _ = self.other_organisation()
        get_usage_record(other_org)
        history = self.client.get(reverse('usage-list'))
        self.assertEqual(history.data['count'], 1)

    def test_usage_response_handles_year_rollover(self):
        december = datetime(2026, 12, 31, 23, tzinfo=datetime_timezone.utc)
        with patch('django.utils.timezone.now', return_value=december):
            response = self.client.get(reverse('usage-current-month'))
        self.assertEqual(response.data['resets_at'], '2027-01-01T00:00:00+00:00')

    def test_quota_is_checked_again_after_subscription_expires(self):
        def expire_before_saving(**kwargs):
            Subscription.objects.filter(organisation=self.org).update(status='expired')
            return self.org

        with patch('subscription.services.Organisation.objects.select_for_update') as locked:
            locked.return_value.get.side_effect = expire_before_saving
            self.assertEqual(self.create_task().status_code, 403)
        self.assertFalse(Task.objects.exists())

    def test_creation_crossing_midnight_checks_the_saved_month(self):
        self.plan.max_tasks_per_month = 1
        self.plan.save()
        november = datetime(2026, 11, 1, tzinfo=datetime_timezone.utc)
        UsageTracking.objects.create(organisation=self.org, year=2026, month=11, tasks_created=1)
        from subscription.services import save_with_usage_limit

        def save_after_midnight(*args, **kwargs):
            with patch('django.utils.timezone.now', return_value=november):
                return save_with_usage_limit(*args, **kwargs)

        with patch('tasks.views.save_with_usage_limit', side_effect=save_after_midnight):
            self.assertEqual(self.create_task().status_code, 403)
        self.assertFalse(Task.objects.exists())
        self.assertEqual(get_usage_record(self.org, november).tasks_created, 1)

    def test_zero_task_allowance_blocks_creation_without_leaving_a_counter(self):
        self.plan.max_tasks_per_month = 0
        self.plan.save()
        self.assertEqual(self.create_task().status_code, 403)
        self.assertFalse(Task.objects.exists())
        self.assertFalse(UsageTracking.objects.filter(organisation=self.org).exists())


@override_settings(TIME_ZONE='UTC')
class ConcurrentUsageTests(UsageFixtures, TransactionTestCase):
    @skipUnlessDBFeature('has_select_for_update')
    def test_only_one_request_can_take_the_last_task_slot(self):
        self.plan.max_tasks_per_month = 1
        self.plan.save()
        self.assert_one_creation(reverse('task-list'), {'title': 'Last task'})
        self.assertEqual(Task.objects.filter(organisation=self.org).count(), 1)
        self.assertEqual(get_usage_record(self.org).tasks_created, 1)

    @skipUnlessDBFeature('has_select_for_update')
    def test_only_one_request_can_take_the_last_project_slot(self):
        self.plan.max_projects = 1
        self.plan.save()
        self.assert_one_creation(reverse('project-list'), {'name': 'Last project'})
        self.assertEqual(self.org.projects.count(), 1)
        self.assertEqual(get_usage_record(self.org).projects_created, 1)

    def assert_one_creation(self, url, payload):
        barrier = Barrier(2)

        def create(user_id):
            close_old_connections()
            try:
                client = APIClient()
                client.force_authenticate(CustomUser.objects.get(pk=user_id))
                barrier.wait(timeout=10)
                return client.post(url, payload).status_code
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as executor:
            statuses = list(executor.map(create, [self.owner.pk, self.teammate.pk]))
        self.assertEqual(sorted(statuses), [201, 403])
