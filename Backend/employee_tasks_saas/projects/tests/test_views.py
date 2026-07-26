"""
API endpoint tests for the projects app.

Covers:
    GET/POST /api/projects/
    GET/PUT/PATCH/DELETE /api/projects/<pk>/
    POST     /api/projects/<pk>/add_member/
    DELETE   /api/projects/<pk>/remove_member/
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import Project, ProjectMember
from teams.models import Department, Team, TeamMember
from users.models import CustomUser


class ProjectViewSetBaseTestCase(APITestCase):
    list_url = reverse('project-list')

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
            username='employee', email='employee@example.com', password='pass12345',
            role='employee',
        )
        self.outsider = CustomUser.objects.create_user(
            username='outsider', email='outsider@example.com', password='pass12345',
            role='employee',
        )
        self.team = Team.objects.create(
            name='Backend', department=self.department, manager=self.manager
        )
        TeamMember.objects.create(team=self.team, user=self.employee)

        self.managers_project = Project.objects.create(
            name="Manager's project", owner=self.manager, team=self.team
        )
        self.unrelated_project = Project.objects.create(
            name='Unrelated project', owner=self.admin
        )


class ProjectListTests(ProjectViewSetBaseTestCase):
    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_sees_all_projects(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], Project.objects.count())

    def test_manager_sees_owned_and_team_projects(self):
        self.client.force_authenticate(self.manager)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = {p['name'] for p in response.data['results']}
        self.assertEqual(names, {"Manager's project"})

    def test_employee_sees_projects_via_team(self):
        self.client.force_authenticate(self.employee)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = {p['name'] for p in response.data['results']}
        self.assertEqual(names, {"Manager's project"})

    def test_outsider_sees_no_projects(self):
        self.client.force_authenticate(self.outsider)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


class ProjectCreateTests(ProjectViewSetBaseTestCase):
    def test_admin_can_create_project(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            self.list_url, {'name': 'New project', 'owner': self.admin.id}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_manager_cannot_create_project(self):
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            self.list_url, {'name': 'Should fail', 'owner': self.manager.id}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_cannot_create_project(self):
        self.client.force_authenticate(self.employee)
        response = self.client.post(
            self.list_url, {'name': 'Should fail', 'owner': self.employee.id}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProjectRetrieveUpdateDeleteTests(ProjectViewSetBaseTestCase):
    def test_retrieve_uses_detail_serializer(self):
        self.client.force_authenticate(self.admin)
        url = reverse('project-detail', args=[self.managers_project.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # ProjectDetailSerializer nests the full owner object
        self.assertIsInstance(response.data['owner'], dict)

    def test_employee_outside_team_gets_404_on_retrieve(self):
        self.client.force_authenticate(self.outsider)
        url = reverse('project-detail', args=[self.managers_project.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_can_update_own_project(self):
        self.client.force_authenticate(self.manager)
        url = reverse('project-detail', args=[self.managers_project.id])
        response = self.client.patch(url, {'status': 'active'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.managers_project.refresh_from_db()
        self.assertEqual(self.managers_project.status, 'active')

    def test_manager_cannot_update_project_they_do_not_own(self):
        self.client.force_authenticate(self.manager)
        url = reverse('project-detail', args=[self.unrelated_project.id])
        response = self.client.patch(url, {'status': 'active'})
        # Not in manager's queryset at all -> 404, not 403
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_delete_project(self):
        self.client.force_authenticate(self.admin)
        url = reverse('project-detail', args=[self.managers_project.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_manager_cannot_delete_project(self):
        self.client.force_authenticate(self.manager)
        url = reverse('project-detail', args=[self.managers_project.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProjectMemberActionTests(ProjectViewSetBaseTestCase):
    def test_add_member_success(self):
        self.client.force_authenticate(self.admin)
        url = reverse('project-add-member', args=[self.managers_project.id])
        response = self.client.post(url, {'user_id': self.employee.id, 'role': 'contributor'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ProjectMember.objects.filter(
                project=self.managers_project, user=self.employee
            ).exists()
        )

    def test_add_member_missing_user_id(self):
        self.client.force_authenticate(self.admin)
        url = reverse('project-add-member', args=[self.managers_project.id])
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_member_unknown_user(self):
        self.client.force_authenticate(self.admin)
        url = reverse('project-add-member', args=[self.managers_project.id])
        response = self.client.post(url, {'user_id': 999999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_member_duplicate_rejected(self):
        ProjectMember.objects.create(project=self.managers_project, user=self.employee)
        self.client.force_authenticate(self.admin)
        url = reverse('project-add-member', args=[self.managers_project.id])
        response = self.client.post(url, {'user_id': self.employee.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_member_success(self):
        ProjectMember.objects.create(project=self.managers_project, user=self.employee)
        self.client.force_authenticate(self.admin)
        url = reverse('project-remove-member', args=[self.managers_project.id])
        response = self.client.delete(url, {'user_id': self.employee.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            ProjectMember.objects.filter(
                project=self.managers_project, user=self.employee
            ).exists()
        )

    def test_remove_member_not_found(self):
        self.client.force_authenticate(self.admin)
        url = reverse('project-remove-member', args=[self.managers_project.id])
        response = self.client.delete(url, {'user_id': self.employee.id})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_remove_member_missing_user_id(self):
        self.client.force_authenticate(self.admin)
        url = reverse('project-remove-member', args=[self.managers_project.id])
        response = self.client.delete(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
