from datetime import timedelta
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.conf import settings
from Backend.employee_tasks_saas.users.utils import generate_email_verify_token
from .models import CustomUser
from celery import shared_task

@shared_task
def delete_unauthenticated_users():
    time_limit = timezone.now() - timedelta(minutes=5)

    users = CustomUser.objects.filter(is_active=False, date_joined__lt=time_limit)
    if users:
        count = users.count()
        users.delete()
        print(f"{count} expired inactive users deleted")
    return "Done"

@shared_task
def delete_completed_tasks():
    print("deleting completed Tasks")
    return "Ho gya"

@shared_task(bind=True)
def send_verification_email(self, user_id):
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return f"User not found with id={user_id}"

    token = generate_email_verify_token(user)
    verify_url = f"http://127.0.0.1:8000/api/verify-email/?token={token}"

    send_mail(
        subject="Verify your email",
        message=f"Click to verify your email: {verify_url}",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return f"Verification email sent to {user.email}"

@shared_task(bind=True)
def send_password_reset_email(self,email):
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return f"User not found with id={email}"

    token_gen = PasswordResetTokenGenerator()
    token = token_gen.make_token(user)
    uidb64 = urlsafe_base64_encode(force_bytes(user.id))
    print(uidb64)
    print(token)
    reset_url = f"http://127.0.0.1:8000/api/reset-password/?uidb64={uidb64}&token={token}"
    send_mail(
        subject="Reset your password",
        message=f"Click this link to reset password: {reset_url}",
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return f"Password Reset link send to {email}"