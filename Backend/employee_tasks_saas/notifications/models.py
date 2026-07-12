from users.models import CustomUser
# pyrefly: ignore [missing-import]
from django.db import models

# Create your models here.
class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    read_status = models.BooleanField(default=False)
    timestamp = models.TimeField()