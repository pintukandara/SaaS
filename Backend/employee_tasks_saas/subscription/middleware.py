from django.utils.deprecation import MiddlewareMixin


class OrganisationMiddleware(MiddlewareMixin):
    """
    Middleware to attach the current user's organization to the request object.
    This allows easy access to the organization in views and other parts of the code.
    """

    def process_request(self, request):
        if request.user.is_authenticated:
            # Assuming a user can belong to only one organization for simplicity
            organisation = request.user.current_organisation  # This should be defined in the User model or through a related model
            request.organisation = organisation
        else:
            request.organisation = None