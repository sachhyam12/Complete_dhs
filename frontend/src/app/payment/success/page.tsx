"use client";
import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
  useEffect(() => {
    // Optional: you can verify the transaction with your backend here
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <CheckCircle className="w-20 h-20 text-green-600 mb-6" />
      <h1 className="text-2xl font-bold mb-2 text-green-700">
        Payment Successful!
      </h1>
      <p className="text-gray-600">
        Your payment has been confirmed. Thank you!
      </p>
    </div>
  );
};

export default PaymentSuccess;
