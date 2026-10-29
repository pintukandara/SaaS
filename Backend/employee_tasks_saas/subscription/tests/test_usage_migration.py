from datetime import datetime, timezone
from unittest.mock import patch

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase, override_settings


@override_settings(TIME_ZONE='UTC')
class UsageBackfillTests(TransactionTestCase):
    migrate_from = [
        ('tasks', '0003_alter_task_status'),
        ('projects', '0005_project_organisation_alter_project_owner'),
        ('subscription', '0019_alter_subscription_end_date'),
        ('users', '0003_customuser_avatar'),
    ]
    migrate_to = [('tasks', '0004_task_organisation')]

    def test_backfill_prefers_project_and_preserves_higher_historical_counters(self):
        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_from)
        self.addCleanup(lambda: MigrationExecutor(connection).migrate(self.migrate_to))
        apps = executor.loader.project_state(self.migrate_from).apps
        User = apps.get_model('users', 'CustomUser')
        Organisation = apps.get_model('subscription', 'Organisation')
        Project = apps.get_model('projects', 'Project')
        Task = apps.get_model('tasks', 'Task')
        Usage = apps.get_model('subscription', 'UsageTracking')
        at = datetime(2026, 10, 15, tzinfo=timezone.utc)

        with patch('django.utils.timezone.now', return_value=at):
            owner = User.objects.create(username='historical-owner')
            first_org = Organisation.objects.create(name='First team', slug='first', owner=owner)
            second_org = Organisation.objects.create(name='Second team', slug='second', owner=owner)
            owner.current_organisation = first_org
            owner.save()
            project = Project.objects.create(name='Second team release', organisation=second_org, owner=owner)
            linked = Task.objects.create(title='Linked task', project=project, created_by=owner)
            standalone = Task.objects.create(title='Standalone task', created_by=owner)
            unknown_owner = User.objects.create(username='unknown-workspace')
            unknown = Task.objects.create(title='Unknown workspace', created_by=unknown_owner)
            Usage.objects.create(organisation=second_org, year=2026, month=10, tasks_created=10)

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_to)
        apps = executor.loader.project_state(self.migrate_to).apps
        Task = apps.get_model('tasks', 'Task')
        Usage = apps.get_model('subscription', 'UsageTracking')
        self.assertEqual(Task.objects.get(pk=linked.pk).organisation_id, second_org.pk)
        self.assertEqual(Task.objects.get(pk=standalone.pk).organisation_id, first_org.pk)
        self.assertIsNone(Task.objects.get(pk=unknown.pk).organisation_id)
        self.assertEqual(Usage.objects.get(organisation_id=first_org.pk, year=2026, month=10).tasks_created, 1)
        second_usage = Usage.objects.get(organisation_id=second_org.pk, year=2026, month=10)
        self.assertEqual(second_usage.tasks_created, 10)
        self.assertEqual(second_usage.projects_created, 1)
