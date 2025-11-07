import { httpService } from "@/service/httpService";
import { userAuthStore } from "@/store/authStore";
import React, { useEffect, useRef, useState } from "react";
import { Separator } from "../ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  CreditCard,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";

interface PaymentStepInterface {
  selectedDate: Date | undefined;
  selectedSlot: string;
  consultationType: string;
  doctorName: string;
  slotDuration: number;
  consultationFee: number;
  isProcessing: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onPaymentSuccess?: (appointment: any) => void;
  loading: boolean;
  appointmentId?: string;
  patientName?: string;
}

const PaymentStep = ({
  selectedDate,
  selectedSlot,
  consultationType,
  doctorName,
  slotDuration,
  consultationFee,
  isProcessing,
  onBack,
  onConfirm,
  onPaymentSuccess,
  loading,
  appointmentId,
  patientName,
}: PaymentStepInterface) => {
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const { user } = userAuthStore();
  const [error, setError] = useState<string>("");
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const platformFees = Math.round(consultationFee * 0.1);
  const totalAmount = consultationFee + platformFees;
  const [shouldAutoOpen, setShouldAutoOpen] = useState(true);
  const modelCloseCountRef = useRef<number>(0);

  // 🔹 Auto-trigger payment when appointment is created
  useEffect(() => {
    if (
      appointmentId &&
      patientName &&
      paymentStatus === "idle" &&
      !isPaymentLoading &&
      shouldAutoOpen
    ) {
      const timer = setTimeout(() => {
        handlePayment();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    appointmentId,
    patientName,
    paymentStatus,
    isPaymentLoading,
    shouldAutoOpen,
  ]);

  // 🔹 eSewa Payment Function
  const handlePayment = async () => {
    console.log("--------------Handling payment------------------");
    if (!appointmentId || !patientName) {
      onConfirm();
      return;
    }

    try {
      setIsPaymentLoading(true);
      setError("");
      setPaymentStatus("processing");
      console.log("Creating eSewa payment for appointment:", appointmentId);

      // ✅ Call backend to get payment info (do NOT post to eSewa here)
      const orderResponse = await httpService.postWithAuth(
        "/payment/create-order",
        { appointmentId, amount: totalAmount }
      );
      console.log("-----------Order Response---------------", orderResponse);
      if (!orderResponse.success) {
        throw new Error(
          orderResponse.message || "Failed to create eSewa order"
        );
      }

      const { formData, paymentUrl } = orderResponse.data;
      console.log("Sending to esewa", formData);

      // Create actual form to POST to eSewa
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl; // e.g., https://rc-epay.esewa.com.np/api/epay/main/v2/form
      form.target = "_blank";

      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit(); // 🚀 Opens eSewa payment window
      document.body.removeChild(form);

      // (Optional) Poll backend for payment confirmation or simulate success
      setTimeout(() => {
        setPaymentStatus("success");
        onPaymentSuccess?.({
          appointmentId,
          paymentStatus: "PAID",
          paidAt: new Date(),
        });
      }, 8000);
    } catch (error: any) {
      console.error("eSewa payment error", error);
      setError(error.message || "Payment failed");
      setPaymentStatus("failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handlePayNow = () => {
    if (appointmentId && patientName) {
      modelCloseCountRef.current = 0;
      handlePayment();
    } else {
      onConfirm();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Payment & Confirmation
        </h3>
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-medium">
                {selectedDate?.toLocaleDateString()} at {selectedSlot}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Consultation Type</span>
              <span className="font-medium">{consultationType}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Doctor</span>
              <span className="font-medium">{doctorName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{slotDuration} minutes</span>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="text-gray-600">Consultation Fee</span>
              <span className="font-medium">NPR {consultationFee}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium">NPR {platformFees}</span>
            </div>

            <Separator />

            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold text-green-600">
                NPR {totalAmount}
              </span>
            </div>
          </div>
        </div>

        {/* Status UI */}
        <AnimatePresence mode="wait">
          {paymentStatus === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Redirecting to eSewa...
              </h4>
              <p className="text-gray-600 mb-4">
                Please complete the payment in the eSewa window
              </p>
              <Progress value={50} className="w-full" />
            </motion.div>
          )}

          {paymentStatus === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h4 className="text-lg font-semibold text-green-800 mb-2">
                Payment Successful!
              </h4>
              <p className="text-gray-600 mb-4">
                Your appointment has been confirmed.
              </p>
            </motion.div>
          )}

          {paymentStatus === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
              <h4 className="text-lg font-semibold text-red-800 mb-2">
                Payment Failed!
              </h4>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => {
                  setPaymentStatus("idle");
                  setError("");
                }}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg mb-8">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Secure Payment</p>
            <p>Your payment is protected by eSewa secure gateway</p>
          </div>
        </div>
      </div>

      {paymentStatus === "idle" && (
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={onBack} className="px-8 py-3">
            Back
          </Button>
          <Button
            onClick={handlePayment}
            disabled={loading || isPaymentLoading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Appointment...
              </>
            ) : isPaymentLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay NPR {totalAmount} & Book
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentStep;
