const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

/**
 * @route GET /api/payment/esewa
 * @desc Generate a direct eSewa redirect URL (for quick payment tests)
 * @access Public
 */
router.get("/esewa", async (req, res) => {
  try {
    const { amount, invoice, remarks } = req.query;

    if (!amount || !invoice) {
      return res.status(400).json({
        success: false,
        message: "Amount and invoice are required",
      });
    }

    const transaction_uuid = `TXN-${Date.now()}`;
    const total_amount = amount;
    const product_code = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
    const secret_key = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q(";

    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = crypto
      .createHmac("sha256", secret_key)
      .update(message)
      .digest("base64");

    const paymentUrl = `${
      process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np"
    }/api/epay/main/v2/form?total_amount=${total_amount}&transaction_uuid=${transaction_uuid}&product_code=${product_code}&success_url=${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/payment/success&failure_url=${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/payment/failure&signature=${encodeURIComponent(
      signature
    )}&signed_field_names=total_amount,transaction_uuid,product_code`;

    return res.json({
      success: true,
      paymentUrl,
      details: {
        transaction_uuid,
        total_amount,
        product_code,
        signature,
      },
    });
  } catch (error) {
    console.error("Esewa quickpay error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating eSewa redirect URL",
    });
  }
});

/**
 * @route POST /api/payment/esewa/create-order
 * @desc Create a real eSewa payment form (for production)
 * @access Public
 */
router.post("/create-order", async (req, res) => {
  try {
    const { amount, appointmentId } = req.body;

    if (!amount || !appointmentId) {
      console.warn("Missing amount or appointmentId", {
        amount,
        appointmentId,
      });
      return res.status(400).json({
        success: false,
        message: "Amount and appointmentId are required",
      });
    }

    const transaction_uuid = `TXN-${Date.now()}`;
    const product_code = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
    const secret_key = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    const total_amount = amount;
    const tax_amount = 0;
    const product_service_charge = 0;
    const product_delivery_charge = 0;

    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = crypto
      .createHmac("sha256", secret_key)
      .update(message)
      .digest("base64");

    const formData = {
      amount,
      tax_amount,
      total_amount,
      transaction_uuid,
      product_code,
      product_service_charge,
      product_delivery_charge,
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      failure_url: `${process.env.FRONTEND_URL}/payment/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    return res.json({
      success: true,
      data: {
        formData,
        paymentUrl: `${
          process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np"
        }/api/epay/main/v2/form`,
      },
    });
  } catch (error) {
    console.error("Esewa create-order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create eSewa payment order",
    });
  }
});

/**
 * @route GET /api/payment/esewa/verify
 * @desc Verify payment status from eSewa server
 * @access Public
 */

/**
 * @route POST /api/payment/esewa/verify-payment
 * @desc Verify payment with eSewa and update appointment
 * @access Public
 */
router.post("/verify", async (req, res) => {
  try {
    const { amt, oid, refId } = req.body;

    console.log("🔍 Verifying payment:", { amt, oid, refId });

    if (!amt || !oid || !refId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const formData = new URLSearchParams({
      amt,
      rid: refId,
      pid: oid,
      scd: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
    });

    const verifyResponse = await fetch(
      "https://uat.esewa.com.np/epay/transrec",
      {
        method: "POST",
        body: formData,
      }
    );

    const text = await verifyResponse.text();

    if (text.includes("<response_code>Success</response_code>")) {
      await Appointment.findByIdAndUpdate(oid, {
        paymentStatus: "paid",
        status: "Scheduled",
        transactionId: refId,
        amountPaid: amt,
      });

      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return res.json({
        success: false,
        message: "Payment not verified",
        rawResponse: text,
      });
    }
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

module.exports = router;
