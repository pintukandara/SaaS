from users.serializers import UserSerializer,UserListSerializer,RegisterSerializer,AcceptInvitationSerializer
from rest_framework.test import APITestCase
from django.utils import timezone
from teams.models import Department
from subscription.models import Organisation, SubscriptionPlan


from users.models import CustomUser

# Create your tests here.

class UserSerializerTestCase(APITestCase):
     def setUp(self):
        self.user = CustomUser.objects.create_user(
                     username='testuser',
                     email='testuser@example.com',
                     password='testpassword',
                     role='employee',
                     phone="9815937658",
                     avatar=None,
                     hired_date=timezone.now(),
                     current_organisation=None
                 )
        self.department = Department.objects.create(name="Backend")
        self.organisation = Organisation.objects.create(
                     name="Test Org",
                     slug="test-org",
                     description="A test organisation",
                     owner=self.user,
                     email="org@example.com"
                 )
        self.plan = SubscriptionPlan.objects.create(
                     name="professional",
                     display_name="Professional Plan",
                     description="A professional subscription plan",
                     price=99.99,
                     max_users=10,
                     max_projects=20,
                     max_storage_mb=102400
                 )
     def test_user_serializer_valid_data(self):
        data = {
            'username': "adminuser",
            'email': "adminuser@example.com",
            'first_name': "Admin",
            'last_name': "User",
            'role':"admin",
            'phone': "9815937658",
            'department':self.department.id,
            'avatar': None,
            # 'avatar_url':None

        }

        serializer = UserSerializer(data = data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.errors ,{})

    
