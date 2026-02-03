from crypt import methods

from django.core.serializers import serialize
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from projects.models import Project, ProjectMember
from projects.serializers import ProjectDetailSerializer, ProjectSerializer, ProjectMemberSerializer


# Create your views here.
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(user = self.request.user)

    @action(detail = True,methods= ['post'])
    def add_member(self,request,pk = None):
          project = self.get_object()
          user_id = request.data.get('user_id')
          role = request.data.get('role',"member")
          if ProjectMember.objects.filter(user_id = user_id,role = role,project = project).exists():
              return Response({'message' : 'User already exists!'}, status = status.HTTP_400_BAD_REQUEST)
          member = ProjectMember.objects.create(
              user_id = user_id,
              role = role,
              project = project,
          )
          serializer = ProjectMemberSerializer(member)
          return Response(serializer.data, status = status.HTTP_201_CREATED)










