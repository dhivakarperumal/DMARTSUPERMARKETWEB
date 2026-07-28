const { getPool } = require("../config/db");
const crypto = require("crypto");

/**
 * Safely parse a JSON field from the database.
 * - Handles NULL, undefined, empty string → returns []
 * - Handles Buffer objects (returned by some MySQL driver configurations)
 * - Handles double-encoded JSON (string-inside-JSON → parses twice)
 * - Logs a warning if parsing fails so errors are never silently swallowed
 */
const parseJsonField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (typeof parsed === "string") return [parsed];
    } catch (error) {
      // ignore invalid JSON and fall back to string handling
    }

    if (trimmed.includes(",")) {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }

    return [trimmed];
  }

  return [value];
};

const normalizeProductImages = (value) => {
  const images = parseJsonField(value);
  return images
    .filter(Boolean)
    .map(normalizeProductImagePath)
    .filter(Boolean);
};

const normalizeProductImagePath = (img) => {
  if (!img) return null;
  let text = String(img).trim();
  if (!text) return null;

  try {
    const parsedUrl = new URL(text);
    let normalizedPath = parsedUrl.pathname
      .replace(/\/+/g, "/")
      .replace(/(^|\/)api\/uploads\/uploads\//gi, "$1api/uploads/")
      .replace(/(^|\/)uploads\/uploads\//gi, "$1uploads/")
      .replace(/^\/+/, "");

    if (/^(?:api\/uploads\/|uploads\/)/i.test(normalizedPath)) {
      return `${parsedUrl.origin}/${normalizedPath}`.replace(/\/+/g, "/");
    }

    return text;
  } catch {
    // Not an absolute URL, continue normalizing relative paths
  }

  // Normalize duplicate segments
  text = text.replace(/(^|\/)api\/uploads\/+/gi, "$1api/uploads/");
  text = text.replace(/(^|\/)uploads\/+/gi, "$1uploads/");
  text = text.replace(/api\/uploads\/uploads\//gi, "api/uploads/");
  text = text.replace(/uploads\/uploads\//gi, "uploads/");
  text = text.replace(/^\/+/, "");

  if (/^api\/uploads\//i.test(text)) {
    return text;
  }

  if (/^uploads\//i.test(text)) {
    return text.replace(/^uploads\//i, "api/uploads/");
  }

  if (/^[^\/]+\.(jpe?g|png|webp|gif|svg)$/i.test(text)) {
    return `api/uploads/products/${text}`;
  }

  return text;
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

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
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
          expiry_date, manufacturing_date, country_of_origin, supplier, product_images,
          status, featured_product, best_seller, todays_deal, delivery_time, return_available, rating, review_count, combo_items, type,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          JSON.stringify(normalizeProductImages(data.product_images)),
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
      const [rows] = await connection.execute(
        "SELECT * FROM products ORDER BY created_at DESC"
      );

      const products = rows.map((row) => {
        const pricingOptions = parseJsonField(row.pricing_options);
        const parsedProductImages = parseJsonField(row.product_images);
        const resolvedProductImages = parsedProductImages.length > 0
          ? parsedProductImages
          : parseJsonField(row.thumbnail_image);

        const normalizedProductImages = resolvedProductImages
          .map(normalizeProductImagePath)
          .filter(Boolean);

        return {
          ...row,
          pricing_options: pricingOptions,
          variants: transformPricingOptionsToVariants(pricingOptions),
          product_images: normalizedProductImages,
          thumbnail_image: normalizeProductImagePath(row.thumbnail_image),
          featured_product: !!row.featured_product,
          best_seller: !!row.best_seller,
          todays_deal: !!row.todays_deal,
          return_available: !!row.return_available,
          combo_items: parseJsonField(row.combo_items),
          customer_review: parseJsonField(row.customer_review)
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
      const [rows] = await connection.execute(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const product = rows[0];
      const pricingOptions = parseJsonField(product.pricing_options);
      const parsedProductImages = parseJsonField(product.product_images);
      const resolvedProductImages = parsedProductImages.length > 0
        ? parsedProductImages
        : parseJsonField(product.thumbnail_image);

      product.pricing_options = pricingOptions;
      product.variants = transformPricingOptionsToVariants(pricingOptions);
      product.product_images = resolvedProductImages
        .map(normalizeProductImagePath)
        .filter(Boolean);
      product.thumbnail_image = normalizeProductImagePath(product.thumbnail_image);
      product.featured_product = !!product.featured_product;
      product.best_seller = !!product.best_seller;
      product.todays_deal = !!product.todays_deal;
      product.return_available = !!product.return_available;
      product.combo_items = parseJsonField(product.combo_items);
      product.customer_review = parseJsonField(product.customer_review);

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

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
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
      const incomingImages = data.product_images !== undefined ? data.product_images : existingRows[0].product_images;
      const normalizedIncomingImages = normalizeProductImages(incomingImages);
      const fallbackImages = normalizedIncomingImages.length > 0
        ? normalizedIncomingImages
        : normalizeProductImages(existingRows[0].thumbnail_image || existingRows[0].product_images);

      await connection.execute(
        `UPDATE products SET 
          name = ?, product_code = ?, barcode = ?, barcode_image = ?, category = ?, category_id = ?, subcategory = ?, brand = ?, description = ?,
          mrp = ?, selling_price = ?, offer = ?, offer_price = ?, stock_quantity = ?, pricing_options = ?, total_stock = ?,
          expiry_date = ?, manufacturing_date = ?, country_of_origin = ?, supplier = ?, product_images = ?,
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
          JSON.stringify(fallbackImages),
          data.thumbnail_image !== undefined ? data.thumbnail_image : "",
          data.status || 'Active',
          data.featured_product || false,
          data.best_seller || false,
          data.todays_deal || false,
          data.delivery_time || "",
          data.return_available || false,
          data.rating !== undefined ? data.rating : existingRows[0].rating,
          data.review_count !== undefined ? data.review_count : existingRows[0].review_count,
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

const addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, user_name, user_email, rating, comment, review_image } = req.body;

    if (!user_id || !rating) {
      return res.status(400).json({ success: false, message: "user_id and rating are required." });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute("SELECT customer_review, rating, review_count FROM products WHERE id = ?", [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      const product = rows[0];
      const reviews = parseJsonField(product.customer_review);

      // Check if user already reviewed
      if (reviews.some(r => String(r.user_id) === String(user_id))) {
        return res.status(400).json({ success: false, message: "You have already submitted a review for this product." });
      }

      const newReview = {
        user_id,
        user_name,
        user_email,
        rating: Number(rating),
        review: comment || "",
        image: review_image || "",
        created_at: new Date().toISOString()
      };

      reviews.push(newReview);

      const newReviewCount = (product.review_count || 0) + 1;
      const currentTotalRating = (product.rating || 5) * (product.review_count || 0);
      let newAverageRating = (currentTotalRating + Number(rating)) / newReviewCount;
      if (newAverageRating > 5) newAverageRating = 5;

      await connection.execute(
        "UPDATE products SET customer_review = ?, rating = ?, review_count = ? WHERE id = ?",
        [JSON.stringify(reviews), newAverageRating, newReviewCount, id]
      );

      return res.status(200).json({
        success: true,
        message: "Review added successfully.",
        review: newReview
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Add product review failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add product review.",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLatestCode,
  addProductReview
};
