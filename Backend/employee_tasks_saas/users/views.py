from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets

from Backend.employee_tasks_saas.subscription.models import Invitation
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer, UserListSerializer, AcceptInvitationSerializer 


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user, context={'request': request}).data,
            "message": "User created successfully and Organisation created successfully."
        }, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


# ✅ NEW: Users List ViewSet
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and retrieving users
    - Admin: Can see all users
    - Manager: Can see their team members
    - Employee: Cannot access this endpoint
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            # Admin sees all users
            return CustomUser.objects.all().order_by('first_name', 'last_name')

        elif user.role == 'manager':
            # Manager sees users in their teams
            from teams.models import TeamMember
            team_member_ids = TeamMember.objects.filter(
                team__manager=user
            ).values_list('user_id', flat=True)

            return CustomUser.objects.filter(
                id__in=team_member_ids
            ).order_by('first_name', 'last_name')

        else:
            # Employees cannot list users
            return CustomUser.objects.none()


class AcceptInvitationView(generics.CreateAPIView):
    # accept an invitation role and organisation will be set in the view based on the invitation

    queryset = CustomUser.objects.all()
    serializer_class = AcceptInvitationSerializer
    permission_classes = [permissions.AllowAny]


    def create(self,request, *args, **kwargs):
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            "user": UserSerializer(user, context={'request': request}).data,
            "message": "User created successfully and invitation accepted."
        }, status=status.HTTP_201_CREATED)


class VerifyInvitationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            invitation = Invitation.objects.get(token= token)
        except Invitation.DoesNotExist:
            return Response({"error": "Invalid invitation token."}, status=status.HTTP_400_BAD_REQUEST)
        

        if not invitation.is_valid():
            return Response({"error": "Invitation token has expired or is already used."}, status= status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'email': invitation.email,
            'role': invitation.role,
            'organisation': invitation.organisation.name
        })

        