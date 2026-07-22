const { getPool } = require("../config/db");
const crypto = require("crypto");
const { calculateStockConsumptionInBaseUnits } = require("./stockUtils");

const initOrdersTable = async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(50) NOT NULL UNIQUE,
                unique_id CHAR(36) UNIQUE,
                user_id VARCHAR(100) DEFAULT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                customer_email VARCHAR(255) DEFAULT NULL,
                order_type VARCHAR(50) DEFAULT 'Shop',
                payment_method VARCHAR(50) DEFAULT 'Cash',
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_id VARCHAR(255) DEFAULT NULL,
                shipping_address JSON,
                total_amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50) DEFAULT 'Paid',
                created_by CHAR(36) DEFAULT NULL,
                updated_by CHAR(36) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Add columns if they don't exist (safe migration)
        const alterColumns = [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ];
        for (const sql of alterColumns) {
            try { await connection.query(sql); } catch (e) { /* column may already exist */ }
        }

        // Ensure optional logistic and cancellation columns exist
        const extraAlters = [
            "ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(255)",
            "ALTER TABLE orders ADD COLUMN courier_name VARCHAR(255)",
            "ALTER TABLE orders ADD COLUMN shipped_at DATETIME",
            "ALTER TABLE orders ADD COLUMN cancellation_reason TEXT",
            "ALTER TABLE orders ADD COLUMN cancelled_at DATETIME",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10, 2) DEFAULT 0.00",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km DECIMAL(8, 2) DEFAULT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0.00",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_before_discount DECIMAL(10, 2) DEFAULT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS unique_id CHAR(36) UNIQUE",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by CHAR(36) DEFAULT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by CHAR(36) DEFAULT NULL"
        ];
        for (const sql of extraAlters) {
            try { await connection.query(sql); } catch (e) { /* ignore if exists */ }
        }

        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(50) NOT NULL,
                product_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                variant_info JSON,
                variant_color VARCHAR(100) DEFAULT NULL,
                variant_size VARCHAR(100) DEFAULT NULL,
                price DECIMAL(10, 2) NOT NULL,
                quantity DECIMAL(10, 3) NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                image TEXT DEFAULT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
            )
        `);

        // Add missing columns to order_items table (safe migration)
        const orderItemAlters = [
            "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_color VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_size VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE order_items ADD COLUMN image TEXT DEFAULT NULL"
        ];
        for (const sql of orderItemAlters) {
            try { await connection.query(sql); } catch (e) { /* column may already exist */ }
        }

        // Alter order_items quantity column to support decimal values for kg/g/L/ml
        try {
            await connection.query("ALTER TABLE order_items MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL");
        } catch (e) {
            console.error("Error altering order_items quantity column to decimal:", e);
        }
    } catch (e) {
        console.error("Error creating orders table:", e);
    } finally {
        connection.release();
    }
};

const createOrder = async (req, res) => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await initOrdersTable();

        const {
            user_id, customer_name, customer_phone, customer_email,
            order_type, payment_method, payment_status, payment_id,
            shipping_address, street_address, city, district, state, zip_code, country,
            total_amount, status, items, delivery_charge, distance_km, coupon_code, coupon_discount, subtotal_before_discount
        } = req.body;

        const order_id = 'ORD-' + Date.now() + Math.floor(Math.random() * 1000);

        // Build shipping address — accept either a JSON object or individual fields
        let shippingData = null;
        if (shipping_address) {
            shippingData = JSON.stringify(shipping_address);
        } else if (street_address) {
            shippingData = JSON.stringify({ street: street_address, city, district, state, zip: zip_code, country: country || 'India' });
        }

        const unique_id = crypto.randomUUID();
        const created_by = req.headers['x-user-id'] || null;
        const updated_by = req.headers['x-user-id'] || null;

        await connection.beginTransaction();

        await connection.query(`
            INSERT INTO orders (unique_id, order_id, user_id, customer_name, customer_phone, customer_email, order_type, payment_method, payment_status, payment_id, shipping_address, total_amount, status, delivery_charge, distance_km, coupon_code, coupon_discount, subtotal_before_discount, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            unique_id,
            order_id,
            user_id || null,
            customer_name,
            customer_phone || "",
            customer_email || null,
            order_type || 'Shop',
            payment_method || 'Cash',
            payment_status || 'pending',
            payment_id || null,
            shippingData,
            total_amount,
            status || 'Paid',
            delivery_charge || 0,
            distance_km || null,
            coupon_code || null,
            coupon_discount || 0,
            subtotal_before_discount || null,
            created_by,
            updated_by
        ]);

        if (items && items.length > 0) {
            // check which columns exist on order_items to avoid inserting into missing columns
            let orderItemColsSet = new Set();
            try {
                const [cols] = await connection.query("SHOW COLUMNS FROM order_items");
                orderItemColsSet = new Set(cols.map(c => c.Field));
            } catch (e) {
                // table may not exist yet; initOrdersTable should have created it above
            }

            for (const item of items) {
                const cols = ['order_id','product_id','name','variant_info','variant_color','variant_size','price','quantity','total'];
                const vals = [
                    order_id,
                    item.product_id || item.id,
                    item.name,
                    item.variant_info ? JSON.stringify(item.variant_info) : null,
                    item.variant_color || item.colorName || null,
                    item.variant_size || item.size || null,
                    item.price,
                    item.quantity,
                    item.total || (parseFloat(item.price) * item.quantity)
                ];

                if (orderItemColsSet.has('image')) {
                    cols.push('image');
                    vals.push(item.image || null);
                }

                const placeholders = cols.map(() => '?').join(', ');
                const colList = cols.join(', ');
                await connection.query(`INSERT INTO order_items (${colList}) VALUES (${placeholders})`, vals);

                // Reduce stock in products table (including variants)
                const pId = item.product_id || item.id;
                if (pId) {
                    // Try to find by numeric `id` or by `product_id` (UUID) so API callers can send either
                    const [prodRows] = await connection.query(
                        "SELECT * FROM products WHERE id = ? OR product_id = ? LIMIT 1",
                        [pId, pId]
                    );
                    if (prodRows.length > 0) {
                        const prod = prodRows[0];
                        // Use the actual numeric id from DB for subsequent updates
                        const dbNumericId = prod.id;
                        let updatedPricingOptions = prod.pricing_options;

                        // Determine consumption based on variant_info if present, otherwise fallback to quantity
                        const consumedStock = calculateStockConsumptionInBaseUnits(
                            item.variant_info?.weight || item.variant_info?.quantity || item.variant_size || item.size || null,
                            item.variant_info?.unit || item.variant_info?.measurementUnit || item.variant_unit || null,
                            item.quantity
                        );

                        // When no variant information exists, consume by quantity directly
                        const finalConsumedStock = consumedStock > 0 ? consumedStock : (parseFloat(item.quantity) || 0);

                        // Detect combo products by type or product_code prefix 'SPMC'
                        const productCode = String(prod.product_code || '').trim().toUpperCase();
                        const isComboProduct = productCode.startsWith('SPMC') || String(prod.type || '').trim() === '1';

                        // If product is a combo, deduct from total_stock and keep stock_quantity in sync if present
                        if (isComboProduct) {
                            await connection.query(
                                `UPDATE products 
                                 SET total_stock = GREATEST(0, IFNULL(total_stock, 0) - ?),
                                     stock_quantity = GREATEST(0, IFNULL(stock_quantity, 0) - ?)
                                 WHERE id = ?`,
                                [finalConsumedStock, finalConsumedStock, dbNumericId]
                            );
                        } else {
                            // Parse and update variant stock if needed
                            if (item.variant_info && prod.pricing_options) {
                                try {
                                    const options = typeof prod.pricing_options === 'string' ? JSON.parse(prod.pricing_options) : prod.pricing_options;
                                    if (Array.isArray(options)) {
                                        for (let opt of options) {
                                            const optWeight = String(opt.weight_volume || opt.quantity || "").trim().toLowerCase();
                                            const optUnit = String(opt.unit || "").trim().toLowerCase();
                                            const itemWeight = String(item.variant_info?.weight || item.variant_info?.quantity || "").trim().toLowerCase();
                                            const itemUnit = String(item.variant_info?.unit || item.variant_info?.measurementUnit || "").trim().toLowerCase();

                                            if (optWeight === itemWeight && optUnit === itemUnit) {
                                                opt.stock_quantity = Math.max(0, (parseFloat(opt.stock_quantity) || 0) - consumedStock);
                                                break;
                                            }
                                        }
                                        updatedPricingOptions = JSON.stringify(options);
                                    }
                                } catch (e) {
                                    console.error("Error parsing pricing_options for stock update:", e);
                                }
                            }

                            const optionsString = typeof updatedPricingOptions === 'object' ? JSON.stringify(updatedPricingOptions) : updatedPricingOptions;

                            await connection.query(
                                `UPDATE products 
                                 SET total_stock = GREATEST(0, IFNULL(total_stock, 0) - ?),
                                     stock_quantity = GREATEST(0, IFNULL(stock_quantity, 0) - ?),
                                     pricing_options = ?
                                 WHERE id = ?`,
                                [consumedStock, consumedStock, optionsString, dbNumericId]
                            );
                        }
                    }
                }
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: "Order created successfully", order_id });
    } catch (error) {
        await connection.rollback();
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message, stack: error.stack, sqlMessage: error.sqlMessage });
    } finally {
        connection.release();
    }
};

const getAllOrders = async (req, res) => {
    try {
        await initOrdersTable();
        const pool = getPool();
        const { status } = req.query;
        let query = "SELECT * FROM orders";
        let params = [];
        
        if (status && status !== "All") {
            query += " WHERE status = ?";
            params.push(status);
        }
        query += " ORDER BY created_at DESC";
        
        const [orders] = await pool.query(query, params);
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get orders for a specific user
const getUserOrders = async (req, res) => {
    try {
        await initOrdersTable();
        const pool = getPool();
        const { user_id } = req.params;
        const [orders] = await pool.query(
            "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
            [user_id]
        );
        // Fetch items for each order
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await pool.query(
                "SELECT * FROM order_items WHERE order_id = ?",
                [order.order_id]
            );
            return { ...order, items };
        }));
        res.status(200).json(ordersWithItems);
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getOrderById = async (req, res) => {
    try {
        await initOrdersTable();
        const pool = getPool();
        const { id } = req.params;
        const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        const order = orders[0];
        const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [order.order_id]);
        res.status(200).json({ ...order, items });
    } catch (error) {
        console.error("Error fetching order by id:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        await initOrdersTable();
        const pool = getPool();
        const { id } = req.params;
        const body = req.body || {};

        // Build dynamic update
        const allowed = ["status", "tracking_number", "courier_name", "shipped_at", "cancellation_reason", "cancelled_at"];
        const sets = [];
        const vals = [];
        for (const key of allowed) {
            if (body[key] !== undefined) {
                sets.push(`${key} = ?`);
                vals.push(body[key]);
            }
        }
        if (sets.length === 0) return res.status(400).json({ message: "No valid fields to update" });
        
        const updated_by = req.headers['x-user-id'] || null;
        sets.push("updated_by = ?");
        vals.push(updated_by);
        
        vals.push(id);
        const sql = `UPDATE orders SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const [result] = await pool.query(sql, vals);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });

        // Return updated order
        const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
        const order = orders[0];
        const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [order.order_id]);
        res.status(200).json({ ...order, items });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getAllOrders, createOrder, getUserOrders, getOrderById, updateOrderStatus, initOrdersTable };
