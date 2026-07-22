const crypto = require("crypto");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required",
      });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "supermarket_db",
      port: Number(process.env.DB_PORT || 3306),
    });

    const [rows] = await connection.query(
      "SELECT * FROM users WHERE (email = ? OR username = ?) AND password = ?",
      [identifier, identifier, hashPassword(password)]
    );

    await connection.end();

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password",
      });
    }

    const user = rows[0];
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "9d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role || "user",
        status: user.status,
        budget_mode: user.budget_mode ? true : false,
        budget_amount: parseFloat(user.budget_amount) || 0,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google email is required",
      });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "supermarket_db",
      port: Number(process.env.DB_PORT || 3306),
    });

    const [existingRows] = await connection.query(
      "SELECT * FROM users WHERE email = ? OR google_id = ?",
      [email, googleId]
    );

    let user;

    if (existingRows.length) {
      user = existingRows[0];
      if (!user.google_id && googleId) {
        await connection.query(
          "UPDATE users SET google_id = ? WHERE id = ?",
          [googleId, user.id]
        );
        user.google_id = googleId;
      }
    } else {
      const username = (name || email.split("@")[0]).replace(/\s+/g, "").slice(0, 100);
      const userId = crypto.randomUUID();
      const tempPassword = crypto.randomBytes(20).toString("hex");

      const [insertResult] = await connection.query(
        `INSERT INTO users (user_id, username, email, phone, google_id, password, status, role, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, username, email, null, googleId || null, hashPassword(tempPassword), "active", "user", userId, userId]
      );

      user = {
        id: insertResult?.insertId || 0,
        user_id: userId,
        username,
        email,
        phone: null,
        google_id: googleId || null,
        role: "user",
        status: "active",
        budget_mode: 0,
        budget_amount: 0,
      };
    }

    await connection.end();

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "9d" }
    );

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        google_id: user.google_id || null,
        role: user.role || "user",
        status: user.status,
        budget_mode: user.budget_mode ? true : false,
        budget_amount: parseFloat(user.budget_amount) || 0,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during Google login",
    });
  }
};

module.exports = {
  loginUser,
  googleLogin,
};
