const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const { uploadDir } = require("../middlewares/multerConfig");

// Helper → remove old image file
const deleteImage = (filename) => {
    if (!filename) return;
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};




//add Banner
exports.addBanner = async (req, res) => {
    try {
        const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;

        const home1 = req.files.home1?.[0].filename;
        const home2 = req.files.home2?.[0].filename;
        const home3 = req.files.home3?.[0].filename;

        const mobile1 = req.files.mobile1?.[0].filename;
        const mobile2 = req.files.mobile2?.[0].filename;
        const mobile3 = req.files.mobile3?.[0].filename;

        const middle1 = req.files.middle1?.[0].filename;
        const middle2 = req.files.middle2?.[0].filename;

        // ✅ Validate
        if (!home1 || !home2 || !home3 ||
            !mobile1 || !mobile2 || !mobile3 ||
            !middle1 || !middle2) {
            return res.status(400).json({ message: "All banner images are required" });
        }

        // ✅ FULL URLs
        const imagePaths = {
            home1: `${BASE_URL}${home1}`,
            home2: `${BASE_URL}${home2}`,
            home3: `${BASE_URL}${home3}`,

            mobile1: `${BASE_URL}${mobile1}`,
            mobile2: `${BASE_URL}${mobile2}`,
            mobile3: `${BASE_URL}${mobile3}`,

            middle1: `${BASE_URL}${middle1}`,
            middle2: `${BASE_URL}${middle2}`,
        };

        // ✅ Save FULL URLs in DB
        await pool.query(
            `
            INSERT INTO ab_banner 
            (home1, home2, home3, mobile1, mobile2, mobile3, middle1, middle2)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                imagePaths.home1,
                imagePaths.home2,
                imagePaths.home3,
                imagePaths.mobile1,
                imagePaths.mobile2,
                imagePaths.mobile3,
                imagePaths.middle1,
                imagePaths.middle2
            ]
        );

        return res.status(201).json({
            message: "Banner added successfully!",
            images: imagePaths,
        });

    } catch (error) {
        console.error("Banner Error in addBanner:", error);
        return res.status(500).json({ error: error.message });
    }
};









//editbanner
exports.editBanner = async (req, res) => {
    try {
        const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;

        // Get existing banner (only 1 record)
        const [rows] = await pool.query("SELECT * FROM ab_banner WHERE id = 1");

        if (rows.length === 0) {
            return res.status(404).json({ message: "Banner not found" });
        }

        const current = rows[0];

        // Build updated values
        const updated = {
            home1: req.files.home1
                ? `${BASE_URL}${req.files.home1[0].filename}`
                : current.home1,

            home2: req.files.home2
                ? `${BASE_URL}${req.files.home2[0].filename}`
                : current.home2,

            home3: req.files.home3
                ? `${BASE_URL}${req.files.home3[0].filename}`
                : current.home3,

            mobile1: req.files.mobile1
                ? `${BASE_URL}${req.files.mobile1[0].filename}`
                : current.mobile1,

            mobile2: req.files.mobile2
                ? `${BASE_URL}${req.files.mobile2[0].filename}`
                : current.mobile2,

            mobile3: req.files.mobile3
                ? `${BASE_URL}${req.files.mobile3[0].filename}`
                : current.mobile3,

            middle1: req.files.middle1
                ? `${BASE_URL}${req.files.middle1[0].filename}`
                : current.middle1,

            middle2: req.files.middle2
                ? `${BASE_URL}${req.files.middle2[0].filename}`
                : current.middle2,
        };

        // ✅ Delete old replaced images
        Object.keys(updated).forEach((key) => {
            if (req.files[key]) {
                const oldUrl = current[key]; // full URL
                const oldFilename = oldUrl?.split("/").pop(); // extract file only
                if (oldFilename) deleteImage(oldFilename);
            }
        });

        // ✅ Update DB with FULL URLs
        await pool.query(
            `
            UPDATE ab_banner SET 
                home1=?, home2=?, home3=?,
                mobile1=?, mobile2=?, mobile3=?,
                middle1=?, middle2=?
            WHERE id = 1
            `,
            Object.values(updated)
        );

        return res.status(200).json({
            message: "Banner updated successfully!",
            updatedImages: updated,
        });

    } catch (error) {
        console.error("Banner Error in editBanner:", error);
        return res.status(500).json({ error: error.message });
    }
};



//get banner
exports.getBanner = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM ab_banner WHERE id = 1");
        return res.status(200).json(rows[0] || {});
    } catch (error) {
        console.error("Banner Error in getBanner:", error);
        return res.status(500).json({ error: error.message });
    }
};
