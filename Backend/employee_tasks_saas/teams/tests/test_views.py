"""
API endpoint tests for the teams app.

Covers:
    GET/POST      /api/departments/
    GET/PUT/PATCH/DELETE /api/departments/<pk>/
    GET           /api/departments/<pk>/teams/
    GET/POST      /api/teams/
    GET/PUT/PATCH/DELETE /api/teams/<pk>/
    POST          /api/teams/<pk>/add_member/
    DELETE        /api/teams/<pk>/remove_member/
    GET           /api/teams/my_teams/
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from teams.models import Department, Team, TeamMember
from users.models import CustomUser


class DepartmentViewSetTests(APITestCase):
    list_url = reverse('department-list')

    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            username='admin', email='admin@example.com', password='pass12345',
            role='admin',
        )
        self.employee = CustomUser.objects.create_user(
            username='emp', email='emp@example.com', password='pass12345',
            role='employee',
        )
        self.department = Department.objects.create(name='Engineering')

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_departments(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_create_department_as_admin(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(self.list_url, {'name': 'Sales'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_department_as_plain_employee_currently_allowed(self):
        """
        NOTE (BUG-03): DepartmentViewSet only enforces IsAuthenticated.
        teams.permissions.IsAdminOrManagerCreateTeams exists but is never
        wired up, so any authenticated user -- including employees -- can
        create/update/delete departments and teams. This test documents the
        current (unintended) behaviour; flip the assertion to 403 once the
        permission class is applied to the viewsets.
        """
        self.client.force_authenticate(self.employee)
        response = self.client.post(self.list_url, {'name': 'Unauthorized Dept'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_retrieve_department(self):
        self.client.force_authenticate(self.admin)
        url = reverse('department-detail', args=[self.department.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Engineering')

    def test_delete_department(self):
        self.client.force_authenticate(self.admin)
        url = reverse('department-detail', args=[self.department.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Department.objects.filter(id=self.department.id).exists())

    def test_department_teams_action(self):
        Team.objects.create(name='Backend', department=self.department)
        Team.objects.create(name='Frontend', department=self.department)
        self.client.force_authenticate(self.admin)
        url = reverse('department-teams', args=[self.department.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class TeamViewSetTests(APITestCase):
    list_url = reverse('team-list')

    def setUp(self):
        self.department = Department.objects.create(name='Engineering')
        self.admin = CustomUser.objects.create_user(
            username='admin', email='admin@example.com', password='pass12345',
            role='admin',
        )
        self.manager = CustomUser.objects.create_user(
            username='manager', email='manager@example.com', password='pass12345',
            role='manager',
        )
        self.employee = CustomUser.objects.create_user(
            username='emp', email='emp@example.com', password='pass12345',
            role='employee',
        )
        self.team = Team.objects.create(
            name='Backend', department=self.department, manager=self.manager
        )

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_teams(self):
        self.client.force_authenticate(self.employee)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_retrieve_uses_detail_serializer(self):
        self.client.force_authenticate(self.admin)
        url = reverse('team-detail', args=[self.team.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # TeamDetailSerializer nests the full department object
        self.assertIsInstance(response.data['department'], dict)
        self.assertEqual(response.data['department']['name'], 'Engineering')

    def test_create_team(self):
        self.client.force_authenticate(self.admin)
        payload = {'name': 'Frontend', 'department': self.department.id}
        response = self.client.post(self.list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_member_success(self):
        self.client.force_authenticate(self.manager)
        url = reverse('team-add-member', args=[self.team.id])
        response = self.client.post(url, {'user_id': self.employee.id, 'role': 'member'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            TeamMember.objects.filter(team=self.team, user=self.employee).exists()
        )

    def test_add_member_missing_user_id(self):
        self.client.force_authenticate(self.manager)
        url = reverse('team-add-member', args=[self.team.id])
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_member_duplicate_rejected(self):
        TeamMember.objects.create(team=self.team, user=self.employee)
        self.client.force_authenticate(self.manager)
        url = reverse('team-add-member', args=[self.team.id])
        response = self.client.post(url, {'user_id': self.employee.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_member_success(self):
        TeamMember.objects.create(team=self.team, user=self.employee)
        self.client.force_authenticate(self.manager)
        url = reverse('team-remove-member', args=[self.team.id])
        response = self.client.delete(url, {'user_id': self.employee.id})
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            TeamMember.objects.filter(team=self.team, user=self.employee).exists()
        )

    def test_remove_member_not_found(self):
        self.client.force_authenticate(self.manager)
        url = reverse('team-remove-member', args=[self.team.id])
        response = self.client.delete(url, {'user_id': self.employee.id})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_my_teams_returns_only_teams_user_belongs_to(self):
        other_team = Team.objects.create(name='Frontend', department=self.department)
        TeamMember.objects.create(team=self.team, user=self.employee)
        self.client.force_authenticate(self.employee)
        response = self.client.get(reverse('team-my-teams'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        team_ids = {t['id'] for t in response.data}
        self.assertEqual(team_ids, {self.team.id})
        self.assertNotIn(other_team.id, team_ids)
