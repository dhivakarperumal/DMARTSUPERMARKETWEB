const express = require("express");
const router = express.Router();
const c = require("../controllers/attendanceController");

router.get("/today",          c.getAttendanceToday);
router.get("/",               c.getAttendance);
router.get("/for-date",       c.getEmployeesForDate);
router.get("/monthly-summary",c.getMonthlySummary);
router.post("/",              c.markAttendance);
router.post("/bulk",          c.bulkMarkAttendance);

module.exports = router;
