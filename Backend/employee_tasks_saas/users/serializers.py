from datetime import datetime

from rest_framework import serializers
from .models import CustomUser
from subscription.models import Organisation, OrganisationMember, Subscription, SubscriptionPlan,Invitation
from django.utils.text import slugify
from datetime import timedelta


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'phone', 'department', 'avatar',
            'avatar_url'
        ]
        read_only_fields = ['id']

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class UserListSerializer(serializers.ModelSerializer):
    """Simplified serializer for lists"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'role']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'},
                                      label='Confirm Password')
    organisation_name = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        if CustomUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        org_name = validated_data.pop('organisation_name')
        

        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role = "admin"
        )

        base_slug = slugify(org_name)
        slug = base_slug
        counter = 1
        while Organisation.objects.filter(slug= slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        org = Organisation.objects.create(
            name=org_name,
            slug= slug,
            owner=user,
            email = user.email
        )
        user.organisation = org
        user.save()

        OrganisationMember.objects.create(organisation=org,user = user,role = "admin")
        free_plan = SubscriptionPlan.objects.filter(name="free").first()

        if free_plan:
            Subscription.objects.create(
                organisation=org,
                plan=free_plan,
                start_date = datetime.now(),
                end_date = datetime.now() + timedelta(days=14),
                is_Trial = True,
                trial_end_date = datetime.now() + timedelta(days=14),
                status= 'trial'
            )


        return user

class AcceptInvitationSerializer(serializers.ModelSerializer):
    # Role and organisation will be set in the view based on the invitation
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'},)

    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'password2', 'first_name', 'last_name','token']

    def validate(self, attrs):
                if attrs['password'] != attrs['password2']:
                    raise serializers.ValidationError({"password": "Passwords don't match."})
                
                try:
                    invitation = Invitation.objects.get(token = attrs['token'])
                except Invitation.DoesNotExist:
                    raise serializers.ValidationError({"token": "Invalid invitation token."})
                
                if not invitation.is_valid():
                    raise serializers.ValidationError({"token": "Invitation token has expired or is invalid."})
                
                attrs['invitation'] = invitation
                return attrs
        
    def create(self, validated_data):
            validated_data.pop('password2')
            invitation = validated_data.pop('invitation')
            token = validated_data.pop('token')

            # Role, Organisation, and email will come from the invitation

            user = CustomUser.objects.create_user(
                username = validated_data['username'],
                email = invitation.email,
                password = validated_data['password'],
                first_name = validated_data.get('first_name', ''),
                last_name = validated_data.get('last_name', ''),
                role = invitation.role,
                
            )
            user.organization = invitation.organisation
            user.save()


            OrganisationMember.objects.create(
                organisation = invitation.organisation,
                user = user,
                role = 'member',
                invited_by = invitation.invited_by

            )
            invitation.status = 'accepted'
            invitation.save()

            return user
        

            




