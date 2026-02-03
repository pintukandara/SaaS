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
    def __str__(self):
        return self.username
