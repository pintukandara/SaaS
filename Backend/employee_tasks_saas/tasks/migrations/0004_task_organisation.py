from collections import Counter
from zoneinfo import ZoneInfo

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def backfill_organisation_and_usage(apps, schema_editor):
    alias = schema_editor.connection.alias
    Task = apps.get_model('tasks', 'Task')
    Project = apps.get_model('projects', 'Project')
    UsageTracking = apps.get_model('subscription', 'UsageTracking')

    # Old tasks have no historical workspace field. Prefer their project's
    # organisation; for standalone tasks use the creator's current organisation.
    batch = []
    for task in Task.objects.using(alias).select_related('project', 'created_by').iterator(chunk_size=500):
        task.organisation_id = (
            task.project.organisation_id if task.project_id else None
        ) or task.created_by.current_organisation_id
        if task.organisation_id:
            batch.append(task)
        if len(batch) == 500:
            Task.objects.using(alias).bulk_update(batch, ['organisation'])
            batch = []
    if batch:
        Task.objects.using(alias).bulk_update(batch, ['organisation'])

    calendar_timezone = ZoneInfo(settings.TIME_ZONE)
    for model, metric in [(Task, 'tasks_created'), (Project, 'projects_created')]:
        counts = Counter()
        rows = model.objects.using(alias).filter(
            organisation__isnull=False, created_at__isnull=False,
        ).values_list('organisation_id', 'created_at')
        for organisation_id, created_at in rows.iterator(chunk_size=500):
            date = created_at.astimezone(calendar_timezone)
            counts[(organisation_id, date.year, date.month)] += 1
        for (organisation_id, year, month), count in counts.items():
            usage, _ = UsageTracking.objects.using(alias).get_or_create(
                organisation_id=organisation_id, year=year, month=month,
            )
            # Never erase usage already recorded for objects since deleted.
            if getattr(usage, metric) < count:
                UsageTracking.objects.using(alias).filter(pk=usage.pk).update(**{metric: count})


class Migration(migrations.Migration):
    dependencies = [
        ('tasks', '0003_alter_task_status'),
        ('projects', '0005_project_organisation_alter_project_owner'),
        ('subscription', '0019_alter_subscription_end_date'),
        ('users', '0003_customuser_avatar'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='organisation',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                related_name='tasks', to='subscription.organisation',
            ),
        ),
        migrations.RunPython(backfill_organisation_and_usage, migrations.RunPython.noop),
    ]
