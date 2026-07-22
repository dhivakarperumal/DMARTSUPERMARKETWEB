const { getPool, getLargePacketConnection } = require("../config/db");

const initInvoicesTable = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id VARCHAR(50) NOT NULL UNIQUE,
        dealer_id INT DEFAULT NULL,
        invoice_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        payment_method VARCHAR(50) DEFAULT 'Offline',
        payment_status VARCHAR(50) DEFAULT 'pending',
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(255) DEFAULT NULL,
        shipping_address JSON,
        total_amount DECIMAL(10, 2) NOT NULL,
        document LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id VARCHAR(50) NOT NULL,
        product_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        variant_info JSON,
        variant_color VARCHAR(100) DEFAULT NULL,
        variant_size VARCHAR(100) DEFAULT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        image TEXT DEFAULT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (error) {
    console.error("Error creating invoices table:", error);
    throw error;
  } finally {
    connection.release();
  }
};

const createInvoice = async (req, res) => {
  const connection = await getLargePacketConnection();

  try {
    await initInvoicesTable();

    const {
      dealer_id,
      invoice_date,
      status,
      payment_method,
      payment_status,
      total_amount,
      items,
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      document,
    } = req.body;

    if (!dealer_id) {
      return res.status(400).json({
        success: false,
        message: "Dealer ID is required for invoice creation",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoice must contain at least one item",
      });
    }

    const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO invoices (
        invoice_id,
        dealer_id,
        invoice_date,
        status,
        payment_method,
        payment_status,
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        total_amount,
        document
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        dealer_id,
        invoice_date || new Date().toISOString().split("T")[0],
        status || "Pending",
        payment_method || "Offline",
        payment_status || "pending",
        customer_name || "Dealer",
        customer_phone || "",
        customer_email || null,
        shipping_address ? JSON.stringify(shipping_address) : null,
        parseFloat(total_amount) || 0,
        document || null,
      ]
    );

    for (const item of items) {
      await connection.query(
        `INSERT INTO invoice_items (
          invoice_id,
          product_id,
          name,
          variant_info,
          variant_color,
          variant_size,
          price,
          quantity,
          total,
          image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.product_id || item.id || null,
          item.name || "",
          item.variant_info ? JSON.stringify(item.variant_info) : null,
          item.variant_color || item.colorName || null,
          item.variant_size || item.size || null,
          parseFloat(item.price) || 0,
          parseInt(item.quantity, 10) || 1,
          parseFloat(item.total) || (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1),
          item.image || null,
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice_id: invoiceId,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Invoice rollback failed:", rollbackError);
      }
    }
    console.error("Error creating invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const getInvoices = async (req, res) => {
  try {
    await initInvoicesTable();
    const pool = getPool();
    const [invoices] = await pool.query("SELECT * FROM invoices ORDER BY created_at DESC");

    return res.status(200).json({
      success: true,
      data: invoices,
      count: invoices.length,
    });
  } catch (error) {
    console.error("Fetch invoices failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    await initInvoicesTable();
    const pool = getPool();
    const [invoices] = await pool.query("SELECT * FROM invoices WHERE id = ?", [id]);

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const invoice = invoices[0];
    const [items] = await pool.query("SELECT * FROM invoice_items WHERE invoice_id = ?", [invoice.invoice_id]);

    return res.status(200).json({
      success: true,
      data: { ...invoice, items },
    });
  } catch (error) {
    console.error("Fetch invoice failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
};
