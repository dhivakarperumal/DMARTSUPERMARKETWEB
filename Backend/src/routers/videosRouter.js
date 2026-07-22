const express = require("express");
const {
  getVideos,
  getVideo,
  createVideo,
  updateVideo,
  deleteVideo,
} = require("../controllers/videosController");

const router = express.Router();

router.get("/", getVideos);
router.get("/:id", getVideo);
router.post("/", createVideo);
router.put("/:id", updateVideo);
router.delete("/:id", deleteVideo);

module.exports = router;
