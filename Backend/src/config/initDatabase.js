const { pool } = require("./db");

/**
 * Auto-create the `categories` table if it doesn't already exist.
 */
const createCategoryTable = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        category_id   VARCHAR(36)   NOT NULL UNIQUE,
        catId         VARCHAR(100)  NOT NULL UNIQUE,
        name          VARCHAR(255)  NOT NULL,
        description   TEXT          DEFAULT '',
        subcategory   LONGTEXT      DEFAULT '[]',
        images        LONGTEXT      DEFAULT '[]',
        show_in_navbar TINYINT(1)   NOT NULL DEFAULT 1,
        created_by    VARCHAR(36)   DEFAULT NULL,
        updated_by    VARCHAR(36)   DEFAULT NULL,
        created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } finally {
    connection.release();
  }
};

/**
 * Auto-create the `products` table if it doesn't already exist.
 */
const createProductTable = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id                  INT AUTO_INCREMENT PRIMARY KEY,
        product_id          VARCHAR(36)   NOT NULL UNIQUE,
        name                VARCHAR(255)  NOT NULL,
        product_code        VARCHAR(100)  DEFAULT '',
        barcode             VARCHAR(100)  DEFAULT '',
        barcode_image       LONGTEXT      DEFAULT '',
        category            VARCHAR(255)  DEFAULT '',
        category_id         VARCHAR(36)   DEFAULT NULL,
        subcategory         VARCHAR(255)  DEFAULT '',
        brand               VARCHAR(255)  DEFAULT '',
        description         TEXT          DEFAULT '',
        mrp                 DECIMAL(10,2) DEFAULT 0,
        selling_price       DECIMAL(10,2) DEFAULT 0,
        offer               DECIMAL(10,2) DEFAULT 0,
        offer_price         DECIMAL(10,2) DEFAULT 0,
        stock_quantity      INT           DEFAULT 0,
        pricing_options     LONGTEXT      DEFAULT '[]',
        total_stock         INT           DEFAULT 0,
        expiry_date         VARCHAR(50)   DEFAULT '',
        manufacturing_date  VARCHAR(50)   DEFAULT '',
        country_of_origin   VARCHAR(100)  DEFAULT '',
        supplier            VARCHAR(255)  DEFAULT '',
        product_images      LONGTEXT      DEFAULT '[]',
        status              VARCHAR(50)   NOT NULL DEFAULT 'Active',
        featured_product    TINYINT(1)    NOT NULL DEFAULT 0,
        best_seller         TINYINT(1)    NOT NULL DEFAULT 0,
        todays_deal         TINYINT(1)    NOT NULL DEFAULT 0,
        delivery_time       VARCHAR(100)  DEFAULT '',
        return_available    TINYINT(1)    NOT NULL DEFAULT 0,
        rating              DECIMAL(3,1)  DEFAULT 5.0,
        review_count        INT           DEFAULT 0,
        combo_items         LONGTEXT      DEFAULT '[]',
        type                INT           DEFAULT 0,
        created_by          VARCHAR(36)   DEFAULT NULL,
        updated_by          VARCHAR(36)   DEFAULT NULL,
        created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } finally {
    connection.release();
  }
};

module.exports = { createCategoryTable, createProductTable };
