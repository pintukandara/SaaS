from rest_framework_simplejwt.tokens import AccessToken

def generate_email_verify_token(user):
    token = AccessToken.for_user(user)
    token['purpose'] = "verify_email"
    return str(token)


def reset_password_token(user):
    token = AccessToken.for_user(user)
    token['purpose'] = "reset_password"
    return str(token)