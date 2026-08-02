from rest_framework.response import Response
from rest_framework import serializers
from rest_framework.views import APIView
from django.conf import settings
from rest_framework import status
import razorpay


client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
# class PaymentSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     currency = serializers.CharField(default="INR")
#     receipt = serializers.CharField()
#     amount = serializers.IntegerField()
#     name = serializers.CharField()


# class CreatePaymentView(APIView):
#     def post(self, request):
#         serializer = PaymentSerializer(data=request.data)
#         if serializer.is_valid():
#             amount = serializer.validated_data["amount"]
#             currency = serializer.validated_data["currency"]
#             receipt = serializer.validated_data["receipt"]
#             rezorpay_client = razorpay.Client(
#                 settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET
#             )

#         # Create an order in Razorpay
#         try:
#             razorpay_order = rezorpay_client.order.create(
#                 {
#                     "amount": amount,
#                     "currency": currency,
#                     "receipt": receipt,
#                     "payment_capture": "1",
#                 }
#             )

#             return Response(
#                 {
#                     "order_id": razorpay_order["id"],
#                     "amount": razorpay_order["amount"],
#                     "currency": razorpay_order["currency"],
#                     "receipt": razorpay_order["receipt"],
#                     "description": "Payment for order - {}".format(receipt),
#                 },
#                 status=status.HTTP_201_CREATED,
#             )

#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

#         # if our serializer has some issue than we return serializer issue
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class VerifyPayment(APIView):

#     def post(self, request):

#         razorpay_payment_id = request.data.get("razorpay_payment_id")
#         razorpay_order_id = request.data.get("razorpay_order_id")
#         razorpay_signature = request.data.get("razorpay_signature")
#         razorpay_client = razorpay.Client(
#             auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
#         )

#         # now we will verify payment signature/
#         try:
#             params_dict = {
#                 "razorpay_payment_id": razorpay_payment_id,
#                 "razorpay_order_id": razorpay_order_id,
#                 "razorpay_signature": razorpay_signature,
#             }

#             razorpay_client.utility.verfiy_payment_signature(params_dict)
#             return Response(
#                 {"status": "Successfull", "message": "Payment Verified Successfully"}
#             )
#         except razorpay.errors.SignatureVerificationError:
#             return Response(
#                 {"status": "failed", "message": "Payment verification failed."},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )
