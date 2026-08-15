from django.db.models.signals import post_save
from django.dispatch import receiver

from subscription.services import track_usage

from .models import Task


@receiver(post_save, sender=Task)
def track_task_creation(sender, instance, created, **kwargs):
    if not created:
        return

    organisation = instance.created_by.current_organisation
    if organisation:
        track_usage(organisation, 'tasks_created')