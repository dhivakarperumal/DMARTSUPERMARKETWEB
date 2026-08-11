const crypto = require("crypto");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[abxy]\$/.test(value);

const isLegacySaltHash = (value) =>
  typeof value === "string" && /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(value);

const isDirectDigestHash = (value) =>
  typeof value === "string" && /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64}|[a-f0-9]{128})$/i.test(value);

const verifyDirectDigestPassword = (password, storedHash) => {
  if (!storedHash || !isDirectDigestHash(storedHash)) {
    return false;
  }

  const lowerStored = storedHash.toLowerCase();
  const algorithms = [
    { name: "md5", length: 32 },
    { name: "sha1", length: 40 },
    { name: "sha256", length: 64 },
    { name: "sha512", length: 128 },
  ];

  for (const algo of algorithms) {
    const candidate = crypto.createHash(algo.name).update(password).digest("hex");
    if (candidate.length === algo.length && candidate.toLowerCase() === lowerStored) {
      return true;
    }
  }

  return false;
};

const verifyLegacyPassword = (password, storedHash) => {
  if (!isLegacySaltHash(storedHash)) return false;

  const [saltHex, expectedHash] = storedHash.split(":");
  const saltBuf = Buffer.from(saltHex, "hex");
  const passwordBuf = Buffer.from(password);

  const sha512Candidates = [
    Buffer.concat([saltBuf, passwordBuf]),
    Buffer.concat([passwordBuf, saltBuf]),
    Buffer.from(`${password}:${saltHex}`),
    Buffer.from(`${saltHex}:${password}`),
    Buffer.from(password + saltHex),
    Buffer.from(saltHex + password),
    Buffer.concat([saltBuf, passwordBuf, saltBuf]),
    Buffer.concat([passwordBuf, saltBuf, passwordBuf]),
  ];

  for (const candidate of sha512Candidates) {
    const candidateHash = crypto.createHash("sha512").update(candidate).digest("hex");
    if (candidateHash === expectedHash) {
      return true;
    }
  }

  const pbkdf2Iters = [1, 10, 100, 500, 1000, 5000, 10000, 20000];
  for (const iter of pbkdf2Iters) {
    const sha512Hash = crypto.pbkdf2Sync(password, saltBuf, iter, 64, "sha512").toString("hex");
    if (sha512Hash === expectedHash) return true;

    const sha256Hash = crypto.pbkdf2Sync(password, saltBuf, iter, 64, "sha256").toString("hex");
    if (sha256Hash === expectedHash) return true;
  }

  const hmacCandidates = [
    crypto.createHmac("sha256", saltBuf).update(password).digest("hex"),
    crypto.createHmac("sha512", saltBuf).update(password).digest("hex"),
    crypto.createHmac("sha256", saltHex).update(password).digest("hex"),
    crypto.createHmac("sha512", saltHex).update(password).digest("hex"),
  ];

  return hmacCandidates.some((hash) => hash === expectedHash);
};

const verifyPassword = async (password, storedHash) => {
  if (!storedHash) return false;
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }
  if (isLegacySaltHash(storedHash)) {
    return verifyLegacyPassword(password, storedHash);
  }
  if (isDirectDigestHash(storedHash)) {
    return verifyDirectDigestPassword(password, storedHash);
  }
  return false;
};

const loginUser = async (req, res) => {
  let connection;

  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required",
      });
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "supermarket_db",
      port: Number(process.env.DB_PORT || 3306),
    });

    const [rows] = await connection.query(
      "SELECT * FROM users WHERE email = ? OR username = ? OR phone = ?",
      [identifier, identifier, identifier]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password",
      });
    }

    const user = rows[0];
    const storedHash = user.password_hash || user.password || null;
    const isValidPassword = await verifyPassword(password, storedHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password",
      });
    }

    if (storedHash && isLegacySaltHash(storedHash) && !isBcryptHash(storedHash)) {
      const bcryptHash = await bcrypt.hash(password, 10);
      await connection.query("UPDATE users SET password = ? WHERE id = ?", [bcryptHash, user.id]);
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, id: user.id },
      process.env.JWT_SECRET || "supersecretkey",
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const googleLogin = async (req, res) => {
  let connection;

  try {
    const { email, name, googleId } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google email is required",
      });
    }

    connection = await mysql.createConnection({
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
        await connection.query("UPDATE users SET google_id = ? WHERE id = ?", [googleId, user.id]);
        user.google_id = googleId;
      }
    } else {
      const username = (name || email.split("@")[0]).replace(/\s+/g, "").slice(0, 100);
      const userId = crypto.randomUUID();
      const tempPassword = crypto.randomBytes(20).toString("hex");
      const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

      const [insertResult] = await connection.query(
        `INSERT INTO users (user_id, username, email, phone, google_id, password, status, role, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, username, email, null, googleId || null, hashedTempPassword, "active", "user", userId, userId]
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

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, id: user.id },
      process.env.JWT_SECRET || "supersecretkey",
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = {
  loginUser,
  googleLogin,
};
