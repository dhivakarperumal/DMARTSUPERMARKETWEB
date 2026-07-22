const express = require("express");
const { getAllBanners, createBanner, updateBanner, deleteBanner } = require("../controllers/bannersController");

const router = express.Router();

router.get("/", getAllBanners);
router.post("/", createBanner);
router.put("/:id", updateBanner);
router.delete("/:id", deleteBanner);

module.exports = router;
