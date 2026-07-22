const { getPool, getLargePacketConnection } = require("../config/db");
const { createProductTable } = require("../config/initDatabase");
const crypto = require("crypto");

const parseJsonField = (value) => {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch (error) {
    return [];
  }
};

const transformPricingOptionsToVariants = (pricingOptions) => {
  if (!Array.isArray(pricingOptions)) return [];
  return pricingOptions.map((option) => ({
    quantity: option.weight_volume || option.quantity || 1,
    unit: option.unit || "kg",
    mrp: option.mrp || 0,
    sellingPrice: option.selling_price || 0,
    offer: option.offer || 0,
    stock: option.stock_quantity || 0
  }));
};

const createProduct = async (req, res) => {
  try {
    const data = req.body || {};

    if (!data.name || !data.category) {
      return res.status(400).json({
        success: false,
        message: "Name and Category are required.",
      });
    }

    const connection = await getLargePacketConnection();

    try {
      await createProductTable();

      let finalCategoryId = data.category_id || null;
      if (!finalCategoryId && data.category) {
        try {
          const [catRows] = await connection.execute("SELECT id FROM categories WHERE name = ? LIMIT 1", [data.category]);
          if (catRows.length > 0) {
            finalCategoryId = catRows[0].id;
          }
        } catch (err) {
          console.warn("Failed to lookup category_id:", err.message);
        }
      }

      const product_id = crypto.randomUUID();
      const created_by = req.headers['x-user-id'] || null;
      const updated_by = req.headers['x-user-id'] || null;

      const [result] = await connection.execute(
        `INSERT INTO products (
          product_id, name, product_code, barcode, barcode_image, category, category_id, subcategory, brand, description,
          mrp, selling_price, offer, offer_price, stock_quantity, pricing_options, total_stock,
          expiry_date, manufacturing_date, country_of_origin, supplier, product_images, thumbnail_image,
          status, featured_product, best_seller, todays_deal, delivery_time, return_available, rating, review_count, combo_items, type,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product_id,
          data.name,
          data.product_code || "",
          data.barcode || "",
          data.barcode_image || "",
          data.category || "",
          finalCategoryId,
          data.subcategory || "",
          data.brand || "",
          data.description || "",
          data.mrp || 0,
          data.selling_price || 0,
          data.offer || 0,
          data.offer_price || 0,
          data.stock_quantity || 0,
          JSON.stringify(Array.isArray(data.pricing_options) ? data.pricing_options : []),
          data.total_stock || 0,
          data.expiry_date || "",
          data.manufacturing_date || "",
          data.country_of_origin || "",
          data.supplier || "",
          JSON.stringify(Array.isArray(data.product_images) ? data.product_images : []),
          data.thumbnail_image || "",
          data.status || 'Active',
          data.featured_product || false,
          data.best_seller || false,
          data.todays_deal || false,
          data.delivery_time || "",
          data.return_available || false,
          data.rating || 5,
          data.review_count || 0,
          JSON.stringify(Array.isArray(data.combo_items) ? data.combo_items : []),
          data.type || 0,
          created_by,
          updated_by
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Product created successfully.",
        id: result.insertId,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Create product failed:", error);
    if (error.code === 'ER_NET_PACKET_TOO_LARGE' || error.sqlMessage?.includes('max_allowed_packet')) {
      return res.status(413).json({
        success: false,
        message: "Images are too large. Please use smaller images.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product.",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createProductTable();
      const [rows] = await connection.execute(
        "SELECT * FROM products ORDER BY created_at DESC"
      );

      const products = rows.map((row) => {
        const pricingOptions = parseJsonField(row.pricing_options);
        return {
          ...row,
          pricing_options: pricingOptions,
          variants: transformPricingOptionsToVariants(pricingOptions),
          product_images: parseJsonField(row.product_images),
          featured_product: !!row.featured_product,
          best_seller: !!row.best_seller,
          todays_deal: !!row.todays_deal,
          return_available: !!row.return_available,
          combo_items: parseJsonField(row.combo_items)
        };
      });

      return res.status(200).json(products);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Fetch products failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
};

const getLatestCode = async (req, res) => {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createProductTable();
      const [rows] = await connection.execute(
        "SELECT product_code FROM products WHERE product_code IS NOT NULL AND product_code != ''"
      );

      let maxCodeNumber = 0;
      for (const row of rows) {
        const code = String(row.product_code || "").trim().toUpperCase();
        let match = code.match(/^SPM(\d+)$/);
        if (match) {
          maxCodeNumber = Math.max(maxCodeNumber, parseInt(match[1], 10));
          continue;
        }

        match = code.match(/^(\d+)$/);
        if (match) {
          maxCodeNumber = Math.max(maxCodeNumber, parseInt(match[1], 10));
        }
      }

      const nextCode = `SPM${String(maxCodeNumber + 1).padStart(3, '0')}`;

      console.log(`Generated next SKU: ${nextCode}`);
      return res.status(200).json({ latestCode: nextCode });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Fetch latest code failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest code.",
    });
  }
};

const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createProductTable();
      const [rows] = await connection.execute(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const product = rows[0];
      const pricingOptions = parseJsonField(product.pricing_options);
      product.pricing_options = pricingOptions;
      product.variants = transformPricingOptionsToVariants(pricingOptions);
      product.product_images = parseJsonField(product.product_images);
      product.featured_product = !!product.featured_product;
      product.best_seller = !!product.best_seller;
      product.todays_deal = !!product.todays_deal;
      product.return_available = !!product.return_available;
      product.combo_items = parseJsonField(product.combo_items);

      return res.status(200).json(product);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Fetch product failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product.",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};

    if (!data.name || !data.category) {
      return res.status(400).json({
        success: false,
        message: "Name and Category are required.",
      });
    }

    const connection = await getLargePacketConnection();

    try {
      await createProductTable();
      const [existingRows] = await connection.execute(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      let finalCategoryId = data.category_id || null;
      if (!finalCategoryId && data.category) {
        try {
          const [catRows] = await connection.execute("SELECT id FROM categories WHERE name = ? LIMIT 1", [data.category]);
          if (catRows.length > 0) {
            finalCategoryId = catRows[0].id;
          }
        } catch (err) {
          console.warn("Failed to lookup category_id:", err.message);
        }
      }
      if (!finalCategoryId) {
        finalCategoryId = existingRows[0].category_id || null;
      }

      const updated_by = req.headers['x-user-id'] || null;

      await connection.execute(
        `UPDATE products SET 
          name = ?, product_code = ?, barcode = ?, barcode_image = ?, category = ?, category_id = ?, subcategory = ?, brand = ?, description = ?,
          mrp = ?, selling_price = ?, offer = ?, offer_price = ?, stock_quantity = ?, pricing_options = ?, total_stock = ?,
          expiry_date = ?, manufacturing_date = ?, country_of_origin = ?, supplier = ?, product_images = ?, thumbnail_image = ?,
          status = ?, featured_product = ?, best_seller = ?, todays_deal = ?, delivery_time = ?, return_available = ?, rating = ?, review_count = ?, combo_items = ?, type = ?,
          updated_by = ?, updated_at = NOW() 
        WHERE id = ?`,
        [
          data.name,
          data.product_code || "",
          data.barcode || "",
          data.barcode_image || existingRows[0].barcode_image,
          data.category || "",
          finalCategoryId,
          data.subcategory || "",
          data.brand || "",
          data.description || "",
          data.mrp || 0,
          data.selling_price || 0,
          data.offer || 0,
          data.offer_price || 0,
          data.stock_quantity || 0,
          JSON.stringify(Array.isArray(data.pricing_options) ? data.pricing_options : parseJsonField(existingRows[0].pricing_options)),
          data.total_stock || 0,
          data.expiry_date || "",
          data.manufacturing_date || "",
          data.country_of_origin || "",
          data.supplier || "",
          JSON.stringify(Array.isArray(data.product_images) ? data.product_images : parseJsonField(existingRows[0].product_images)),
          data.thumbnail_image || existingRows[0].thumbnail_image,
          data.status || 'Active',
          data.featured_product || false,
          data.best_seller || false,
          data.todays_deal || false,
          data.delivery_time || "",
          data.return_available || false,
          data.rating || 5,
          data.review_count || 0,
          JSON.stringify(Array.isArray(data.combo_items) ? data.combo_items : parseJsonField(existingRows[0].combo_items)),
          data.type !== undefined ? data.type : existingRows[0].type,
          updated_by,
          id
        ]
      );

      return res.status(200).json({
        success: true,
        message: "Product updated successfully.",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Update product failed:", error);
    if (error.code === 'ER_NET_PACKET_TOO_LARGE' || error.sqlMessage?.includes('max_allowed_packet')) {
      return res.status(413).json({
        success: false,
        message: "Images are too large. Please use smaller images.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update product.",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await createProductTable();
      const [result] = await connection.execute(
        "DELETE FROM products WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully.",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete product failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product.",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLatestCode
};
