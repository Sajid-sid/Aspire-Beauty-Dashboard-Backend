const pool = require("../config/db");

// Add Stock to Variant
exports.addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    await pool.query(`UPDATE ab_stock SET stock = stock + ? WHERE id = ?`, [quantity, id]);

    res.json({ message: "Stock updated successfully" });
  } catch (err) {
    console.error("Add Stock Error:", err);
    res.status(500).json({ message: err.message });
  }
};
