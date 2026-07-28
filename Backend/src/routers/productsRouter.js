const express = require("express");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLatestCode,
  addProductReview
} = require("../controllers/productsController");

const router = express.Router();

router.post("/", createProduct);
router.post("/:id/reviews", addProductReview);
router.get("/", getProducts);
router.get("/all", getProducts);
router.get("/latest-code", getLatestCode);
router.get("/:id", getProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
