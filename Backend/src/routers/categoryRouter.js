const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// POST a new category
router.post('/', categoryController.createCategory);

// GET all categories
router.get('/', categoryController.getAllCategories);

module.exports = router;
