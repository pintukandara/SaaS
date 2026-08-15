from subscription.permissions import HasActiveSubscription, WithInProjectLimit, WithInUsageLimits
from .serializers import ProjectSerializer, ProjectDetailSerializer, ProjectMemberSerializer
from rest_framework.permissions import IsAuthenticated
from .models import Project, ProjectMember
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from typing import cast

from users.models import CustomUser

from .permissions import ProjectPermission

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, ProjectPermission, HasActiveSubscription, WithInUsageLimits, WithInProjectLimit]
    
    def get_queryset(self):
        user: CustomUser = cast(CustomUser, self.request.user)
        
        if user.role == 'admin':
            return Project.objects.filter(organisation=user.current_organisation)
        elif user.role == 'manager':
            # Projects they own or manage via team
            return Project.objects.filter(
                organisation=user.current_organisation
            ).distinct()
        else:
            # Projects in teams they'repart of
            return Project.objects.filter(
                team__members__user=user,
                organisation=user.current_organisation
            ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer
    
    def perform_create(self, serializer):
        """Only admin can create projects"""
        user: CustomUser = cast(CustomUser, self.request.user)

        if user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can create projects")


        serializer.save(owner=user, organisation=user.current_organisation)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the project"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(id=user_id)
            
            # Check if already a member
            if ProjectMember.objects.filter(project=project, user=user).exists():
                return Response(
                    {'error': 'User is already a member of this project'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            member = ProjectMember.objects.create(
                project=project,
                user=user,
                role=role
            )
            
            serializer = ProjectMemberSerializer(member)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Remove a member from the project"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            member = ProjectMember.objects.get(project=project, user_id=user_id)
            member.delete()
            return Response(
                {'message': 'Member removed successfully'},
                status=status.HTTP_200_OK
            )
        except ProjectMember.DoesNotExist:
            return Response(
                {'error': 'Member not found in this project'},
                status=status.HTTP_404_NOT_FOUND
            )