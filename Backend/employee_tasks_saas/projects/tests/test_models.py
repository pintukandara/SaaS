from django.db import IntegrityError, transaction
from django.test import TestCase

from projects.models import Project, ProjectMember
from teams.models import Department, Team
from users.models import CustomUser


class ProjectModelTests(TestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345',
            role='manager',
        )

    def test_str_representation(self):
        project = Project.objects.create(name='Website Revamp', owner=self.owner)
        self.assertEqual(str(project), 'Website Revamp')

    def test_default_status_is_planning(self):
        project = Project.objects.create(name='New project', owner=self.owner)
        self.assertEqual(project.status, 'planning')

    def test_team_optional(self):
        project = Project.objects.create(name='No team', owner=self.owner)
        self.assertIsNone(project.team)

    def test_team_set_null_when_team_deleted(self):
        department = Department.objects.create(name='Engineering')
        team = Team.objects.create(name='Backend', department=department)
        project = Project.objects.create(name='With team', owner=self.owner, team=team)
        team.delete()
        project.refresh_from_db()
        self.assertIsNone(project.team)

    def test_owner_cascade_on_delete(self):
        project = Project.objects.create(name='Owned', owner=self.owner)
        self.owner.delete()
        self.assertFalse(Project.objects.filter(id=project.id).exists())


class ProjectMemberModelTests(TestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner', email='owner@example.com', password='pass12345'
        )
        self.member_user = CustomUser.objects.create_user(
            username='member', email='member@example.com', password='pass12345'
        )
        self.project = Project.objects.create(name='Project X', owner=self.owner)

    def test_str_representation(self):
        member = ProjectMember.objects.create(project=self.project, user=self.member_user)
        self.assertEqual(str(member), f"{self.member_user.username} - {self.project.name}")

    def test_default_role(self):
        member = ProjectMember.objects.create(project=self.project, user=self.member_user)
        self.assertEqual(member.role, 'member')

    def test_user_cannot_join_same_project_twice(self):
        ProjectMember.objects.create(project=self.project, user=self.member_user)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProjectMember.objects.create(project=self.project, user=self.member_user)
