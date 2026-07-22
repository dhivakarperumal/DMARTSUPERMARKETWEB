const { getPool } = require("../config/db");
const crypto = require("crypto");

const ensurePaymentIntegrationSchema = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_integration (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payment_id VARCHAR(36) UNIQUE NOT NULL,
      primary_gateway VARCHAR(100) DEFAULT NULL,
      cash_support TINYINT(1) DEFAULT 1,
      online_payment_support TINYINT(1) DEFAULT 1,
      upi_support TINYINT(1) DEFAULT 1,
      upi_id VARCHAR(255) DEFAULT NULL,
      credit_debit_card TINYINT(1) DEFAULT 1,
      payment_type VARCHAR(50) DEFAULT 'upi',
      razorpay_enabled TINYINT(1) DEFAULT 1,
      razorpay_key VARCHAR(255) DEFAULT NULL,
      merchant_id VARCHAR(255) DEFAULT NULL,
      api_key VARCHAR(255) DEFAULT NULL,
      secret_key VARCHAR(255) DEFAULT NULL,
      webhook_url VARCHAR(255) DEFAULT NULL,
      callback_url VARCHAR(255) DEFAULT NULL,
      mode VARCHAR(50) DEFAULT 'Live',
      auto_payment_verification TINYINT(1) DEFAULT 1,
      refund_support TINYINT(1) DEFAULT 1,
      partial_payment TINYINT(1) DEFAULT 0,
      wallet_payment TINYINT(1) DEFAULT 1,
      cod TINYINT(1) DEFAULT 1,
      emi_support TINYINT(1) DEFAULT 0,
      created_by VARCHAR(36) DEFAULT NULL,
      updated_by VARCHAR(36) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const alterStatements = [
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS cash_support TINYINT(1) DEFAULT 1",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS online_payment_support TINYINT(1) DEFAULT 1",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS upi_support TINYINT(1) DEFAULT 1",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS credit_debit_card TINYINT(1) DEFAULT 1",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'upi'",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS razorpay_enabled TINYINT(1) DEFAULT 1",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS razorpay_key VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS card_number VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS card_expiry VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE payment_integration ADD COLUMN IF NOT EXISTS card_cvv VARCHAR(20) DEFAULT NULL",
  ];

  for (const statement of alterStatements) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (!/duplicate column|already exists/i.test(error.message || "")) {
        throw error;
      }
    }
  }
};

const normalizePaymentSettingsPayload = (payload = {}) => {
  const normalizedCashSupport = Number(payload.cashSupport ?? true);
  const normalizedOnlinePaymentSupport = Number(payload.onlinePaymentSupport ?? true);
  const normalizedUpiSupport = Number(payload.upiSupport ?? true);
  const normalizedCardSupport = Number(payload.cardSupport ?? true);
  const normalizedRazorpayEnabled = Number(payload.razorpayEnabled ?? true);
  const normalizedPaymentType = payload.paymentType || (normalizedCardSupport ? 'both' : 'upi');
  const normalizedUpiId = payload.upiId || null;
  const normalizedRazorpayKey = payload.razorpayKey || null;

  return {
    cashSupport: normalizedCashSupport,
    onlinePaymentSupport: normalizedOnlinePaymentSupport,
    upiSupport: normalizedUpiSupport,
    upiId: normalizedUpiId,
    cardSupport: normalizedCardSupport,
    paymentType: normalizedPaymentType,
    razorpayEnabled: normalizedRazorpayEnabled,
    razorpayKey: normalizedRazorpayKey,
    cardNumber: payload.cardNumber || null,
    cardExpiry: payload.cardExpiry || null,
    cardCvv: payload.cardCvv || null,
  };
};

exports.normalizePaymentSettingsPayload = normalizePaymentSettingsPayload;

// Get Receipt Settings
exports.getReceiptSettings = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM receipt_settings LIMIT 1");
    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching receipt settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update Receipt Settings
exports.updateReceiptSettings = async (req, res) => {
  try {
    const pool = getPool();
    const {
      storeName,
      address,
      phone,
      email,
      gst,
      fssai,
      invoicePrefix,
      invoiceFormat,
      currency,
      dateFormat,
      taxDisplay,
      discountDisplay,
      qrCodeDisplay,
      footerMessage,
      thankYouMessage,
      returnPolicy,
      storeLogo
    } = req.body;

    const userId = req.headers['x-user-id'] || null;
    const createdBy = userId;
    const updatedBy = userId;

    const [rows] = await pool.query("SELECT id, receipt_id FROM receipt_settings LIMIT 1");

    if (rows.length > 0) {
      const id = rows[0].id;
      const receiptId = rows[0].receipt_id || crypto.randomUUID();
      await pool.query(
        `UPDATE receipt_settings SET 
          store_name = ?, address = ?, phone = ?, email = ?, gst = ?, fssai = ?, 
          invoice_prefix = ?, invoice_format = ?, currency = ?, date_format = ?, 
          tax_display = ?, discount_display = ?, qr_code_display = ?, 
          footer_message = ?, thank_you_message = ?, return_policy = ?, store_logo = ?,
          receipt_id = ?, updated_by = ?
         WHERE id = ?`,
        [
          storeName, address, phone, email, gst, fssai, invoicePrefix, invoiceFormat, currency, dateFormat,
          taxDisplay, discountDisplay, qrCodeDisplay, footerMessage, thankYouMessage, returnPolicy, storeLogo,
          receiptId, updatedBy, id
        ]
      );
    } else {
      const receiptId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO receipt_settings (
          store_name, address, phone, email, gst, fssai, invoice_prefix, invoice_format, currency, date_format,
          tax_display, discount_display, qr_code_display, footer_message, thank_you_message, return_policy, store_logo,
          receipt_id, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          storeName, address, phone, email, gst, fssai, invoicePrefix, invoiceFormat, currency, dateFormat,
          taxDisplay, discountDisplay, qrCodeDisplay, footerMessage, thankYouMessage, returnPolicy, storeLogo,
          receiptId, createdBy, updatedBy
        ]
      );
    }

    res.status(200).json({ success: true, message: "Receipt settings saved successfully." });
  } catch (error) {
    console.error("Error updating receipt settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get Payment Settings
exports.getPaymentSettings = async (req, res) => {
  try {
    const pool = getPool();
    await ensurePaymentIntegrationSchema(pool);
    const [rows] = await pool.query("SELECT * FROM payment_integration LIMIT 1");
    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update Payment Settings
exports.updatePaymentSettings = async (req, res) => {
  try {
    const pool = getPool();
    await ensurePaymentIntegrationSchema(pool);

    const normalizedPayload = normalizePaymentSettingsPayload(req.body);
    const {
      cashSupport: normalizedCashSupport,
      onlinePaymentSupport: normalizedOnlinePaymentSupport,
      upiSupport: normalizedUpiSupport,
      upiId: normalizedUpiId,
      cardSupport: normalizedCardSupport,
      paymentType: normalizedPaymentType,
      razorpayEnabled: normalizedRazorpayEnabled,
      razorpayKey: normalizedRazorpayKey,
      cardNumber,
      cardExpiry,
      cardCvv,
    } = normalizedPayload;

    const userId = req.headers['x-user-id'] || null;
    const createdBy = userId;
    const updatedBy = userId;

    const [rows] = await pool.query("SELECT id, payment_id FROM payment_integration LIMIT 1");

    if (rows.length > 0) {
      const id = rows[0].id;
      const paymentId = rows[0].payment_id || crypto.randomUUID();
      await pool.query(
        `UPDATE payment_integration SET
cash_support=?,
online_payment_support=?,
upi_support=?,
upi_id=?,
credit_debit_card=?,
payment_type=?,
razorpay_enabled=?,
razorpay_key=?,
card_number=?,
card_expiry=?,
card_cvv=?,
payment_id=?,
updated_by=?
WHERE id=?`,
        [
          normalizedCashSupport,
          normalizedOnlinePaymentSupport,
          normalizedUpiSupport,
          normalizedUpiId,
          normalizedCardSupport,
          normalizedPaymentType,
          normalizedRazorpayEnabled,
          normalizedRazorpayKey,
          cardNumber,
          cardExpiry,
          cardCvv,
          paymentId,
          updatedBy,
          id
        ]
      );
    } else {
      const paymentId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO payment_integration(
cash_support,
online_payment_support,
upi_support,
upi_id,
credit_debit_card,
payment_type,
razorpay_enabled,
razorpay_key,
card_number,
card_expiry,
card_cvv,
payment_id,
created_by,
updated_by
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          normalizedCashSupport,
          normalizedOnlinePaymentSupport,
          normalizedUpiSupport,
          normalizedUpiId,
          normalizedCardSupport,
          normalizedPaymentType,
          normalizedRazorpayEnabled,
          normalizedRazorpayKey,
          cardNumber,
          cardExpiry,
          cardCvv,
          paymentId,
          createdBy,
          updatedBy
        ]
      );
    }

    res.status(200).json({ success: true, message: "Payment settings saved successfully." });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// Get Tax Settings
exports.getTaxSettings = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM tax_settings LIMIT 1");
    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching tax settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update Tax Settings
exports.updateTaxSettings = async (req, res) => {
  try {
    const pool = getPool();
    const {
      enableGst,
      defaultGstPercentage,
      taxMode
    } = req.body;

    const userId = req.headers['x-user-id'] || null;
    const createdBy = userId;
    const updatedBy = userId;

    const [rows] = await pool.query("SELECT id, tax_id FROM tax_settings LIMIT 1");

    if (rows.length > 0) {
      const id = rows[0].id;
      const taxId = rows[0].tax_id || crypto.randomUUID();
      await pool.query(
        `UPDATE tax_settings SET
enable_gst=?,
default_gst_percentage=?,
tax_mode=?,
tax_id=?,
updated_by=?
WHERE id=?`,
        [
          enableGst,
          defaultGstPercentage,
          taxMode,
          taxId,
          updatedBy,
          id
        ]
      );
    } else {
      const taxId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO tax_settings(
enable_gst,
default_gst_percentage,
tax_mode,
tax_id,
created_by,
updated_by
)
VALUES (?, ?, ?, ?, ?, ?)`,
        [
          enableGst,
          defaultGstPercentage,
          taxMode,
          taxId,
          createdBy,
          updatedBy
        ]
      );
    }

    res.status(200).json({ success: true, message: "Tax settings saved successfully." });
  } catch (error) {
    console.error("Error updating tax settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get Store Settings
exports.getStoreSettings = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM store_settings LIMIT 1");
    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching store settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update Store Settings
exports.updateStoreSettings = async (req, res) => {
  try {
    const pool = getPool();
    const {
      storeName,
      storeLogo,
      email,
      phone,
      address,
      city,
      state,
      country,
      zipCode,
      gstin,
      fssai,
      businessType,
      timezone,
      language,
      currency,
      openingTime,
      closingTime,
      latitude,
      longitude,
    } = req.body;

    const userId = req.headers['x-user-id'] || null;

    const [rows] = await pool.query("SELECT id, store_id FROM store_settings LIMIT 1");

    if (rows.length > 0) {
      const id = rows[0].id;
      const storeId = rows[0].store_id || crypto.randomUUID();
      await pool.query(
        `UPDATE store_settings SET
          store_name=?, store_logo=?, email=?, phone=?, address=?,
          city=?, state=?, country=?, zip_code=?, gstin=?, fssai=?,
          business_type=?, timezone=?, language=?, currency=?,
          opening_time=?, closing_time=?, latitude=?, longitude=?,
          store_id=?, updated_by=?
         WHERE id=?`,
        [
          storeName, storeLogo, email, phone, address,
          city, state, country, zipCode, gstin, fssai,
          businessType, timezone, language, currency,
          openingTime, closingTime, latitude, longitude,
          storeId, userId, id
        ]
      );
    } else {
      const storeId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO store_settings (
          store_name, store_logo, email, phone, address,
          city, state, country, zip_code, gstin, fssai,
          business_type, timezone, language, currency,
          opening_time, closing_time, latitude, longitude,
          store_id, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          storeName, storeLogo, email, phone, address,
          city, state, country, zipCode, gstin, fssai,
          businessType, timezone, language, currency,
          openingTime, closingTime, latitude, longitude,
          storeId, userId, userId
        ]
      );
    }

    res.status(200).json({ success: true, message: "Store settings saved successfully." });
  } catch (error) {
    console.error("Error updating store settings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

