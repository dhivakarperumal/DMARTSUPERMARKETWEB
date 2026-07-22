const express = require("express");
const router = express.Router();
const c = require("../controllers/salaryController");

router.get("/summary",      c.getSalarySummary);
router.get("/",             c.getSalaries);
router.get("/payslip/:id",  c.getPayslip);
router.post("/calculate",   c.calculateSalary);
router.post("/",            c.saveSalary);
router.put("/pay/:id",      c.paySalary);
router.put("/:id",          c.saveSalary);
router.delete("/:id",       c.deleteSalary);

module.exports = router;
