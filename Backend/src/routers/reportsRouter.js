const express = require("express");
const router = express.Router();
const {
  getSalesReport,
  getProductsReport,
  getCategoryReport,
  getCustomerReport,
  getInventoryReport,
  getPurchaseReport,
} = require("../controllers/reportsController");

router.get("/sales", getSalesReport);
router.get("/products", getProductsReport);
router.get("/categories", getCategoryReport);
router.get("/customers", getCustomerReport);
router.get("/inventory", getInventoryReport);
router.get("/purchases", getPurchaseReport);

module.exports = router;
