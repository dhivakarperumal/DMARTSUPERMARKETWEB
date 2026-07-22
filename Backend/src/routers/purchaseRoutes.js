const express = require('express');
const router = express.Router();
const c = require('../controllers/purchaseController');

// Dashboard
router.get('/dashboard/stats', c.getDashboardStats);

// Suppliers
router.get('/suppliers/export/excel', c.exportSuppliersExcel);
router.get('/suppliers', c.getAllSuppliers);
router.get('/suppliers/:id', c.getSupplierById);
router.post('/suppliers', c.addSupplier);
router.put('/suppliers/:id', c.updateSupplier);
router.delete('/suppliers/:id', c.deleteSupplier);

// Purchase Orders
router.get('/orders', c.getAllPurchaseOrders);
router.post('/orders', c.createPurchaseOrder);
router.put('/orders/:id', c.updatePurchaseOrder);

// Purchases / GRN
router.get('/export/excel', c.exportPurchasesExcel);
router.get('/', c.getAllPurchases);
router.post('/', c.createPurchase);
router.get('/:id/detail', c.getPurchaseById);

// Payments
router.get('/payments', c.getAllPayments);
router.post('/payments', c.addPayment);

// Returns
router.get('/returns', c.getAllReturns);
router.post('/returns', c.createReturn);

// Reports
router.get('/reports/purchases', c.getPurchaseReport);
router.get('/reports/stock-ledger', c.getStockLedger);

// Audit Logs
router.get('/audit-logs', c.getAuditLogs);

module.exports = router;
