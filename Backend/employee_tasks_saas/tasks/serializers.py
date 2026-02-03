from rest_framework import serializers
from .models import Task,TaskComment,TaskAttachment
from users.serializers import UserSerializer




class TaskCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ('id', 'user', 'text', 'created_at', 'updated_at')
        read_only_fields = ('id','created_at', 'updated_at')

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ['id', 'file', 'filename', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'project', 'project_name',
            'assigned_to', 'assigned_to_name',
            'created_by', 'created_by_name',
            'due_date', 'created_at', 'updated_at', 'completed_at',
            'estimated_hours', 'tags', 'is_overdue', 'comment_count'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_comment_count(self, obj):
        return obj.comments.count()

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskDetailSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    project = serializers.StringRelatedField(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'



