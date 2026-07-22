const express = require("express");
const {
  createDealer,
  getDealers,
  getDealer,
  updateDealer,
  deleteDealer,
} = require("../controllers/dealersController");

const dealersRouter = express.Router();

// Create a new dealer
dealersRouter.post("/", createDealer);

// Get all dealers
dealersRouter.get("/", getDealers);

// Get single dealer by ID
dealersRouter.get("/:id", getDealer);

// Update dealer by ID
dealersRouter.put("/:id", updateDealer);

// Delete dealer by ID
dealersRouter.delete("/:id", deleteDealer);

module.exports = dealersRouter;
