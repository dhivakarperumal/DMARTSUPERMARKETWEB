const express = require("express");
const router = express.Router();
const c = require("../controllers/leaveController");

router.get("/types",            c.getLeaveTypes);
router.get("/",                 c.getLeaves);
router.get("/balance/:employeeId", c.getLeaveBalance);
router.post("/",                c.createLeave);
router.put("/:id",              c.updateLeave);
router.delete("/:id",           c.deleteLeave);

module.exports = router;
