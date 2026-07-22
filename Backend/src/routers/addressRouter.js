const express = require("express");
const {
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress
} = require("../controllers/addressController");

const router = express.Router();

router.get("/user/:user_id", getUserAddresses);
router.post("/", addUserAddress);
router.put("/:id", updateUserAddress);
router.delete("/:id", deleteUserAddress);
router.patch("/:id/set-default", setDefaultAddress);

module.exports = router;
