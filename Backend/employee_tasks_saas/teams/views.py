from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminOrManagerCreateTeams
from .models import Department, Team, TeamMember
from .serializers import (
    DepartmentSerializer, 
    TeamSerializer, 
    TeamDetailSerializer,
    TeamMemberSerializer
)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def teams(self, request, pk=None):
        """Get all teams in a department"""
        department = self.get_object()
        teams = department.teams.all()
        serializer = TeamSerializer(teams, many=True)
        return Response(serializer.data)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TeamDetailSerializer
        return TeamSerializer
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the team"""
        team = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if member already exists
        if TeamMember.objects.filter(team=team, user_id=user_id).exists():
            return Response(
                {'error': 'User is already a member'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member = TeamMember.objects.create(
            team=team,
            user_id=user_id,
            role=role
        )
        
        serializer = TeamMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Remove a member from the team"""
        team = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            member = TeamMember.objects.get(team=team, user_id=user_id)
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TeamMember.DoesNotExist:
            return Response(
                {'error': 'Member not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_teams(self, request):
        """Get teams the current user is a member of"""
        user_teams = Team.objects.filter(members__user=request.user)
        serializer = self.get_serializer(user_teams, many=True)
        return Response(serializer.data)

