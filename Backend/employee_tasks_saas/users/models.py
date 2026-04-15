from datetime import timezone, datetime
from random import choice
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import SET_NULL

from teams.models import Department


# Create your models here.

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    department = models.ForeignKey(Department, on_delete=SET_NULL,null =True,blank=True,related_name='employees')
    phone = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    hired_date = models.DateField(null=True, blank=True ,default= datetime.now)
    current_organisation = models.ForeignKey('subscription.Organisation',
                                             on_delete=models.SET_NULL,
                                             null=True,
                                             blank=True,
                                             related_name='current_users',
                                             )
    
    @property
    def avatar(self):
        if self.avatar:
            return self.avatar.url
        return None
    def get_organisation(self):
        from subscription.models import OrganisationMember
        return OrganisationMember.objects.filter(
            user=self,
            is_active=True
        ).select_related('organization')
    def has_active_subscription(self):
        if self.current_organisation:
            return self.current_organisation.active_subscription is not None
        return False
    def get_current_plan(self):
        if self.current_organisation:
            return self.current_organisation.current_plan
        return None
    def __str__(self):
        return self.username
