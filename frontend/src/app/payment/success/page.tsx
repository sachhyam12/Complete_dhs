"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { httpService } from "@/service/httpService";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying"
  );

  useEffect(() => {
    const verifyPayment = async () => {
      const amt = searchParams.get("amt");
      const oid = searchParams.get("oid");
      const refId = searchParams.get("refId");

      console.log("🔍 Payment success query:", { amt, oid, refId });

      if (!amt || !oid || !refId) {
        setStatus("failed");
        return;
      }

      try {
        const response = await httpService.postWithoutAuth("/payment/verify", {
          amt,
          oid,
          refId,
        });

        console.log("✅ Verify response:", response);
        if (response.success) setStatus("success");
        else setStatus("failed");
      } catch (err) {
        console.error("Payment verify failed", err);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 mb-4 text-blue-600 animate-spin" />
        <p className="text-lg font-medium text-gray-700">
          Verifying payment...
        </p>
        <p className="text-gray-500">
          Please wait while we confirm your booking.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <CheckCircle className="w-16 h-16 mb-4 text-green-600" />
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-6">
          Your appointment has been confirmed.
        </p>
        <a
          href="/patient/dashboard"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-red-600">
      <XCircle className="w-16 h-16 mb-4" />
      <p className="text-xl font-semibold mb-4">Payment Verification Failed</p>
      <a href="/" className="text-blue-600 underline">
        Go Back Home
      </a>
    </div>
  );
};

export default PaymentSuccessPage;
