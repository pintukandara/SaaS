from django.db import models
from django.conf import settings


class Department(models.Model):
    """
    Departments are high-level organizational units
    Example: Engineering, Sales, Marketing, HR
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Team(models.Model):
    """
    Teams are smaller groups within departments
    Example: Frontend Team, Backend Team (both in Engineering dept)
    """
    name = models.CharField(max_length=100)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='teams'
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_teams'
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.department.name})"

    class Meta:
        ordering = ['department', 'name']
        unique_together = ['name', 'department']


class TeamMember(models.Model):
    """
    Junction table for many-to-many relationship
    Users can be in multiple teams
    """
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='team_memberships'
    )
    role = models.CharField(
        max_length=50,
        choices=[
            ('member', 'Member'),
            ('lead', 'Team Lead'),
        ],
        default='member'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} in {self.team.name}"

    class Meta:
        unique_together = ['team', 'user']
        ordering = ['team', 'user']