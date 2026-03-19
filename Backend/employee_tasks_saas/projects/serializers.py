from rest_framework import serializers
from .models import Project, ProjectMember
from users.serializers import UserSerializer


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only = True,required = False)


    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'role', 'joined_at']


class ProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    task_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status',
            'owner', 'owner_name',
            'team', 'team_name',
            'start_date', 'end_date',
            'task_count', 'member_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_team(self, obj):
        if obj.team:
            return {
                'id': obj.team.id,
                'name': obj.team.name,
                'department_name': obj.team.department.name if obj.team.department else None
            }
        return None


class ProjectDetailSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'