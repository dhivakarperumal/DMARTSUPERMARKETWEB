const { getPool, getLargePacketConnection } = require("../config/db");
const { createCategoryTable } = require("../config/initDatabase");
const crypto = require("crypto");

const parseJsonField = (value) => {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch (error) {
    return [];
  }
};

const createCategory = async (req, res) => {
  try {
    const { catId, name, description, subcategory, images } = req.body || {};

    if (!catId || !name || !images || !images.length) {
      return res.status(400).json({
        success: false,
        message: "catId, name, and category image are required.",
      });
    }

    const connection = await getLargePacketConnection();

    try {
      await createCategoryTable();

      const [existing] = await connection.execute(
        "SELECT id FROM categories WHERE catId = ?",
        [catId],
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Category with this ID already exists.",
        });
      }

      const categoryPayload = {
        category_id: crypto.randomUUID(),
        catId,
        name,
        description: description || "",
        subcategory: JSON.stringify(
          Array.isArray(subcategory) ? subcategory : [],
        ),
        images: JSON.stringify(
          Array.isArray(images) ? images : [images],
        ),
        show_in_navbar: req.body.show_in_navbar === undefined ? 1 : (req.body.show_in_navbar ? 1 : 0),
        created_by: req.headers['x-user-id'] || null,
        updated_by: req.headers['x-user-id'] || null,
      };

      const [result] = await connection.execute(
        `INSERT INTO categories (category_id, catId, name, description, subcategory, images, show_in_navbar, created_by, updated_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          categoryPayload.category_id,
          categoryPayload.catId,
          categoryPayload.name,
          categoryPayload.description,
          categoryPayload.subcategory,
          categoryPayload.images,
          categoryPayload.show_in_navbar,
          categoryPayload.created_by,
          categoryPayload.updated_by,
        ],
      );

      return res.status(201).json({
        success: true,
        message: "Category created successfully.",
        id: result.insertId,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Create category failed:", error);
    
    // Handle specific MySQL errors
    if (error.code === 'ER_NET_PACKET_TOO_LARGE' || error.sqlMessage?.includes('max_allowed_packet')) {
      return res.status(413).json({
        success: false,
        message: "Image is too large. Please use smaller images (max 500KB recommended).",
        error: "Packet too large - increase MySQL max_allowed_packet setting",
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create category.",
      error: process.env.NODE_ENV === "development" ? error.sqlMessage : undefined,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createCategoryTable();
      const [rows] = await connection.execute(
        "SELECT * FROM categories ORDER BY created_at DESC",
      );

      const categories = rows.map((row) => ({
        ...row,
        subcategory: parseJsonField(row.subcategory),
        images: parseJsonField(row.images),
        show_in_navbar: row.show_in_navbar === 1 || row.show_in_navbar === true,
      }));

      return res.status(200).json(categories);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Fetch categories failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
    });
  }
};

const getCategory = async (req, res) => {
  try {
    const { catId } = req.params;
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createCategoryTable();
      const [rows] = await connection.execute(
        "SELECT * FROM categories WHERE catId = ?",
        [catId],
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Category not found." });
      }

      const category = rows[0];
      category.subcategory = parseJsonField(category.subcategory);
      category.images = parseJsonField(category.images);

      return res.status(200).json(category);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Fetch category failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category.",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { catId } = req.params;
    const { name, description, subcategory, images } = req.body || {};

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const connection = await getLargePacketConnection();

    try {
      await createCategoryTable();
      const [existingRows] = await connection.execute(
        "SELECT * FROM categories WHERE catId = ?",
        [catId],
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ success: false, message: "Category not found." });
      }

      const existing = existingRows[0];
      const updatedSubcategory = JSON.stringify(
        Array.isArray(subcategory) ? subcategory : parseJsonField(existing.subcategory),
      );
      const updatedImages = JSON.stringify(
        Array.isArray(images) ? images : parseJsonField(existing.images),
      );
      const showInNavbarVal = req.body.show_in_navbar === undefined ? existing.show_in_navbar : (req.body.show_in_navbar ? 1 : 0);
      const updatedBy = req.headers['x-user-id'] || null;

      await connection.execute(
        `UPDATE categories SET name = ?, description = ?, subcategory = ?, images = ?, show_in_navbar = ?, updated_by = ?, updated_at = NOW() WHERE catId = ?`,
        [
          name,
          description || existing.description,
          updatedSubcategory,
          updatedImages,
          showInNavbarVal,
          updatedBy,
          catId,
        ],
      );

      return res.status(200).json({
        success: true,
        message: "Category updated successfully.",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Update category failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category.",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { catId } = req.params;
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createCategoryTable();
      const [result] = await connection.execute(
        "DELETE FROM categories WHERE catId = ?",
        [catId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Category not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Category deleted successfully.",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete category failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category.",
    });
  }
};

// PATCH /categories/navbar
// Body: { catIds: ["CAT001", "CAT002"] }  — the list of catIds that SHOULD appear in navbar
// All others are hidden.
const updateNavbarVisibility = async (req, res) => {
  try {
    const { catIds } = req.body || {};
    if (!Array.isArray(catIds)) {
      return res.status(400).json({ success: false, message: "catIds must be an array." });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createCategoryTable();

      // Set all to hidden first
      await connection.execute("UPDATE categories SET show_in_navbar = 0");

      // Then enable only the selected ones
      if (catIds.length > 0) {
        const placeholders = catIds.map(() => "?").join(",");
        await connection.execute(
          `UPDATE categories SET show_in_navbar = 1 WHERE catId IN (${placeholders})`,
          catIds
        );
      }

      return res.status(200).json({ success: true, message: "Navbar visibility updated." });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Update navbar visibility failed:", error);
    return res.status(500).json({ success: false, message: "Failed to update navbar visibility." });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  updateNavbarVisibility,
};
