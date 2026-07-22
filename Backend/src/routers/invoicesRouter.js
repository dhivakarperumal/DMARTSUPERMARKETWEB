const express = require("express");
const { createInvoice, getInvoices, getInvoiceById } = require("../controllers/invoicesController");

const router = express.Router();

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);

module.exports = router;
