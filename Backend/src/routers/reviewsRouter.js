const express = require("express");
const {
    getAllReviews,
    createReview,
    updateReviewStatus,
    addReply,
    deleteReview
} = require("../controllers/reviewsController");

const router = express.Router();

// Public - create review (from customer or admin)
router.post("/", createReview);

// Admin routes
router.get("/admin/all", getAllReviews);
router.put("/admin/:id/status", updateReviewStatus);
router.put("/admin/:id/reply", addReply);
router.delete("/admin/:id", deleteReview);

module.exports = router;
