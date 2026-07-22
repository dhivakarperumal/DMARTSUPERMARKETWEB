const { getPool } = require("../config/db");

const initAddressTable = async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                address_type VARCHAR(50) DEFAULT 'Home',
                street_address TEXT NOT NULL,
                city VARCHAR(100),
                district VARCHAR(100),
                state VARCHAR(100),
                zip_code VARCHAR(20),
                country VARCHAR(100) DEFAULT 'India',
                is_default TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        // Add address_type column if it doesn't exist (for existing tables)
        try {
            await connection.query(`ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS address_type VARCHAR(50) DEFAULT 'Home'`);
        } catch (e) { /* column may already exist */ }
    } catch (e) {
        console.error("Error creating user_addresses table:", e);
    } finally {
        connection.release();
    }
};

// GET all addresses for a user
const getUserAddresses = async (req, res) => {
    try {
        await initAddressTable();
        const { user_id } = req.params;
        const pool = getPool();
        const [rows] = await pool.query(
            "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
            [user_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST - Add a new address for a user
const addUserAddress = async (req, res) => {
    try {
        await initAddressTable();
        const pool = getPool();
        const {
            user_id, customer_name, customer_email, customer_phone,
            address_type, street_address, city, district, state, zip_code, country, is_default
        } = req.body;

        if (!user_id || !customer_name || !street_address) {
            return res.status(400).json({ message: "user_id, customer_name, and street_address are required" });
        }

        // If setting as default, unset all other defaults for this user first
        if (is_default) {
            await pool.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [user_id]);
        }

        const [result] = await pool.query(`
            INSERT INTO user_addresses (user_id, customer_name, customer_email, customer_phone, address_type, street_address, city, district, state, zip_code, country, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            user_id, customer_name, customer_email || null, customer_phone || null,
            address_type || 'Home', street_address, city || null, district || null, state || null,
            zip_code || null, country || 'India', is_default ? 1 : 0
        ]);

        const [newAddress] = await pool.query("SELECT * FROM user_addresses WHERE id = ?", [result.insertId]);
        res.status(201).json({ success: true, message: "Address added", address: newAddress[0] });
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT - Update an address
const updateUserAddress = async (req, res) => {
    try {
        const pool = getPool();
        const { id } = req.params;
        const {
            user_id, customer_name, customer_email, customer_phone,
            address_type, street_address, city, district, state, zip_code, country, is_default
        } = req.body;

        // If setting as default, unset all other defaults for this user first
        if (is_default && user_id) {
            await pool.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [user_id]);
        }

        await pool.query(`
            UPDATE user_addresses SET
                customer_name = ?, customer_email = ?, customer_phone = ?,
                address_type = ?, street_address = ?, city = ?, district = ?, state = ?,
                zip_code = ?, country = ?, is_default = ?
            WHERE id = ?
        `, [
            customer_name, customer_email || null, customer_phone || null,
            address_type || 'Home', street_address, city || null, district || null, state || null,
            zip_code || null, country || 'India', is_default ? 1 : 0, id
        ]);

        res.status(200).json({ success: true, message: "Address updated" });
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE - Remove an address
const deleteUserAddress = async (req, res) => {
    try {
        const pool = getPool();
        const { id } = req.params;
        await pool.query("DELETE FROM user_addresses WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: "Address deleted" });
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH - Set an address as default
const setDefaultAddress = async (req, res) => {
    try {
        const pool = getPool();
        const { id } = req.params;
        const { user_id } = req.body;
        await pool.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [user_id]);
        await pool.query("UPDATE user_addresses SET is_default = 1 WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: "Default address updated" });
    } catch (error) {
        console.error("Error setting default:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress, setDefaultAddress, initAddressTable };
