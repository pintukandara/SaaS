"""
API endpoint tests for the tasks app.

Covers:
    GET/POST /api/tasks/
    GET/PUT/PATCH/DELETE /api/tasks/<pk>/
    POST     /api/tasks/<pk>/add_comment/
    PATCH    /api/tasks/<pk>/update_status/
    GET      /api/tasks/my_tasks/
    GET      /api/tasks/statistics/
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from tasks.models import Task, TaskComment
from teams.models import Department, Team, TeamMember
from users.models import CustomUser


class TaskViewSetBaseTestCase(APITestCase):
    list_url = reverse('task-list')

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
        self.other_employee = CustomUser.objects.create_user(
            username='other', email='other@example.com', password='pass12345',
            role='employee',
        )
        self.team = Team.objects.create(
            name='Backend', department=self.department, manager=self.manager
        )
        TeamMember.objects.create(team=self.team, user=self.employee)

        self.task_for_employee = Task.objects.create(
            title='Employee task',
            created_by=self.manager,
            assigned_to=self.employee,
        )
        self.task_unrelated = Task.objects.create(
            title='Other task',
            created_by=self.admin,
            assigned_to=self.other_employee,
        )


class TaskListTests(TaskViewSetBaseTestCase):
    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_sees_all_tasks(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], Task.objects.count())

    def test_employee_sees_only_assigned_tasks(self):
        self.client.force_authenticate(self.employee)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = {t['title'] for t in response.data['results']}
        self.assertEqual(titles, {'Employee task'})

    def test_manager_sees_tasks_for_their_team(self):
        self.client.force_authenticate(self.manager)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = {t['title'] for t in response.data['results']}
        # manager created "Employee task" AND employee is on their team
        self.assertIn('Employee task', titles)
        self.assertNotIn('Other task', titles)


class TaskCreateTests(TaskViewSetBaseTestCase):
    def test_admin_can_create_task(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(self.list_url, {'title': 'New task'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # created_by_name is sourced straight from created_by.get_full_name(),
        # with no username fallback (unlike UserSerializer.get_full_name) --
        # so it's an empty string here since the admin has no first/last name.
        self.assertEqual(response.data['created_by_name'], self.admin.get_full_name())

    def test_manager_can_create_task(self):
        self.client.force_authenticate(self.manager)
        response = self.client.post(self.list_url, {'title': 'Manager task'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_employee_cannot_create_task(self):
        self.client.force_authenticate(self.employee)
        response = self.client.post(self.list_url, {'title': 'Should fail'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_requires_title(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(self.list_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TaskRetrieveUpdateDeleteTests(TaskViewSetBaseTestCase):
    def test_employee_can_view_own_task(self):
        self.client.force_authenticate(self.employee)
        url = reverse('task-detail', args=[self.task_for_employee.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_cannot_view_unrelated_task(self):
        self.client.force_authenticate(self.employee)
        url = reverse('task-detail', args=[self.task_unrelated.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_employee_can_update_status_only(self):
        self.client.force_authenticate(self.employee)
        url = reverse('task-detail', args=[self.task_for_employee.id])
        response = self.client.patch(url, {'status': 'in_progress'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task_for_employee.refresh_from_db()
        self.assertEqual(self.task_for_employee.status, 'in_progress')

    def test_employee_cannot_update_other_fields(self):
        self.client.force_authenticate(self.employee)
        url = reverse('task-detail', args=[self.task_for_employee.id])
        response = self.client.patch(url, {'title': 'Hacked title'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_marking_done_sets_completed_at(self):
        self.client.force_authenticate(self.employee)
        url = reverse('task-detail', args=[self.task_for_employee.id])
        response = self.client.patch(url, {'status': 'done'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task_for_employee.refresh_from_db()
        self.assertIsNotNone(self.task_for_employee.completed_at)

    def test_admin_can_delete_task(self):
        self.client.force_authenticate(self.admin)
        url = reverse('task-detail', args=[self.task_for_employee.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_employee_cannot_delete_task(self):
        self.client.force_authenticate(self.employee)
        url = reverse('task-detail', args=[self.task_for_employee.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TaskCommentActionTests(TaskViewSetBaseTestCase):
    """
    NOTE (BUG-04): TaskPermission.has_object_permission() has no branch for
    POST requests -- it only special-cases SAFE_METHODS, PUT/PATCH and
    DELETE, and admins via the early `if user.role == 'admin': return True`.
    Every other role therefore falls through to the final `return False`,
    even though add_comment's docstring says "all users can comment on
    their tasks". These tests document the *current* (broken) behaviour;
    once a POST branch is added to TaskPermission this whole class should
    be rewritten to assert success for the task's assignee/creator.
    """

    def test_add_comment_forbidden_for_employee_on_own_task(self):
        self.client.force_authenticate(self.employee)
        url = reverse('task-add-comment', args=[self.task_for_employee.id])
        response = self.client.post(url, {'text': 'Working on it'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            TaskComment.objects.filter(
                task=self.task_for_employee, text='Working on it'
            ).exists()
        )

    def test_add_comment_forbidden_for_manager_on_own_created_task(self):
        self.client.force_authenticate(self.manager)
        url = reverse('task-add-comment', args=[self.task_for_employee.id])
        response = self.client.post(url, {'text': 'Status?'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_comment_succeeds_for_admin(self):
        self.client.force_authenticate(self.admin)
        url = reverse('task-add-comment', args=[self.task_for_employee.id])
        response = self.client.post(url, {'text': 'Admin note'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            TaskComment.objects.filter(
                task=self.task_for_employee, text='Admin note'
            ).exists()
        )


class TaskUpdateStatusActionTests(TaskViewSetBaseTestCase):
    url_name = 'task-update-status'

    def test_update_status_success(self):
        self.client.force_authenticate(self.employee)
        url = reverse(self.url_name, args=[self.task_for_employee.id])
        response = self.client.patch(url, {'status': 'review'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_status_missing_status(self):
        self.client.force_authenticate(self.employee)
        url = reverse(self.url_name, args=[self.task_for_employee.id])
        response = self.client.patch(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_status_invalid_value(self):
        self.client.force_authenticate(self.employee)
        url = reverse(self.url_name, args=[self.task_for_employee.id])
        response = self.client.patch(url, {'status': 'not-a-real-status'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_employee_cannot_update_status_of_unrelated_task(self):
        """
        This task is only reachable via get_object() -> get_queryset(),
        which already filters employees down to their own tasks, so the
        explicit role check inside update_status is currently unreachable
        for employees (the object lookup 404s first). Documented here.
        """
        self.client.force_authenticate(self.employee)
        url = reverse(self.url_name, args=[self.task_unrelated.id])
        response = self.client.patch(url, {'status': 'review'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TaskMyTasksAndStatisticsTests(TaskViewSetBaseTestCase):
    def test_my_tasks_returns_only_assigned(self):
        self.client.force_authenticate(self.employee)
        response = self.client.get(reverse('task-my-tasks'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = {t['title'] for t in response.data}
        self.assertEqual(titles, {'Employee task'})

    def test_statistics_requires_authentication(self):
        response = self.client.get(reverse('task-statistics'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_statistics_totals_for_admin(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse('task-statistics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], Task.objects.count())
        self.assertIn('by_priority', response.data)

    def test_statistics_scoped_for_employee(self):
        self.client.force_authenticate(self.employee)
        response = self.client.get(reverse('task-statistics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 1)
