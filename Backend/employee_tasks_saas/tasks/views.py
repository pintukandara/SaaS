from django.db import models
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskDetailSerializer, TaskCommentSerializer


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'project']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'due_date', 'priority']

    def get_queryset(self):
        """
        Users see tasks they created or are assigned to
        Admins and managers see all tasks
        """
        user = self.request.user

        if user.role == 'admin':
            return Task.objects.all()
        elif user.role == 'manager':
            # Managers see tasks in their teams
            return Task.objects.filter(
                models.Q(created_by=user) |
                models.Q(assigned_to=user) |
                models.Q(project__team__manager=user)
            ).distinct()
        else:
            # Employees see tasks they created or are assigned to
            return Task.objects.filter(
                models.Q(created_by=user) | models.Q(assigned_to=user)
            ).distinct()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a task"""
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
        """Get task statistics for dashboard"""
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