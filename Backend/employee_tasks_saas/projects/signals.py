from django.db.models.signals import post_save
from django.dispatch import receiver

from subscription.services import track_usage

from .models import Project


@receiver(post_save, sender=Project)
def track_project_creation(sender, instance, created, **kwargs):
    if not created:
        return

    organisation = instance.owner.current_organisation
    if organisation:
        track_usage(organisation, 'projects_created')