from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskDetailSerializer, TaskCommentSerializer
from .permissions import TaskPermission


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, TaskPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'project']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'due_date', 'priority']

    def get_queryset(self):
        """
        Filter tasks based on user role
        """
        user = self.request.user

        if user.role == 'admin':
            # Admin sees all tasks
            return Task.objects.all()

        elif user.role == 'manager':
            # Manager sees:
            # 1. Tasks they created
            # 2. Tasks in projects they own
            # 3. Tasks assigned to their team members
            return Task.objects.filter(
                Q(created_by=user) |
                Q(project__owner=user) |
                Q(assigned_to__team_memberships__team__manager=user)
            ).distinct()

        else:  # employee
            # Employee sees only tasks assigned to them
            return Task.objects.filter(assigned_to=user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        """
        Set the creator when task is created
        Only Admin and Manager can create tasks
        """
        user = self.request.user

        if user.role not in ['admin', 'manager']:
            raise PermissionDenied("Only admins and managers can create tasks")

        serializer.save(created_by=user)

    def perform_update(self, serializer):
        """
        Handle different update permissions for different roles
        """
        user = self.request.user
        task = self.get_object()

        # Employee can only update status
        if user.role == 'employee':
            # Only allow status update
            allowed_fields = {'status', 'completed_at'}
            update_fields = set(self.request.data.keys())

            if not update_fields.issubset(allowed_fields):
                raise PermissionDenied("Employees can only update task status")

            # If status is being set to 'done', set completed_at
            if self.request.data.get('status') == 'done':
                from django.utils import timezone
                serializer.save(completed_at=timezone.now())
            else:
                serializer.save()
        else:
            # Admin and Manager can update anything
            serializer.save()

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a task - all users can comment on their tasks"""
        task = self.get_object()
        text = request.data.get('text')

        if not text:
            return Response(
                {'error': 'Text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        comment = TaskComment.objects.create(
            task=task,
            user=request.user,
            text=text
        )

        serializer = TaskCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to current user"""
        tasks = Task.objects.filter(assigned_to=request.user)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get task statistics based on user role"""
        user = request.user
        tasks = self.get_queryset()

        stats = {
            'total': tasks.count(),
            'todo': tasks.filter(status='todo').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'review': tasks.filter(status='review').count(),
            'done': tasks.filter(status='done').count(),
            'overdue': sum(1 for task in tasks if task.is_overdue()),
            'by_priority': {
                'low': tasks.filter(priority='low').count(),
                'medium': tasks.filter(priority='medium').count(),
                'high': tasks.filter(priority='high').count(),
                'urgent': tasks.filter(priority='urgent').count(),
            }
        }

        return Response(stats)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Quick endpoint to update only task status
        Employees can use this
        """
        task = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status not in dict(Task.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user can update this task
        if request.user.role == 'employee' and task.assigned_to != request.user:
            return Response(
                {'error': 'You can only update your own tasks'},
                status=status.HTTP_403_FORBIDDEN
            )

        task.status = new_status

        # Set completed_at when status is 'done'
        if new_status == 'done':
            from django.utils import timezone
            task.completed_at = timezone.now()

        task.save()

        serializer = self.get_serializer(task)
        return Response(serializer.data)