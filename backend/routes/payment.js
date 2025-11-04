const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const { authenticate, requireRole } = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const Appointment = require("../modal/Appointment");

const router = express.Router();

/**
 * Configuration
 * FonePay provides merchant details and a shared secret for hashing.
 */
const FONEPAY_MERCHANT_CODE = process.env.FONEPAY_MERCHANT_CODE; // e.g. "FONEPAYTEST"
const FONEPAY_SECRET_KEY = process.env.FONEPAY_SECRET_KEY; // secret hash key
const FONEPAY_BASE_URL =
  process.env.FONEPAY_BASE_URL ||
  "https://dev-clientapi.fonepay.com/api/merchantRequest";

//
// 1️⃣ CREATE PAYMENT ORDER (Generate QR / Payment Link)
//
router.post(
  "/create-order",
  authenticate,
  requireRole("patient"),
  [
    body("appointmentId")
      .isMongoId()
      .withMessage("Valid appointment ID is required"),
  ],
  validate,
  async (req, res) => {
    try {
      const { appointmentId } = req.body;

      // find appointment
      const appointment = await Appointment.findById(appointmentId)
        .populate("doctorId", "name specialization")
        .populate("patientId", "name email phone");

      if (!appointment) return res.notFound("Appointment not found");
      if (appointment.patientId._id.toString() !== req.auth.id)
        return res.forbidden("Access denied");
      if (appointment.paymentStatus === "Paid")
        return res.badRequest("Payment already completed");

      // prepare transaction data
      const transactionId = `APT_${appointmentId}_${Date.now()}`;
      const amount = appointment.totalAmount.toFixed(2);

      // checksum/hash (per FonePay documentation)
      const rawData = `${FONEPAY_MERCHANT_CODE},${transactionId},${amount}`;
      const hash = crypto
        .createHash("sha512")
        .update(rawData + FONEPAY_SECRET_KEY)
        .digest("hex")
        .toUpperCase();

      // build redirect URL (if web) or QR link
      const successUrl = `${process.env.FRONTEND_URL}/payment-success?tid=${transactionId}`;
      const failureUrl = `${process.env.FRONTEND_URL}/payment-failed?tid=${transactionId}`;

      // optional: dynamic QR / request payment
      const fonePayPayload = {
        MERCHANT_CODE: FONEPAY_MERCHANT_CODE,
        PRN: transactionId,
        AMOUNT: amount,
        SUCCESS_URL: successUrl,
        FAILURE_URL: failureUrl,
        CHECKSUM: hash,
      };

      // usually, you would call FonePay's API to generate a payment link/QR
      // (for demo we assume FonePay returns a redirect/QR URL)
      const qrUrl = `${FONEPAY_BASE_URL}/pay?merchant=${FONEPAY_MERCHANT_CODE}&prn=${transactionId}&amt=${amount}&su=${encodeURIComponent(
        successUrl
      )}&fu=${encodeURIComponent(failureUrl)}&cs=${hash}`;

      res.ok(
        {
          qrUrl,
          transactionId,
          amount,
          merchantCode: FONEPAY_MERCHANT_CODE,
        },
        "FonePay payment order created successfully"
      );
    } catch (error) {
      console.error("FonePay create-order error:", error);
      res.serverError("Failed to create FonePay payment order", [
        error.message,
      ]);
    }
  }
);

//
// 2️⃣ VERIFY PAYMENT
//
router.post(
  "/verify-payment",
  authenticate,
  requireRole("patient"),
  [
    body("appointmentId")
      .isMongoId()
      .withMessage("Valid appointment ID is required"),
    body("transactionId").isString().withMessage("Transaction ID is required"),
  ],
  validate,
  async (req, res) => {
    try {
      const { appointmentId, transactionId } = req.body;

      // find appointment
      const appointment = await Appointment.findById(appointmentId)
        .populate("doctorId", "name specialization")
        .populate("patientId", "name email phone");

      if (!appointment) return res.notFound("Appointment not found");
      if (appointment.patientId._id.toString() !== req.auth.id)
        return res.forbidden("Access denied");

      // Generate hash for verification API
      const rawData = `${FONEPAY_MERCHANT_CODE},${transactionId}`;
      const hash = crypto
        .createHash("sha512")
        .update(rawData + FONEPAY_SECRET_KEY)
        .digest("hex")
        .toUpperCase();

      // call FonePay transaction verification API
      const verifyUrl = `${FONEPAY_BASE_URL}/checkTransactionStatus`;
      const response = await axios.post(verifyUrl, {
        MERCHANT_CODE: FONEPAY_MERCHANT_CODE,
        PRN: transactionId,
        CHECKSUM: hash,
      });

      const status = response.data?.STATUS || "FAILED";

      if (status === "SUCCESS") {
        appointment.paymentStatus = "Paid";
        appointment.paymentMethod = "FonePay";
        appointment.fonepayTransactionId = transactionId;
        appointment.paymentDate = new Date();
        await appointment.save();

        await appointment.populate(
          "doctorId",
          "name specialization fees hospitalInfo profileImage"
        );
        await appointment.populate(
          "patientId",
          "name email phone profileImage"
        );

        res.ok(
          appointment,
          "Payment verified and appointment confirmed successfully"
        );
      } else {
        res.badRequest("FonePay payment verification failed or pending", [
          status,
        ]);
      }
    } catch (error) {
      console.error("FonePay verify-payment error:", error);
      res.serverError("Failed to verify FonePay payment", [error.message]);
    }
  }
);

module.exports = router;
