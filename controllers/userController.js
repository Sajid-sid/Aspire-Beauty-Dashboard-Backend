const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const pool = require("../config/db");

dotenv.config();




//register
exports.register = async (req, res) => {

  const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;

  try {
    const { fullname, email, mobile, password, confirmPassword, notify } = req.body;

    // Required fields
    if (!fullname || !email || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Email check
    const [emailCheck] = await pool.query(
      "SELECT id FROM ab_users WHERE email = ?",
      [email]
    );
    if (emailCheck.length > 0) {
      return res.status(409).json({ message: "Email already exists." });
    }

    // Mobile check
    const [mobileCheck] = await pool.query(
      "SELECT id FROM ab_users WHERE mobile = ?",
      [mobile]
    );
    if (mobileCheck.length > 0) {
      return res.status(409).json({ message: "Mobile number already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePath = req.file ? `${BASE_URL}${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO ab_users (fullname, email, mobile, password, profile, notify)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fullname,
        email,
        mobile,
        hashedPassword,
        profilePath,
        notify == "false" ? 0 : 1
      ]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, email, fullname },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // token valid for 7 days
    );

    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: {
        id: result.insertId,
        fullname,
        email,
        mobile,
        profile: profilePath ? `${profilePath}` : null 
      }
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};








// ======================= LOGIN =======================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: "Email and password are required." });

        const [existing] = await pool.query("SELECT * FROM ab_users WHERE email = ?", [email]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = existing[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

      const token = jwt.sign(
  { id: user.id, email: user.email, fullname: user.fullname },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.status(200).json({
  message: "Logged in successfully!",
  token,
  user: {
    id: user.id,
    fullname: user.fullname,
    email: user.email,
    mobile: user.mobile,
    profile: user.profile,
  }
});

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: error.message });
    }
};



// ======================= FORGOT PASSWORD =======================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });

        const [user] = await pool.query("SELECT * FROM ab_users WHERE email = ?", [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: "Email not registered." });
        }

        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "10m" });
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            "UPDATE ab_users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
            [resetToken, expiry, email]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Aspire Beauty" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reset your Aspire Beauty password",
            text: `
                We received a request to reset your password.
                Click this link to reset: ${resetUrl}
                This link expires in 10 minutes.
            `
        });

        res.json({ message: "Password reset link sent to your email.", success: true });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ error: error.message });
    }
};


// ======================= RESET PASSWORD =======================
exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [user] = await pool.query("SELECT * FROM ab_users WHERE email = ?", [decoded.email]);
        if (user.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "UPDATE ab_users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?",
            [hashedPassword, decoded.email]
        );

        return res.json({ message: "Password reset successfully!", success: true });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.updateProfile = async (req, res) => {

    const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;
  try {
    const userId = req.user.id; // from JWT middleware
    const { fullname, mobile } = req.body;

    // Get old user
    const [userRows] = await pool.query("SELECT * FROM ab_users WHERE id = ?", [userId]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldUser = userRows[0];

    // If new image uploaded
    let newProfilePath = oldUser.profile;
    if (req.file) {
      newProfilePath = `${BASE_URL}${req.file.filename}`;
    }

    await pool.query(
      "UPDATE ab_users SET fullname = ?, mobile = ?, profile = ? WHERE id = ?",
      [fullname, mobile, newProfilePath, userId]
    );

    // Updated user data to return
    const updatedUser = {
      id: userId,
      fullname,
      email: oldUser.email,
      mobile,
      profile: newProfilePath,
    };

    res.json({
      message: "Profile updated successfully!",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



// ======================= GET ALL USERS (ADMIN) =======================
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, fullname, email, mobile, profile, notify, created_at
      FROM ab_users
      ORDER BY id DESC
    `);

    return res.status(200).json({
      message: "Users fetched successfully!",
      users,
    });

  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
