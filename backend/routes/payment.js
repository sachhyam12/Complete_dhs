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

    // 🔐 Generate digital signature
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = crypto
      .createHmac("sha256", secret_key)
      .update(message)
      .digest("base64");

    // Construct redirect URL for demonstration
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
        paymentUrl:
          process.env.ESEWA_BASE_URL ||
          "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
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
router.get("/verify", async (req, res) => {
  try {
    const { product_code, total_amount, transaction_uuid } = req.query;

    if (!product_code || !total_amount || !transaction_uuid) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for verification",
      });
    }

    const verifyUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;

    const response = await fetch(verifyUrl);
    const result = await response.json();

    if (result.status === "COMPLETE") {
      return res.json({
        success: true,
        data: {
          transaction_uuid: result.transaction_uuid,
          ref_id: result.ref_id,
          status: "SUCCESS",
        },
      });
    } else {
      return res.json({
        success: false,
        data: result,
        message: "Payment not complete or failed",
      });
    }
  } catch (error) {
    console.error("Esewa verify error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify eSewa payment",
    });
  }
});

module.exports = router;
