from rest_framework import serializers
from rest_framework import serializers
from .models import Department, Team, TeamMember
from users.serializers import UserSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    team_count = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'team_count', 'employee_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_team_count(self, obj):
        return obj.teams.count()
    
    def get_employee_count(self, obj):
        return obj.employees.count()


class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class TeamSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    members = TeamMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = [
            'id', 'name', 'department', 'department_name', 
            'manager', 'manager_name', 'description',
            'members', 'member_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_member_count(self, obj):
        return obj.members.count()


class TeamDetailSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    manager = UserSerializer(read_only=True)
    members = TeamMemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'department', 'manager', 'description', 'members', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']