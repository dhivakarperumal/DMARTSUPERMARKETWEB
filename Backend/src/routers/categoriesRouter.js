const express = require("express");
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  updateNavbarVisibility,
} = require("../controllers/categoriesController");

const router = express.Router();

router.post("/", createCategory);
router.get("/", getCategories);
router.patch("/navbar", updateNavbarVisibility);
router.get("/:catId", getCategory);
router.put("/:catId", updateCategory);
router.delete("/:catId", deleteCategory);

module.exports = router;
