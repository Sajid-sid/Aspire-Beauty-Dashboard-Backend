const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const  pool  = require('../config/db');

dotenv.config();

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter Email and Password" });
    }

    // Check if email already exists
    const [existing] = await pool.query("SELECT * FROM ab_admins WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into DB
    await pool.query("INSERT INTO ab_admins (email, password) VALUES (?, ?)", [
      email,
      hashedPassword,
    ]);

    return res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    

    if (!email || !password) {
      console.log("⚠️ Missing credentials");
      return res.status(400).json({ message: "Email and Password are required." });
    }

    // Find admin
    const [existing] = await pool.query("SELECT * FROM ab_admins WHERE email = ?", [email]);
    

    if (existing.length === 0) {
      
      return res.status(404).json({ message: "Email does not exist." });
    }

    const admin = existing[0];
    

    // Compare password
    const match = await bcrypt.compare(password, admin.password);
    

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    

    return res.json({ message: "Login Successful!", token, email: admin.email });
  } catch (error) {
    
    res.status(500).json({ error: error.message });
  }
};


