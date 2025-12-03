const pool = require("../config/db");

// Base URL for serving uploaded images


// Helper to safely get image URL
const getImageUrl = (img) => {
  if (!img) return null;
  return img.startsWith("http") ? img : `${BASE_URL}${img}`;
};

// ✅ Get All Categories (Public)
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.image, 
        COUNT(p.id) AS product_count
      FROM ab_categories c
      LEFT JOIN ab_products p ON c.id = p.category_id
      GROUP BY c.id, c.name, c.image
      ORDER BY c.id DESC
    `);

    const categories = rows.map((c) => ({
      ...c,
      image: getImageUrl(c.image),
    }));

    res.json(categories);
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Single Category by ID (Public)
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM ab_categories WHERE id = ?", [id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Category not found" });

    const category = { ...rows[0], image: getImageUrl(rows[0].image) };

    res.json(category);
  } catch (error) {
    console.error("Error in getCategory:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Add Category
exports.addCategory = async (req, res) => {

  const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;

  try {
    const { name } = req.body;
    const imageFile = req.file ? `${BASE_URL}${req.file.filename}` : null;

    if (!name) return res.status(400).json({ message: "Category name is required" });

    const [rows] = await pool.query("SELECT * FROM ab_categories WHERE name = ?", [name]);
    if (rows.length > 0) return res.status(409).json({ message: "Category name already exists." });

    const [result] = await pool.query(
      "INSERT INTO ab_categories (name, image) VALUES (?, ?)",
      [name, imageFile]
    );

    res.status(201).json({
      message: "Category added successfully",
      id: result.insertId,
      image: getImageUrl(imageFile),
    });
  } catch (error) {
    console.error("Error in addCategory:", error);
    res.status(500).json({ error: error.message });
  }
};
// ✅ Update Category (Admin Only)
exports.updateCategory = async (req, res) => {

  const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;

  try {
    const { id } = req.params;
    const { name } = req.body;
    const imageFile = req.file ? `${BASE_URL}${req.file.filename}` : null;

    // ✅ Fetch existing category
    const [existing] = await pool.query("SELECT * FROM ab_categories WHERE id = ?", [id]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Category not found" });

    // ✅ Check for duplicate name
    if (name && name !== existing[0].name) {
      const [duplicate] = await pool.query(
        "SELECT id FROM ab_categories WHERE name = ? AND id != ?",
        [name, id]
      );
      if (duplicate.length > 0)
        return res.status(409).json({ message: "Category name already exists" });
    }

    // ✅ Decide final image (keep old if no new upload)
    const finalImage = imageFile || existing[0].image;

    // ✅ Update record
    await pool.query(
      "UPDATE ab_categories SET name = ?, image = ? WHERE id = ?",
      [name || existing[0].name, finalImage, id]
    );

    res.json({
      message: "Category updated successfully",
      image: getImageUrl(finalImage),
    });
  } catch (error) {
    console.error("Error in updateCategory:", error);
    res.status(500).json({ error: error.message });
  }
};


// ✅ Delete Category (Admin Only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM ab_categories WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    res.status(500).json({ error: error.message });
  }
};

