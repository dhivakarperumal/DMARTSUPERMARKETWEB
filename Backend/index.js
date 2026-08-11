const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const db = require("./src/config/db");
const als = require("./src/config/context");
const { createCategoryTable, createProductTable } = require("./src/config/initDatabase");

// ── Initialize DB tables once at startup (not on every request) ───────────
(async () => {
  try {
    await createCategoryTable();
    await createProductTable();
    console.log("✅ Database tables initialized successfully");
  } catch (err) {
    console.error("❌ Database table initialization failed:", err.message || err);
    // Do not crash the server; tables may already exist
  }
})();


const app = express();

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* ✅ EXACT CORS FIX - Allow multiple ports */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const url = new URL(origin);
        const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
        if (isLocalhost) return callback(null, origin);
      } catch (err) {}
      const allowed = [
        "https://dmart.qtechx.com",
        "http://dmart.qtechx.com",
      ];
      if (allowed.includes(origin)) return callback(null, origin);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const allowedUploadCategories = new Set([
  "products",
  "categories",
  "banners",
  "dealers",
  "staff",
  "reviews",
  "videos",
  "thumbnails",
  "proxy-cache",
]);

const ensureUploadFolders = () => {
  const uploadsRoot = path.join(__dirname, "uploads");
  fs.mkdirSync(uploadsRoot, { recursive: true });
  allowedUploadCategories.forEach((category) => {
    const folder = path.join(uploadsRoot, category);
    fs.mkdirSync(folder, { recursive: true });
  });
};

ensureUploadFolders();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawCategory = String(req.params.category || req.query.category || "products").trim().toLowerCase();
    const category = allowedUploadCategories.has(rawCategory) ? rawCategory : "products";
    const targetFolder = path.join(__dirname, "uploads", category);
    fs.mkdirSync(targetFolder, { recursive: true });
    cb(null, targetFolder);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

const handleUpload = (req, res) => {
  try {
    const rawCategory = String(req.params.category || req.body.category || req.query.category || "products").trim().toLowerCase();
    const category = allowedUploadCategories.has(rawCategory) ? rawCategory : "products";
    const uploadedFiles = req.files || [];

    if (!uploadedFiles.length) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded.",
      });
    }

    const urls = uploadedFiles.map((file) =>
      `/api/uploads/${category}/${file.filename}`,
    );

    return res.status(200).json({
      success: true,
      urls,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed.",
      error: error.message,
    });
  }
};

app.post("/api/upload", upload.array("files[]"), handleUpload);
app.post("/api/upload/:category", upload.array("files[]"), handleUpload);

// Serve uploaded files via a safe manual route and fallback static middleware
app.get(['/uploads/*', '/api/uploads/*'], (req, res) => {
  const relativePath = req.params[0];
  if (!relativePath) {
    return res.status(404).end();
  }

  const normalizedRelativePath = path.normalize(relativePath).replace(/^([\\/]+|\.\.([\\/]|$))+/, "");
  const filePath = path.join(__dirname, 'uploads', normalizedRelativePath);
  const uploadsRoot = path.join(__dirname, 'uploads');

  if (!filePath.startsWith(uploadsRoot)) {
    return res.status(403).end();
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Upload file serve error:', err);
      if (err.code === 'ENOENT') {
        return res.status(404).end();
      }
      return res.status(err.status || 500).end();
    }
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Proxy endpoint with host allowlist and simple disk cache.
const crypto = require('crypto');
const http = require('http');
const https = require('https');

const PROXY_ALLOWED_HOSTS = (process.env.PROXY_ALLOWED_HOSTS || 'dmart.qtechx.com').split(',').map(s => s.trim()).filter(Boolean);
const PROXY_CACHE_DIR = path.join(__dirname, 'uploads', 'proxy-cache');
const PROXY_CACHE_TTL = Number(process.env.PROXY_CACHE_TTL_MS || 24 * 60 * 60 * 1000); // default 24h
fs.mkdirSync(PROXY_CACHE_DIR, { recursive: true });

app.get('/api/proxy', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('url query param required');
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return res.status(400).send('invalid url');
  }

  if (!PROXY_ALLOWED_HOSTS.includes(parsed.host)) {
    return res.status(403).send('host not allowed');
  }

  const hash = crypto.createHash('sha256').update(url).digest('hex');
  const cacheFile = path.join(PROXY_CACHE_DIR, hash);
  const metaFile = cacheFile + '.meta.json';

  // Serve from cache when fresh
  try {
    if (fs.existsSync(cacheFile) && fs.existsSync(metaFile)) {
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      const age = Date.now() - (meta.fetchedAt || 0);
      if (age <= PROXY_CACHE_TTL) {
        if (meta.contentType) res.setHeader('Content-Type', meta.contentType);
        if (meta.cacheControl) res.setHeader('Cache-Control', meta.cacheControl);
        const stream = fs.createReadStream(cacheFile);
        return stream.pipe(res);
      }
    }
  } catch (err) {
    console.warn('Proxy cache read error', err.message);
  }

  const client = parsed.protocol === 'https:' ? https : http;
  const options = {
    headers: {
      'User-Agent': 'DMart-Proxy/1.0 (+https://localhost)',
      'Referer': parsed.origin,
      'Origin': parsed.origin,
      'Host': parsed.host,
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
    }
  };

  client.get(url, options, (proxRes) => {
    console.log('[proxy] upstream status', proxRes.statusCode, 'for', url);
    if (proxRes.statusCode && proxRes.statusCode >= 400) {
      console.warn('[proxy] upstream headers', proxRes.headers);
      return res.status(502).send('upstream error');
    }

    const contentType = proxRes.headers['content-type'] || 'application/octet-stream';
    const cacheControl = proxRes.headers['cache-control'] || 'public, max-age=86400';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', cacheControl);

    // Stream to client and write to cache file
    const tmpPath = cacheFile + '.tmp';
    const fileStream = fs.createWriteStream(tmpPath);
    proxRes.pipe(fileStream);
    // Also pipe to response
    proxRes.pipe(res);

    proxRes.on('end', () => {
      try {
        fs.renameSync(tmpPath, cacheFile);
        fs.writeFileSync(metaFile, JSON.stringify({ fetchedAt: Date.now(), contentType, cacheControl }));
      } catch (err) {
        // ignore cache write errors
        console.warn('Proxy cache write error', err.message);
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (e) {}
      }
    });

    proxRes.on('error', (err) => {
      console.error('Proxy fetch error:', err.message);
      res.status(502).send('proxy error');
    });
  }).on('error', (err) => {
    console.error('Proxy request error:', err.message);
    res.status(502).send('proxy error');
  });
});

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Global Context Middleware for tracking created_by / updated_by
app.use((req, res, next) => {
  let user = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    } catch (err) {
      // Ignore token errors here, just proceed without user context
    }
  }
  
  als.run(new Map([['user', user]]), () => {
    next();
  });
});

const authRouter = require("./src/routers/authRouter");
const addressRouter = require('./src/routers/addressRouter');
const attendanceRouter = require('./src/routers/attendanceRouter');
const bannersRouter = require('./src/routers/bannersRouter');
const cartRouter = require('./src/routers/cartRouter');
const categoriesRouter = require('./src/routers/categoriesRouter');
const couponsRouter = require('./src/routers/couponsRouter');
const dashboardRouter = require('./src/routers/dashboardRouter');
const dealersRouter = require('./src/routers/dealersRouter');
const deliveryChargesRouter = require('./src/routers/deliveryChargesRouter');
const employeeRoutes = require('./src/routers/employeeRoutes');
const invoicesRouter = require('./src/routers/invoicesRouter');
const leaveRouter = require('./src/routers/leaveRouter');
const loginRouter = require('./src/routers/loginRouter');
const ordersRouter = require('./src/routers/ordersRouter');
const productsRouter = require('./src/routers/productsRouter');
const purchaseRoutes = require('./src/routers/purchaseRoutes');
const reportsRouter = require('./src/routers/reportsRouter');
const reviewsRouter = require('./src/routers/reviewsRouter');
const salaryRouter = require('./src/routers/salaryRouter');
const settingsRouter = require('./src/routers/settingsRouter');
const videosRouter = require('./src/routers/videosRouter');
const wishlistRouter = require('./src/routers/wishlistRouter');

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/address', addressRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dealers', dealersRouter);
app.use('/api/deliveryCharges', deliveryChargesRouter);
app.use('/api/employee', employeeRoutes);
// Also expose legacy /api/staff routes expected by the frontend
app.use('/api/staff', employeeRoutes);
app.use('/api/invoices', invoicesRouter);
app.use('/api/leave', leaveRouter);
app.use('/api/login', loginRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/salary', salaryRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/videos', videosRouter);
app.use('/api/wishlist', wishlistRouter);

// Return JSON 404 for any unknown API route.
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Serve frontend build if available
const frontendDist = path.join(__dirname, '..', 'Frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Backend port ${PORT} is already in use. Stop existing instances or set PORT=${PORT + 1}.`);
  } else {
    console.error("Backend server error:", err);
  }
  process.exit(1);
});

module.exports = app;
