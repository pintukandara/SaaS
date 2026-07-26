from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from tasks.models import Task, TaskComment
from users.models import CustomUser


class TaskModelTests(TestCase):
    def setUp(self):
        self.creator = CustomUser.objects.create_user(
            username='creator', email='creator@example.com', password='pass12345',
            role='manager',
        )
        self.assignee = CustomUser.objects.create_user(
            username='assignee', email='assignee@example.com', password='pass12345',
            role='employee',
        )

    def test_str_representation(self):
        task = Task.objects.create(title='Fix bug', created_by=self.creator)
        self.assertEqual(str(task), 'Fix bug')

    def test_default_status_and_priority(self):
        task = Task.objects.create(title='New task', created_by=self.creator)
        self.assertEqual(task.priority, 'medium')

    def test_is_overdue_false_without_due_date(self):
        task = Task.objects.create(title='No due date', created_by=self.creator)
        self.assertFalse(task.is_overdue())

    def test_is_overdue_true_when_past_due_and_not_done(self):
        task = Task.objects.create(
            title='Overdue',
            created_by=self.creator,
            due_date=timezone.now() - timedelta(days=1),
            status='in_progress',
        )
        self.assertTrue(task.is_overdue())

    def test_is_overdue_false_when_done_even_if_past_due(self):
        task = Task.objects.create(
            title='Done late',
            created_by=self.creator,
            due_date=timezone.now() - timedelta(days=1),
            status='done',
        )
        self.assertFalse(task.is_overdue())

    def test_is_overdue_false_for_future_due_date(self):
        task = Task.objects.create(
            title='Future',
            created_by=self.creator,
            due_date=timezone.now() + timedelta(days=1),
        )
        self.assertFalse(task.is_overdue())

    def test_assigned_to_set_null_on_user_delete(self):
        task = Task.objects.create(
            title='Assigned', created_by=self.creator, assigned_to=self.assignee
        )
        self.assignee.delete()
        task.refresh_from_db()
        self.assertIsNone(task.assigned_to)

    def test_created_by_cascade_on_user_delete(self):
        task = Task.objects.create(title='Owned', created_by=self.creator)
        self.creator.delete()
        self.assertFalse(Task.objects.filter(id=task.id).exists())


class TaskCommentModelTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='commenter', email='commenter@example.com', password='pass12345'
        )
        self.task = Task.objects.create(title='Commented task', created_by=self.user)

    def test_str_representation(self):
        comment = TaskComment.objects.create(
            task=self.task, user=self.user, text='Looks good'
        )
        self.assertIn(self.user.username, str(comment))
        self.assertIn(self.task.title, str(comment))
