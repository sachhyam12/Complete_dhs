const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../modal/Admin");

const { authenticate, requireRole } = require("../middleware/auth");
const Doctor = require("../modal/Doctor");
const Appointment = require("../modal/Appointment");
const Patient = require("../modal/Patient");
const { verifyAdmin } = require("../middleware/verifyAdmin");

//Admin registration
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, adminKey } = req.body;

    if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res
        .status(403)
        .json({ message: "Invalid admin registration key" });
    }
    const existingAdmin = await Admin.findOne({
      $or: [{ username: username }, { email: email }],
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }
    const admin = new Admin({
      username,
      email,
      password,
    });

    await admin.save();

    return res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Admin registration error", error);
    return res.status(500).json({ message: "Server error" });
  }
});
// Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid)
      return res
        .status(401)
        .json({ message: "Invalid credentials. Log in denied" });

    const token = jwt.sign(
      { id: admin._id, type: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true,
      message: "Admin login successful",
      data: { token },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get(
  "/dashboard",
  verifyAdmin,

  async (req, res) => {
    try {
      if (req.auth.type !== "admin") {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized access" });
      }
      const totalDoctors = await Doctor.countDocuments();
      const totalPatients = await Patient.countDocuments();
      const totalAppointments = await Appointment.countDocuments();

      const admin = await Admin.findById(req.auth.id).select("username email");

      res.json({
        success: true,
        message: "Dashboard data fetched successfully.",
        data: {
          admin,
          totalDoctors,
          totalPatients,
          totalAppointments,
        },
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to load dashboard" });
    }
  }
);

// GET /admin/doctors

router.get("/doctors", verifyAdmin, async (req, res) => {
  try {
    // ensure admin
    if (!req.auth || req.auth.type !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "25", 10), 100);
    const skip = (page - 1) * limit;

    const doctors = await Doctor.find({})
      .select("username name email isActive createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Doctor.countDocuments();

    res.json({
      success: true,
      message: "Doctors fetched",
      data: {
        doctors,
        meta: { page, limit, total },
      },
    });
  } catch (err) {
    console.error("Admin get doctors error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctors" });
  }
});
router.post("/add-doctor", verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existing = await Doctor.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor already exists" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = new Doctor({
      name,
      email,
      password: hashedPassword,
      specialization,
    });

    await doctor.save();

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error adding doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add doctor",
    });
  }
});

// Delete doctor by ID
router.delete("/delete-doctor/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDoctor = await Doctor.findByIdAndDelete(id);

    if (!deletedDoctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    res.json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Delete doctor error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete doctor" });
  }
});

// PATCH /api/admin/toggle-doctor/:id
router.post("/toggle-doctor/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    res.json({
      success: true,
      message: `Doctor ${
        doctor.isActive ? "activated" : "deactivated"
      } successfully`,
      data: doctor,
    });
  } catch (error) {
    console.error("Error toggling doctor status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update doctor status",
    });
  }
});

module.exports = router;
