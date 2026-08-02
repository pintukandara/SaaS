from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_invitation_email(email, org_name, role, invite_link):
    subject = f"You are invited to join {org_name}"
    message = (
        f"Click here to accept: {invite_link}\n"
        f"You will join as: {role}"
    )
    from_email = (
        getattr(settings, "DEFAULT_FROM_EMAIL", None)
        or getattr(settings, "EMAIL_HOST_USER", "noreply@taskflow.com")
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[email],
        fail_silently=True,
    )

    return f"Invitation email sent to {email}"
