from django.core.exceptions import FieldError
from django.db.models import F
from django.utils import timezone

from .models import UsageTracking


def track_usage(organisation, metric_name):
	metric_fields = {
		field.name
		for field in UsageTracking._meta.concrete_fields
		if field.name not in {'id', 'organisation', 'year', 'month', 'created_at', 'updated_at'}
	}
	if metric_name not in metric_fields:
		raise FieldError(f"{metric_name!r} is not a usage metric")

	now = timezone.now()
	usage, _ = UsageTracking.objects.get_or_create(
		organisation=organisation,
		year=now.year,
		month=now.month,
	)
	UsageTracking.objects.filter(pk=usage.pk).update(
		**{metric_name: F(metric_name) + 1}
	)
	usage.refresh_from_db()
	return usage

