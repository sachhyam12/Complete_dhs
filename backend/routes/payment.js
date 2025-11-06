const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");

dotenv.config();

/**
 * @route GET /api/payment/fonepay
 * @desc Generate Fonepay redirect URL (mock demo)
 * @access Public
 */
router.get("/fonepay", async (req, res) => {
  try {
    const { amount, invoice, remarks } = req.query;
    if (!amount || !invoice) {
      return res
        .status(400)
        .json({ success: false, message: "Amount and invoice required" });
    }

    const PRN = "TXN" + Date.now();
    const responseUrl = "http://localhost:3000/payment-success";

    // Return only JSON here
    const fonepayUrl = `${
      process.env.FONEPAY_BASE_URL
    }/api/merchantRequest/pay?merchant=${
      process.env.FONEPAY_MERCHANT_CODE
    }&invoice=${invoice}&amount=${amount}&currency=524&PRN=${PRN}&remarks=${
      remarks || "Payment"
    }&responseUrl=${responseUrl}`;

    // ✅ Return JSON to frontend (DO NOT redirect)
    return res.json({
      success: true,
      paymentUrl: fonepayUrl,
    });
  } catch (error) {
    console.error("Fonepay error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate payment URL" });
  }
});

router.post("/create-order", async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID required",
      });
    }

    // Dummy fallback while you don’t have FonePay credentials
    const qrUrl =
      "https://dummyimage.com/300x300/0f62fe/ffffff.png&text=FonePay+QR";
    const transactionId = "TXN-" + Date.now();
    const amount = 500; // or pull from appointment

    // ✅ Return JSON (not HTML)
    return res.json({
      success: true,
      data: {
        qrUrl,
        transactionId,
        amount,
      },
    });
  } catch (error) {
    console.error("Payment create error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment order",
    });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const { appointmentId, transactionId } = req.body;

    if (!appointmentId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Missing appointmentId or transactionId",
      });
    }

    // ✅ For demo: always succeed after 5 seconds
    console.log(`Verifying payment for ${transactionId}...`);

    // Simulate async delay (not needed but adds realism)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Return success
    return res.json({
      success: true,
      data: {
        appointmentId,
        transactionId,
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
    });
  }
});

module.exports = router;
