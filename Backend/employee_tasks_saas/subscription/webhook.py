from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json
import razorpay
from razorpay.errors import SignatureVerificationError
from razorpay.utility import Utility
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Subscription, Payment, Invoice

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    """
    Razorpay calls this. Never trust the payload until the signature
    checks out — this is the ONLY thing that authenticates the request,
    there's no user token involved.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get("X-Razorpay-Signature", "")
        print("EVENT:", request.headers.get('X-Razorpay-Event-Id'))
        print("SIGNATURE:", request.headers.get('X-Razorpay-Signature'))
        print(json.dumps(json.loads(request.body), indent=2))
        # return Response({'status': 'received'}, status=status.HTTP_200_OK)

        try:
            Utility().verify_webhook_signature(
                raw_body.decode("utf-8"), signature, settings.RAZORPAY_WEBHOOK_SECRET
            )
        except SignatureVerificationError:
            return Response(
                {"error": "Invalid Signature", "status": status.HTTP_400_BAD_REQUEST},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = json.loads(raw_body)
        event = payload.get("event")
        event_id = request.headers.get("X-Razorpay-Event-Id")

        # Idempotency check - prevent duplicate event processing
        if event_id and Payment.objects.filter(razorpay_event_id=event_id).exists():
            return Response({"status": "already_processed"}, status=status.HTTP_200_OK)
        if event == "subscription.activated":
            self._handle_activated(payload, event_id)
        elif event == "subscription.charged":
            self._handle_charged(payload, event_id)
        elif event == "payment.failed":
            self._handle_payment_failed(payload, event_id)
        elif event == "subscription.cancelled":
            self._handle_cancelled(payload)
        # else: event we don't care about — still return 200 so Razorpay stops retrying

        return Response({"status": "ok"}, status=status.HTTP_200_OK)


    def _handle_activated(self, payload, event_id):
        rz_sub_id = payload.get("payload", {}).get("subscription", {}).get("entity", {}).get("id")
        local_sub = Subscription.objects.filter(razorpay_subscription_id=rz_sub_id).first()

        if not local_sub:
            return # No local subscription found, nothing to do

        Subscription.objects.filter(
            organisation=local_sub.organisation,
            status='active'
        ).exclude(pk=local_sub.pk).update(status='cancelled')
        local_sub.status = 'active'
        local_sub.next_billing_date = timezone.now() + timedelta(days=30)
        local_sub.save()

        self._record_payment(payload, event_id, local_sub, 'captured')


        
    def _handle_charged(self, payload, event_id):
        rp_sub_id = payload['payload']['subscription']['entity']['id']
        local_sub = Subscription.objects.filter(razorpay_subscription_id=rp_sub_id).first()
        if not local_sub:
            return

        local_sub.status = 'active'
        local_sub.next_billing_date = timezone.now() + timedelta(days=30)
        local_sub.save()

        payment = self._record_payment(payload, event_id, local_sub, 'captured')

        Invoice.objects.create(
            organisation=local_sub.organisation,
            subscription=local_sub,
            invoice_number=f"INV-{local_sub.pk}-{int(timezone.now().timestamp())}",
            amount=payment.amount,
            total_amount=payment.amount,
            status='paid',
            issue_date=timezone.now().date(),
            due_date=timezone.now().date(),
            paid_date=timezone.now().date(),
        )
    def _handle_payment_failed(self, payload, event_id):
        payment_entity = payload['payload']['payment']['entity']
        rp_sub_id = payment_entity.get('subscription_id')
        local_sub = Subscription.objects.filter(razorpay_subscription_id=rp_sub_id).first()


        self._record_payment(
            payload, event_id, local_sub, 'failed',
            failure_reason=payment_entity.get('error_description', ''),
        )

        if local_sub:
            local_sub.status = 'past_due'
            local_sub.save()


    def _handle_cancelled(self, payload):
        rp_sub_id = payload['payload']['subscription']['entity']['id']
        Subscription.objects.filter(razorpay_subscription_id=rp_sub_id).update(status='cancelled')
    def _record_payment(self, payload, event_id, subscription, status_value, failure_reason=''):
        payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
        payment_id = payment_entity.get('id')
 
        if payment_id:
            existing = Payment.objects.filter(razorpay_payment_id=payment_id).first()
            if existing:
                return existing  # already recorded by an earlier event for this same payment
 
        return Payment.objects.create(
            organisation=subscription.organisation if subscription else None,
            subscription=subscription,
            razorpay_payment_id=payment_id or '',
            razorpay_order_id=payment_entity.get('order_id') or '',
            # Razorpay doesn't reliably include `subscription_id` on the
            # payment entity itself (e.g. UPI charges omit it). We already
            # know which local Subscription this event belongs to, so
            # prefer that; fall back to the payment entity just in case.
            razorpay_subscription_id=(
                (subscription.razorpay_subscription_id if subscription else '')
                or payment_entity.get('subscription_id')
                or ''
            ),
            razorpay_event_id=event_id,
            amount=(payment_entity.get('amount', 0) or 0) / 100,
            currency=payment_entity.get('currency', 'INR'),
            status=status_value,
            method=payment_entity.get('method', '') or '',
            failure_reason=failure_reason,
            raw_response=payload,
        )
 
 
