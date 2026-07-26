from django.db import IntegrityError, transaction
from django.test import TestCase

from teams.models import Department, Team, TeamMember
from users.models import CustomUser


class DepartmentModelTests(TestCase):
    def test_str_representation(self):
        dept = Department.objects.create(name='Engineering')
        self.assertEqual(str(dept), 'Engineering')

    def test_name_must_be_unique(self):
        Department.objects.create(name='Engineering')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Department.objects.create(name='Engineering')

    def test_default_ordering_by_name(self):
        Department.objects.create(name='Zeta')
        Department.objects.create(name='Alpha')
        names = list(Department.objects.values_list('name', flat=True))
        self.assertEqual(names, ['Alpha', 'Zeta'])


class TeamModelTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Engineering')
        self.manager = CustomUser.objects.create_user(
            username='manager', email='manager@example.com', password='pass12345',
            role='manager',
        )

    def test_str_representation(self):
        team = Team.objects.create(name='Backend', department=self.department)
        self.assertEqual(str(team), 'Backend (Engineering)')

    def test_team_name_unique_per_department(self):
        Team.objects.create(name='Backend', department=self.department)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Team.objects.create(name='Backend', department=self.department)

    def test_same_team_name_allowed_in_different_department(self):
        other_department = Department.objects.create(name='Sales')
        Team.objects.create(name='Backend', department=self.department)
        # Should not raise: unique_together is scoped to (name, department)
        Team.objects.create(name='Backend', department=other_department)
        self.assertEqual(Team.objects.filter(name='Backend').count(), 2)

    def test_manager_optional(self):
        team = Team.objects.create(name='Frontend', department=self.department)
        self.assertIsNone(team.manager)

    def test_manager_set_null_on_user_delete(self):
        team = Team.objects.create(
            name='Frontend', department=self.department, manager=self.manager
        )
        self.manager.delete()
        team.refresh_from_db()
        self.assertIsNone(team.manager)


class TeamMemberModelTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Engineering')
        self.team = Team.objects.create(name='Backend', department=self.department)
        self.user = CustomUser.objects.create_user(
            username='member', email='member@example.com', password='pass12345'
        )

    def test_str_representation(self):
        member = TeamMember.objects.create(team=self.team, user=self.user)
        self.assertEqual(str(member), f"{self.user.username} in {self.team.name}")

    def test_default_role_is_member(self):
        member = TeamMember.objects.create(team=self.team, user=self.user)
        self.assertEqual(member.role, 'member')

    def test_user_cannot_join_same_team_twice(self):
        TeamMember.objects.create(team=self.team, user=self.user)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                TeamMember.objects.create(team=self.team, user=self.user)
