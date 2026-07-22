const express = require("express");
const { loginUser, googleLogin } = require("../controllers/loginController");

const router = express.Router();

router.post("/login", loginUser);
router.post("/google-login", googleLogin);

module.exports = router;
