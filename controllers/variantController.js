const pool = require("../config/db");

// Add Variant
exports.addVariant = async (req, res) => {
  try {
    const { productid, varient, stock } = req.body;

    if (!productid || !varient) {
      return res.status(400).json({ message: "Product & variant required" });
    }

    const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;
    const varientImage = req.files?.varient_image?.[0]?.filename || null;
    const productImage = req.files?.product_image?.[0]?.filename || null;

    const VariantImage = varientImage ? `${BASE_URL}${varientImage}` : null;
    const ProductImage = productImage ? `${BASE_URL}${productImage}` : null;

    const [result] = await pool.query(
      `INSERT INTO ab_stock (productid, varient, varient_image, product_image, stock, pending, confirmed)
       VALUES (?, ?, ?, ?, ?, 0, 0)`,
      [productid, varient, VariantImage, ProductImage, stock || 0]
    );

    res.json({ message: "Variant added successfully", stockId: result.insertId });
  } catch (err) {
    console.error("Add Variant Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get All Variants
exports.getAllVariants = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id AS stockId, p.name AS productname, s.varient, s.varient_image, s.product_image, s.stock, s.pending, s.confirmed
      FROM ab_stock s
      JOIN ab_products p ON p.id = s.productid
      ORDER BY p.name, s.varient
    `);
    res.json(rows);
  } catch (err) {
    console.error("Get Variants Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete Variant
exports.deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`DELETE FROM ab_stock WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Variant not found" });
    }

    res.json({ message: "Variant deleted successfully" });
  } catch (err) {
    console.error("Delete Variant Error:", err);
    res.status(500).json({ message: err.message });
  }
};
