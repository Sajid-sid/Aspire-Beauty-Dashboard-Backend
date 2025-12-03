const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');
const authAdmin = require('../middlewares/authAdmin');

// 🔍 Test route
router.get('/test', (req, res) => {
  res.send('✅ Subcategory route works');
});

// Public routes
router.get('/', subCategoryController.getAllSubcategories);
router.get('/:id', subCategoryController.getSubcategoryById);

// Admin routes
router.post('/', authAdmin, subCategoryController.addSubcategory);
router.put('/update/:id', authAdmin, subCategoryController.updateSubcategory);
router.delete('/delete/:id', authAdmin, subCategoryController.deleteSubcategory);
router.get('/getbycategory/:categoryId', subCategoryController.getByCategoryId);

module.exports = router;
