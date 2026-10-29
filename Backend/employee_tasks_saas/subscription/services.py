from django.core.exceptions import FieldError
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from .models import Organisation, UsageTracking


def usage_period(at=None):
    """Use the application's calendar timezone everywhere a month is selected."""
    date = timezone.localtime(at or timezone.now(), timezone.get_default_timezone())
    return date.year, date.month


def get_usage_record(organisation, at=None):
    year, month = usage_period(at)
    usage, _ = UsageTracking.objects.get_or_create(
        organisation=organisation, year=year, month=month,
    )
    return usage


def track_usage(organisation, metric_name, *, at=None):
    # Storage is current capacity, not an event counter; never increment it by 1.
    if metric_name not in {'tasks_created', 'projects_created', 'api_calls'}:
        raise FieldError(f'{metric_name!r} is not a usage counter')
    usage = get_usage_record(organisation, at)
    UsageTracking.objects.filter(pk=usage.pk).update(
        **{metric_name: F(metric_name) + 1}, updated_at=timezone.now(),
    )
    usage.refresh_from_db()
    return usage


@transaction.atomic
def save_with_usage_limit(serializer, organisation, metric_name, **save_kwargs):
    """Serialize quota-consuming requests and roll back both the object and its count."""
    if metric_name not in {'tasks_created', 'projects_created'}:
        raise FieldError(f'{metric_name!r} has no creation limit')

    # Lock a row that always exists, including the first request of a new month.
    organisation = Organisation.objects.select_for_update().get(pk=organisation.pk)
    subscription = organisation.active_subscription
    if not subscription:
        raise PermissionDenied('Your organisation does not have an active subscription.')

    instance = serializer.save(organisation=organisation, **save_kwargs)
    # Creation signals count once inside this transaction. Check the actual saved
    # timestamp so a request crossing midnight is charged to the correct month.
    if metric_name == 'tasks_created':
        usage = get_usage_record(organisation, instance.created_at)
        limit = subscription.plan.max_tasks_per_month
        if usage.tasks_created > limit:
            raise PermissionDenied(
                f'Monthly task limit reached ({limit} tasks). Your allowance renews next month.',
                code='task_limit_reached',
            )
    else:
        limit = subscription.plan.max_projects
        if organisation.projects.count() > limit:
            raise PermissionDenied(
                f'Project limit reached ({limit} projects). Delete a project or upgrade your plan.',
                code='project_limit_reached',
            )
    return instance
