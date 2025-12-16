const pool = require("../config/db");

// Add or Update Product Details
exports.addOrUpdateDetails = async (req, res) => {
  try {
    const {
      productid,
      description,
      ingredients,
      how_to_use,
      features,
      manufacturer_importer, // single field now
    } = req.body;

    if (!productid) return res.status(400).json({ message: "Product ID required" });

    // Handle description image
    const descriptionImage = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null;

    // Check if details exist
    const [existing] = await pool.query(
      `SELECT * FROM ab_product_details WHERE productid = ?`,
      [productid]
    );

    if (existing.length > 0) {
      // Update existing details
      await pool.query(
        `UPDATE ab_product_details 
         SET description=?, ingredients=?, how_to_use=?, description_image=?, features=?, manufacturer_importer=? 
         WHERE productid=?`,
        [
          description,
          ingredients,
          how_to_use,
          descriptionImage || existing[0].description_image, // keep old image if not updated
          features,
          manufacturer_importer,
          productid,
        ]
      );

      return res.json({ message: "Product details updated successfully" });
    }

    // Insert new details
    await pool.query(
      `INSERT INTO ab_product_details 
       (productid, description, ingredients, how_to_use, description_image, features, manufacturer_importer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        productid,
        description,
        ingredients,
        how_to_use,
        descriptionImage,
        features,
        manufacturer_importer,
      ]
    );

    res.json({ message: "Product details added successfully" });
  } catch (err) {
    console.error("Add/Update Product Details Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get Product Details
exports.getProductDetails = async (req, res) => {
  try {
    const { productid } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM ab_product_details WHERE productid = ?`,
      [productid]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "No details found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Get Product Details Error:", err);
    res.status(500).json({ message: err.message });
  }
};
