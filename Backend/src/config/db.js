require("dotenv").config();
const mysql = require("mysql2/promise");

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dmart_db',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

console.log("DB CONFIG:", {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
});

if (!config.host || !config.user || !config.database) {
  console.error('Missing DB config. Please set DB_HOST, DB_USER, and DB_NAME in backend/.env');
}

const pool = mysql.createPool(config);

// Proper way to set session variables for every connection in a pool
pool.on('connection', (connection) => {
  connection.query("SET SESSION max_allowed_packet = 67108864", (err) => {
    if (err) {
      console.warn("⚠️ Could not set max_allowed_packet on new connection:", err.message);
    }
  });
});

// Validate DB connectivity at startup
(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL pool connected successfully');
  } catch (err) {
    console.error('❌ MySQL pool startup connection failed:', err.message || err);
    console.error('   TIP: Start the MySQL server or update backend/.env DB_HOST/DB_PORT to a reachable database.');
  }
})();

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('❌ DB Pool Error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('  → Connection was closed by the server');
  } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('  → Cannot enqueue, connection closed due to fatal error');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('  → Authentication failed - check DB credentials');
  } else if (err.code === 'ER_NO_DB_ERROR') {
    console.error('  → Database does not exist');
  }
});

const als = require("./context");

const originalGetConnection = pool.getConnection;

pool.getConnection = async function() {
  const conn = await originalGetConnection.call(this);
  
  const store = als.getStore();
  const user = store ? store.get('user') : null;
  
  if (user) {
    await conn.query('SET @web_user_id = ?, @web_username = ?', [
      user.user_id || user.userId, 
      user.username || user.email
    ]);
  } else {
    await conn.query('SET @web_user_id = NULL, @web_username = NULL');
  }
  
  return conn;
};

pool.query = async function(...args) {
  const conn = await this.getConnection();
  try {
    return await conn.query(...args);
  } finally {
    conn.release();
  }
};

pool.execute = async function(...args) {
  const conn = await this.getConnection();
  try {
    return await conn.execute(...args);
  } finally {
    conn.release();
  }
};

module.exports = pool;