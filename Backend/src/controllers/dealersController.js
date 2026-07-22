const { getPool, getLargePacketConnection } = require("../config/db");

// Helper to parse JSON fields
const parseJsonField = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

// Create Dealers Table if it doesn't exist
const createDealersTable = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS dealers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dealerName VARCHAR(255) NOT NULL,
        companyName VARCHAR(255) NOT NULL,
        contactPerson VARCHAR(255) NOT NULL,
        mobileNumber VARCHAR(20) NOT NULL,
        whatsappNumber VARCHAR(20),
        email VARCHAR(255) NOT NULL UNIQUE,
        addressLine1 VARCHAR(500) NOT NULL,
        addressLine2 VARCHAR(500),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        gstNumber VARCHAR(50),
        panNumber VARCHAR(50),
        bankAccountName VARCHAR(255),
        bankAccountNumber VARCHAR(50),
        ifscCode VARCHAR(50),
        upiId VARCHAR(100),
        profileImage LONGTEXT,
        status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email),
        INDEX idx_status (status),
        INDEX idx_city (city)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log("✅ Dealers table created or already exists");
  } finally {
    connection.release();
  }
};

// Create Dealer
const createDealer = async (req, res) => {
  try {
    const {
      dealerName,
      companyName,
      contactPerson,
      mobileNumber,
      whatsappNumber,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      gstNumber,
      panNumber,
      bankAccountName,
      bankAccountNumber,
      ifscCode,
      upiId,
      profileImage,
      status,
    } = req.body;

    // Validate required fields
    if (
      !dealerName ||
      !companyName ||
      !contactPerson ||
      !mobileNumber ||
      !email ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode ||
      !gstNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const connection = await getLargePacketConnection();

    try {
      await createDealersTable();

      // Check if email already exists
      const [existing] = await connection.execute(
        "SELECT id FROM dealers WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Dealer with this email already exists",
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO dealers (
          dealerName, companyName, contactPerson, mobileNumber, whatsappNumber,
          email, addressLine1, addressLine2, city, state, pincode, country,
          gstNumber, panNumber, bankAccountName, bankAccountNumber, ifscCode,
          upiId, profileImage, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          dealerName,
          companyName,
          contactPerson,
          mobileNumber,
          whatsappNumber || "",
          email,
          addressLine1,
          addressLine2 || "",
          city,
          state,
          pincode,
          country || "India",
          gstNumber,
          panNumber || "",
          bankAccountName || "",
          bankAccountNumber || "",
          ifscCode || "",
          upiId || "",
          profileImage || "",
          status || "Active",
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Dealer created successfully",
        id: result.insertId,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Create dealer failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create dealer",
      error: error.message,
    });
  }
};

// Get All Dealers
const getDealers = async (req, res) => {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createDealersTable();

      const [dealers] = await connection.execute(
        "SELECT * FROM dealers ORDER BY created_at DESC"
      );

      return res.status(200).json({
        success: true,
        data: dealers,
        count: dealers.length,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Fetch dealers failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dealers",
      error: error.message,
    });
  }
};

// Get Single Dealer
const getDealer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Dealer ID is required",
      });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createDealersTable();

      const [dealers] = await connection.execute(
        "SELECT * FROM dealers WHERE id = ?",
        [id]
      );

      if (dealers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Dealer not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: dealers[0],
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Fetch dealer failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dealer",
      error: error.message,
    });
  }
};

// Update Dealer
const updateDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Dealer ID is required",
      });
    }

    const connection = await getLargePacketConnection();

    try {
      await createDealersTable();

      // Check if dealer exists
      const [existing] = await connection.execute(
        "SELECT id FROM dealers WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Dealer not found",
        });
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];

      const allowedFields = [
        "dealerName",
        "companyName",
        "contactPerson",
        "mobileNumber",
        "whatsappNumber",
        "email",
        "addressLine1",
        "addressLine2",
        "city",
        "state",
        "pincode",
        "country",
        "gstNumber",
        "panNumber",
        "bankAccountName",
        "bankAccountNumber",
        "ifscCode",
        "upiId",
        "profileImage",
        "status",
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updates[field]);
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields to update",
        });
      }

      updateFields.push("updated_at = NOW()");
      updateValues.push(id);

      const query = `UPDATE dealers SET ${updateFields.join(", ")} WHERE id = ?`;

      await connection.execute(query, updateValues);

      return res.status(200).json({
        success: true,
        message: "Dealer updated successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Update dealer failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update dealer",
      error: error.message,
    });
  }
};

// Delete Dealer
const deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Dealer ID is required",
      });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createDealersTable();

      const [result] = await connection.execute(
        "DELETE FROM dealers WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Dealer not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Dealer deleted successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete dealer failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete dealer",
      error: error.message,
    });
  }
};

module.exports = {
  createDealer,
  getDealers,
  getDealer,
  updateDealer,
  deleteDealer,
};
