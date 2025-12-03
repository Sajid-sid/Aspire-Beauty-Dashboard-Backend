const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // MySQL connection pool

// ✅ Middleware to protect admin routes
const authAdmin = async (req, res, next) => {
  try {
    // 1️⃣ Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // 3️⃣ Fetch admin from MySQL using the ID in token
    const [rows] = await pool.query(
      "SELECT id, email FROM ab_admins WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 4️⃣ Attach admin info to request object
    req.admin = rows[0];

    next(); // ✅ Proceed to the next middleware or controller
  } catch (error) {
    console.error("Auth error:", error.message);
    return res
      .status(401)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};

module.exports = authAdmin;
