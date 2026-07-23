const express = require("express");
const cors = require("cors");
const path = require("path");
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
        "http://dmart.qtechx.com"
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

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = app;
