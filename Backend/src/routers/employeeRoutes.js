const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");

// middleware if required
// const verifyToken = require("../middleware/auth");

router.get(
  "/generate-employee-id",
  employeeController.generateEmployeeId
);

router.get(
  "/",
  employeeController.getEmployees
);

router.get(
  "/:id",
  employeeController.getEmployee
);

router.put(
  "/:id",
  employeeController.updateEmployee
);

router.post(
  "/",
  employeeController.createEmployee
);

router.delete(
  "/:id",
  employeeController.deleteEmployee
);

module.exports = router;