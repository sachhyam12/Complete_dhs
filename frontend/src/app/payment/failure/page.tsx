"use client";
import React from "react";
import { XCircle } from "lucide-react";

const PaymentFailure = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <XCircle className="w-20 h-20 text-red-600 mb-6" />
      <h1 className="text-2xl font-bold mb-2 text-red-700">Payment Failed</h1>
      <p className="text-gray-600">
        Something went wrong or you cancelled the payment. Please try again.
      </p>
    </div>
  );
};

export default PaymentFailure;
