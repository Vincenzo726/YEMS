const Admin = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function createToken(admin) {
  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function isAuthorizedEmail(email) {
  return (
    email.toLowerCase().trim() ===
    process.env.AUTHORIZED_ADMIN_EMAIL.toLowerCase().trim()
  );
}


// ADMIN SIGNUP
const adminSignup = async (req, res) => {
  try {
    const { fullName, name, email, password } = req.body;

    const adminName = fullName || name;

    if (!adminName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required.",
      });
    }

    if (!isAuthorizedEmail(email)) {
      return res.status(403).json({
        success: false,
        message: "This email is not authorized to create an admin account.",
      });
    }

    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "An admin account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name: adminName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const token = createToken(admin);

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });

  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during signup.",
    });
  }
};


// ADMIN LOGIN
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (!isAuthorizedEmail(email)) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found. Create an account first.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    const token = createToken(admin);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

module.exports = {
  adminSignup,
  adminLogin,
};