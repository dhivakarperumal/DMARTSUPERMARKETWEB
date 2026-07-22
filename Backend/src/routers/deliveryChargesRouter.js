const express = require("express");
const {
  getDeliveryCharges,
  createOrUpdateDeliveryCharges,
} = require("../controllers/deliveryChargesController");

const router = express.Router();

router.get("/", getDeliveryCharges);
router.post("/", createOrUpdateDeliveryCharges);
router.put("/", createOrUpdateDeliveryCharges);

module.exports = router;
