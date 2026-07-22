const { getPool, getLargePacketConnection } = require("../config/db");

/* ── Auto-create banners table ── */
const createBannersTable = async () => {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS banners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) DEFAULT '',
                subtitle VARCHAR(255) DEFAULT '',
                description TEXT DEFAULT '',
                image LONGTEXT DEFAULT '',
                mobile_image LONGTEXT DEFAULT '',
                link VARCHAR(500) DEFAULT '',
                type VARCHAR(50) NOT NULL DEFAULT 'hero',
                active TINYINT(1) NOT NULL DEFAULT 1,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    } finally {
        connection.release();
    }
};

/* ── GET all banners ── */
const getAllBanners = async (req, res) => {
    try {
        await createBannersTable();
        const pool = getPool();
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                "SELECT id, title, subtitle, description, link, type, active, sort_order, created_at, updated_at, LEFT(image, 200) as image_preview, LEFT(mobile_image, 200) as mobile_image_preview FROM banners ORDER BY sort_order ASC, created_at DESC"
            );
            // Fetch full data separately so we don't kill the list query
            const [fullRows] = await connection.execute(
                "SELECT id, image, mobile_image FROM banners ORDER BY sort_order ASC, created_at DESC"
            );
            const imageMap = {};
            fullRows.forEach(r => { imageMap[r.id] = { image: r.image, mobile_image: r.mobile_image }; });

            const banners = rows.map(row => ({
                ...row,
                image: imageMap[row.id]?.image || "",
                mobile_image: imageMap[row.id]?.mobile_image || "",
                active: !!row.active
            }));
            return res.status(200).json(banners);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Fetch banners failed:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch banners." });
    }
};

/* ── POST create banner ── */
const createBanner = async (req, res) => {
    try {
        await createBannersTable();
        const data = req.body || {};

        // Use large packet connection for base64 image storage
        const connection = await getLargePacketConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO banners (title, subtitle, description, image, mobile_image, link, type, active, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.title || "",
                    data.subtitle || "",
                    data.description || "",
                    data.image || "",
                    data.mobile_image || "",
                    data.link || "",
                    data.type || "hero",
                    data.active !== undefined ? (data.active ? 1 : 0) : 1,
                    data.sort_order || 0
                ]
            );
            return res.status(201).json({
                success: true,
                message: "Banner created successfully.",
                id: result.insertId
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create banner failed:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to create banner." });
    }
};

/* ── PUT update banner ── */
const updateBanner = async (req, res) => {
    try {
        await createBannersTable();
        const { id } = req.params;
        const data = req.body || {};

        const pool = getPool();
        const existConn = await pool.getConnection();
        let existing;
        try {
            [existing] = await existConn.execute("SELECT * FROM banners WHERE id = ?", [id]);
        } finally {
            existConn.release();
        }

        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: "Banner not found." });
        }

        const row = existing[0];
        // Use large packet connection for update with images
        const connection = await getLargePacketConnection();
        try {
            await connection.execute(
                `UPDATE banners SET
                    title = ?, subtitle = ?, description = ?, image = ?, mobile_image = ?,
                    link = ?, type = ?, active = ?, sort_order = ?, updated_at = NOW()
                 WHERE id = ?`,
                [
                    data.title !== undefined ? data.title : row.title,
                    data.subtitle !== undefined ? data.subtitle : row.subtitle,
                    data.description !== undefined ? data.description : row.description,
                    data.image !== undefined ? data.image : row.image,
                    data.mobile_image !== undefined ? data.mobile_image : row.mobile_image,
                    data.link !== undefined ? data.link : row.link,
                    data.type !== undefined ? data.type : row.type,
                    data.active !== undefined ? (data.active ? 1 : 0) : row.active,
                    data.sort_order !== undefined ? data.sort_order : row.sort_order,
                    id
                ]
            );
            return res.status(200).json({ success: true, message: "Banner updated successfully." });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update banner failed:", error);
        return res.status(500).json({ success: false, message: "Failed to update banner." });
    }
};

/* ── DELETE banner ── */
const deleteBanner = async (req, res) => {
    try {
        await createBannersTable();
        const { id } = req.params;
        const pool = getPool();
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute("DELETE FROM banners WHERE id = ?", [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Banner not found." });
            }
            return res.status(200).json({ success: true, message: "Banner deleted successfully." });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Delete banner failed:", error);
        return res.status(500).json({ success: false, message: "Failed to delete banner." });
    }
};

module.exports = { getAllBanners, createBanner, updateBanner, deleteBanner };
