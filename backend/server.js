const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");
require("dotenv").config();
require("./config/passport");
const passportLib = require("passport");

const response = require("./middleware/response");

const app = express();

//helmet is a security middleware for Express
//It helps protect your app by settings various HTTP headers
app.use(helmet());

//morgan is an HTTP request logger middleware
app.use(morgan("dev"));
app.use(
  cors({
    origin:
      (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) || "*",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//used response
app.use(response);

//Initialize passport
app.use(passportLib.initialize());

//Mongodb connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/doctor", require("./routes/doctor"));
app.use("/api/admin", adminRoutes);
app.use("/api/patient", require("./routes/patient"));
app.use("/api/appointment", require("./routes/appointment"));
app.use("/api/payment", paymentRoutes);

app.get("/health", (req, res) =>
  res.ok({ time: new Date().toISOString() }, "OK")
);

// --- MOCK FONEPAY DEMO FLOW ---
app.get("/fake-fonepay/api/merchantRequest/pay", (req, res) => {
  const { merchant, invoice, amount, PRN, remarks, responseUrl } = req.query;

  res.send(`
    <html>
      <head><title>Fonepay Demo</title></head>
      <body style="font-family:sans-serif; text-align:center; padding-top:100px;">
        <h2>🔶 Fonepay Sandbox (Demo Mode)</h2>
        <p>Merchant: ${merchant}</p>
        <p>Invoice: ${invoice}</p>
        <p>Amount: ${amount}</p>
        <p>Remarks: ${remarks}</p>
        <p>Processing payment...</p>
        <script>
          setTimeout(() => {
            window.location.href = "${responseUrl}?PRN=${PRN}&status=SUCCESS&message=Payment successful";
          }, 3000);
        </script>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
