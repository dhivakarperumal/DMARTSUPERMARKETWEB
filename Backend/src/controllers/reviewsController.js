const { getPool, getLargePacketConnection } = require("../config/db");

/* ── Auto-create reviews table ── */
const createReviewsTable = async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                product_name VARCHAR(255) DEFAULT '',
                user_name VARCHAR(150) NOT NULL DEFAULT 'Anonymous',
                user_email VARCHAR(255) DEFAULT '',
                rating TINYINT NOT NULL DEFAULT 5,
                comment TEXT DEFAULT '',
                review_image LONGTEXT DEFAULT '',
                admin_reply TEXT DEFAULT '',
                status ENUM('Pending', 'Published', 'Flagged') NOT NULL DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    } finally {
        connection.release();
    }
};

/* ── GET all reviews (admin) with filters ── */
const getAllReviews = async (req, res) => {
    try {
        await createReviewsTable();
        const { status, rating, search } = req.query;

        const pool = getPool();
        const connection = await pool.getConnection();
        try {
            let where = [];
            let params = [];

            if (status && status !== "All") {
                where.push("r.status = ?");
                params.push(status);
            }
            if (rating) {
                where.push("r.rating = ?");
                params.push(Number(rating));
            }
            if (search) {
                where.push("(r.user_name LIKE ? OR r.comment LIKE ? OR r.product_name LIKE ?)");
                const q = `%${search}%`;
                params.push(q, q, q);
            }

            const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

            const [rows] = await connection.execute(
                `SELECT r.*, p.name as product_name_from_db
                 FROM reviews r
                 LEFT JOIN products p ON r.product_id = p.id
                 ${whereClause}
                 ORDER BY r.created_at DESC`,
                params
            );

            // Stats
            const [statsRows] = await connection.execute(
                `SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Published' THEN 1 ELSE 0 END) as published,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'Flagged' THEN 1 ELSE 0 END) as flagged,
                    ROUND(AVG(rating), 1) as avg_rating
                 FROM reviews`
            );

            const reviews = rows.map(r => ({
                ...r,
                product_name: r.product_name_from_db || r.product_name || "Unknown Product"
            }));

            return res.status(200).json({
                reviews,
                stats: statsRows[0] || {}
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Fetch reviews failed:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch reviews." });
    }
};

/* ── POST create review ── */
const createReview = async (req, res) => {
    try {
        await createReviewsTable();
        const data = req.body || {};

        if (!data.product_id || !data.user_name || !data.comment) {
            return res.status(400).json({
                success: false,
                message: "product_id, user_name, and comment are required."
            });
        }

        // Get product name
        const pool = getPool();
        let productName = "";
        try {
            const pc = await pool.getConnection();
            const [pRows] = await pc.execute("SELECT name FROM products WHERE id = ?", [data.product_id]);
            if (pRows.length > 0) productName = pRows[0].name;
            pc.release();
        } catch (_) {}

        const connection = await getLargePacketConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO reviews (product_id, product_name, user_name, user_email, rating, comment, review_image, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.product_id,
                    productName,
                    data.user_name || "Anonymous",
                    data.user_email || "",
                    data.rating || 5,
                    data.comment || "",
                    data.review_image || "",
                    "Published"   // admin-added reviews go live immediately
                ]
            );
            return res.status(201).json({
                success: true,
                message: "Review created successfully.",
                id: result.insertId
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create review failed:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to create review." });
    }
};

/* ── PUT update review status ── */
const updateReviewStatus = async (req, res) => {
    try {
        await createReviewsTable();
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["Pending", "Published", "Flagged"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value." });
        }

        const pool = getPool();
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                "UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ?",
                [status, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Review not found." });
            }
            return res.status(200).json({ success: true, message: "Status updated successfully." });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update review status failed:", error);
        return res.status(500).json({ success: false, message: "Failed to update status." });
    }
};

/* ── PUT add admin reply ── */
const addReply = async (req, res) => {
    try {
        await createReviewsTable();
        const { id } = req.params;
        const { admin_reply } = req.body;

        if (!admin_reply || !admin_reply.trim()) {
            return res.status(400).json({ success: false, message: "Reply cannot be empty." });
        }

        const pool = getPool();
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                "UPDATE reviews SET admin_reply = ?, updated_at = NOW() WHERE id = ?",
                [admin_reply.trim(), id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Review not found." });
            }
            return res.status(200).json({ success: true, message: "Reply added successfully." });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Add reply failed:", error);
        return res.status(500).json({ success: false, message: "Failed to add reply." });
    }
};

/* ── DELETE review ── */
const deleteReview = async (req, res) => {
    try {
        await createReviewsTable();
        const { id } = req.params;
        const pool = getPool();
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute("DELETE FROM reviews WHERE id = ?", [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Review not found." });
            }
            return res.status(200).json({ success: true, message: "Review deleted successfully." });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Delete review failed:", error);
        return res.status(500).json({ success: false, message: "Failed to delete review." });
    }
};

module.exports = {
    getAllReviews,
    createReview,
    updateReviewStatus,
    addReply,
    deleteReview
};
