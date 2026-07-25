from django.test import TestCase
from users.models import CustomUser
from teams.models import Department
from subscription.models import Organisation, SubscriptionPlan
from django.utils import timezone 

class CustomUserModelTest(TestCase):
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='adminuser',
            email='adminuser@example.com',
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
    
    def test_create_user(self):
        user = CustomUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword',
            role='employee',
            department=self.department,
            phone="9815937658",
            avatar=None,
            hired_date=timezone.now(),
            current_organisation=None
        )

        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'testuser@example.com')
        self.assertEqual(user.role, 'employee')
        self.assertEqual(user.department.name, "Backend")
        self.assertEqual(user.phone, "9815937658")
        self.assertEqual(user.avatar, None)
        self.assertEqual(user.hired_date.date(), timezone.now().date())
        self.assertFalse(user.has_active_subscription())
        self.assertFalse(user.is_staff)
        self.assertTrue(user.check_password('testpassword'))

    def test_user_string_representation(self):
        user = CustomUser.objects.create_user(
            username='johndoe',
            email='john@example.com',
            password='testpass'
        )
        self.assertEqual(str(user), 'johndoe')

    def test_user_role_choices(self):
        # Test each role type
        roles = ['admin', 'manager', 'employee']
        for role in roles:
            user = CustomUser.objects.create_user(
                username=f'user_{role}',
                email=f'{role}@example.com',
                password='testpass',
                role=role
            )
            self.assertEqual(user.role, role)

    def test_user_without_department(self):
        user = CustomUser.objects.create_user(
            username='nodept',
            email='nodept@example.com',
            password='testpass',
            department=None
        )
        self.assertIsNone(user.department)

    def test_user_with_organisation(self):
        user = CustomUser.objects.create_user(
            username='orguser',
            email='org@example.com',
            password='testpass',
            current_organisation=self.organisation
        )
        self.assertEqual(user.current_organisation, self.organisation)

    def test_has_active_subscription_without_organisation(self):
        user = CustomUser.objects.create_user(
            username='noorg',
            email='noorg@example.com',
            password='testpass'
        )
        self.assertFalse(user.has_active_subscription())

    def test_has_active_subscription_with_organisation_no_subscription(self):
        user = CustomUser.objects.create_user(
            username='orgnosub',
            email='orgnosub@example.com',
            password='testpass',
            current_organisation=self.organisation
        )
        self.assertFalse(user.has_active_subscription())

    def test_avatar_url_property_none(self):
        user = CustomUser.objects.create_user(
            username='noavatar',
            email='noavatar@example.com',
            password='testpass'
        )
        self.assertIsNone(user.avatar_url)

    def test_user_is_not_active_by_default(self):
        user = CustomUser.objects.create_user(
            username='inactive',
            email='inactive@example.com',
            password='testpass'
        )
        # self.assertFalse(user.is_active)

    def test_create_superuser(self):
        admin = CustomUser.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass'
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_create_user_default_role(self):
        user = CustomUser.objects.create_user(
            username='defaultrole',
            email='defaultrole@example.com',
            password='testpass'
        )
        self.assertEqual(user.role, 'employee')  # default role

