const pool = require("../config/db");
const path = require("path");


// Base URL for serving uploaded images


// Helper to safely get image URL
const getImageUrl = (img) => {
  if (!img) return null;
  return img.startsWith("http") ? img : `${BASE_URL}${img}`;
};

// Get All Products (Public)
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.stock,
        p.description,
        p.image1,
        p.image2,
        p.image3,
        p.image4,
        c.name AS category_name,
        s.name AS subcategory_name
      FROM ab_products p
      LEFT JOIN ab_categories c ON p.category_id = c.id
      LEFT JOIN ab_subcategories s ON p.subcategory_id = s.id
      ORDER BY p.id DESC
    `);

    const products = rows.map((p) => ({
      ...p,
      image1: getImageUrl(p.image1),
      image2: getImageUrl(p.image2),
      image3: getImageUrl(p.image3),
      image4: getImageUrl(p.image4),
    }));

    res.json(products);
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Single Product (Public)
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        p.*, 
        c.name AS category_name, 
        s.name AS subcategory_name
      FROM ab_products p
      LEFT JOIN ab_categories c ON p.category_id = c.id
      LEFT JOIN ab_subcategories s ON p.subcategory_id = s.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Product not found" });

    const p = rows[0];
    res.json({
      ...p,
      image1: getImageUrl(p.image1),
      image2: getImageUrl(p.image2),
      image3: getImageUrl(p.image3),
      image4: getImageUrl(p.image4),
    });
  } catch (error) {
    console.error("Error in getProductById:", error);
    res.status(500).json({ error: error.message });
  }
};




//  Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM ab_products WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).json({ error: error.message });
  }
};



// Add Product
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      category_id,
      subcategory_id,
      price,
      stock,
      description,
    } = req.body;

    const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;

    // Uploaded filenames
    const files = req.files || {};
    const image1 = files.image1 ? BASE_URL + files.image1[0].filename : null;
    const image2 = files.image2 ? BASE_URL + files.image2[0].filename : null;
    const image3 = files.image3 ? BASE_URL + files.image3[0].filename : null;
    const image4 = files.image4 ? BASE_URL + files.image4[0].filename : null;

    if (!name || !category_id || !price)
      return res.status(400).json({ message: "Name, category_id, and price are required" });

    // Check duplicate
    const [rows] = await pool.query(
      "SELECT * FROM ab_products WHERE name = ? AND category_id = ?",
      [name, category_id]
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: "Product name already exists in this category!" });
    }

    // Insert into DB
    const [result] = await pool.query(
      `INSERT INTO ab_products 
        (name, category_id, subcategory_id, price, stock, description, image1, image2, image3, image4)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category_id,
        subcategory_id || null,
        price,
        stock || 0,
        description || "",
        image1,
        image2,
        image3,
        image4
      ]
    );

    res.status(201).json({ message: "Product added successfully", id: result.insertId });
  } catch (error) {
    console.error("Error in addProduct:", error);
    res.status(500).json({ error: error.message });
  }
};



// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, subcategory_id, price, stock, description } = req.body;

    const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;

    // Get existing product
    const [existing] = await pool.query("SELECT * FROM ab_products WHERE id = ?", [id]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Product not found" });

    const files = req.files || {};

    // If new upload => full URL
    // If not => keep old URL as is
    const image1 = files.image1
      ? BASE_URL + files.image1[0].filename
      : existing[0].image1;

    const image2 = files.image2
      ? BASE_URL + files.image2[0].filename
      : existing[0].image2;

    const image3 = files.image3
      ? BASE_URL + files.image3[0].filename
      : existing[0].image3;

    const image4 = files.image4
      ? BASE_URL + files.image4[0].filename
      : existing[0].image4;

    await pool.query(
      `UPDATE ab_products 
       SET 
         name = ?, 
         category_id = ?, 
         subcategory_id = ?, 
         price = ?, 
         stock = ?, 
         description = ?, 
         image1 = ?, 
         image2 = ?, 
         image3 = ?, 
         image4 = ? 
       WHERE id = ?`,
      [
        name || existing[0].name,
        category_id || existing[0].category_id,
        subcategory_id || existing[0].subcategory_id,
        price || existing[0].price,
        stock ?? existing[0].stock,
        description || existing[0].description,
        image1,
        image2,
        image3,
        image4,
        id,
      ]
    );

    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({ error: error.message });
  }
};
