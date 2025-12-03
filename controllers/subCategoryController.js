const pool = require("../config/db");

// ✅ Get all subcategories
const getAllSubcategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT s.*, c.name AS category_name FROM ab_subcategories s JOIN ab_categories c ON s.category_id = c.id"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ message: "Error fetching subcategories" });
  }
};

// ✅ Get single subcategory by ID
const getSubcategoryById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM ab_subcategories WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    res.status(500).json({ message: "Error fetching subcategory" });
  }
};

// ✅ Add new subcategory
const addSubcategory = async (req, res) => {
  try {
    const { name, category_id } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check duplicate within same category
    const [rows] = await pool.query(
      "SELECT * FROM ab_subcategories WHERE name = ? AND category_id = ?",
      [name, category_id]
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: "Subcategory already exists in this category" });
    }

    const [result] = await pool.query(
      "INSERT INTO ab_subcategories (name, category_id) VALUES (?, ?)",
      [name, category_id]
    );

    res.status(201).json({
      message: "Subcategory added successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding subcategory:", error);
    res.status(500).json({ message: "Error adding subcategory" });
  }
};


// ✅ Update subcategory
const updateSubcategory = async (req, res) => {
  try {
    const { name, category_id } = req.body;
    const { id } = req.params;

    // ✅ Check if same name exists in same category excluding this ID
    const [rows] = await pool.query(
      "SELECT * FROM ab_subcategories WHERE name = ? AND category_id = ? AND id != ?",
      [name, category_id, id]
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: "Subcategory already exists in this category" });
    }

    const [result] = await pool.query(
      "UPDATE ab_subcategories SET name = ?, category_id = ? WHERE id = ?",
      [name, category_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.json({ message: "Subcategory updated successfully" });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    res.status(500).json({ message: "Error updating subcategory" });
  }
};



// ✅ Delete subcategory
const deleteSubcategory = async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM ab_subcategories WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    res.status(500).json({ message: "Error deleting subcategory" });
  }
};


// ✅ Get subcategories by category ID
const getByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM ab_subcategories WHERE category_id = ?",
      [categoryId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No subcategories found for this category" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching subcategories by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Export all functions (CommonJS style)
module.exports = {
  getAllSubcategories,
  getSubcategoryById,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getByCategoryId,
};
