const { getPool } = require("../config/db");

const parseJsonField = (value) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const enrichWishlistItem = async (item, pool) => {
    const productId = item.product_id;
    let product = null;

    if (productId) {
        const [rows] = await pool.query(
            "SELECT id, name, thumbnail_image, product_images, mrp, offer_price, selling_price FROM products WHERE id = ?",
            [productId]
        );
        product = rows?.[0] || null;
    }

    const productImages = parseJsonField(product?.product_images);
    const fallbackImage = product?.thumbnail_image || productImages?.[0] || item.image || null;

    return {
        ...item,
        name: item.name || item.product_name || product?.name || "Product",
        product_name: item.product_name || product?.name || item.name || "Product",
        image: item.image || fallbackImage,
        product_image: item.product_image || fallbackImage,
        mrp: item.mrp ?? product?.mrp ?? null,
        price: item.price ?? product?.offer_price ?? product?.selling_price ?? null,
    };
};

const initWishlistTable = async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                product_id INT NOT NULL,
                variant_color VARCHAR(100) DEFAULT NULL,
                variant_size VARCHAR(100) DEFAULT NULL,
                image TEXT DEFAULT NULL,
                email VARCHAR(255) DEFAULT NULL,
                price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY user_product_unique (user_id, product_id)
            )
        `);
    } catch (e) {
        console.error("Error creating wishlist table:", e);
    } finally {
        connection.release();
    }
};

const getWishlist = async (req, res) => {
    try {
        await initWishlistTable();
        const pool = getPool();
        const { userId } = req.params;
        const [items] = await pool.query(
            "SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        const enrichedItems = await Promise.all(items.map((item) => enrichWishlistItem(item, pool)));
        res.status(200).json(enrichedItems);
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const addToWishlist = async (req, res) => {
    try {
        await initWishlistTable();
        const pool = getPool();
        const { user_id, product_id, variant_color, variant_size, image, email, price, total_price } = req.body;
        
        // Use REPLACE INTO or ON DUPLICATE KEY UPDATE to handle existing items
        await pool.query(`
            INSERT INTO wishlist (user_id, product_id, variant_color, variant_size, image, email, price, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            variant_color = VALUES(variant_color),
            variant_size = VALUES(variant_size),
            image = VALUES(image),
            price = VALUES(price),
            total_price = VALUES(total_price)
        `, [
            user_id, product_id, variant_color || null, variant_size || null, image || null, email || null, price, total_price || price
        ]);
        
        const [items] = await pool.query("SELECT * FROM wishlist WHERE user_id = ?", [user_id]);
        res.status(201).json({ success: true, message: "Added to wishlist", items });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        await initWishlistTable();
        const pool = getPool();
        const { userId, productId } = req.params;
        
        await pool.query(
            "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
            [userId, productId]
        );
        
        res.status(200).json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
