const { AsyncLocalStorage } = require('async_hooks');

// Simple AsyncLocalStorage instance to store per-request context (e.g., user)
const als = new AsyncLocalStorage();

module.exports = als;
