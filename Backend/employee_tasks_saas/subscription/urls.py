from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    SubscriptionPlanViewSet, OrganisationViewSet,
    SubscriptionViewSet, UsageTrackingViewSet
)

router = SimpleRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'organisations', OrganisationViewSet, basename='organisations')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'usage', UsageTrackingViewSet, basename='usage')

urlpatterns = [
    path('', include(router.urls)),
]