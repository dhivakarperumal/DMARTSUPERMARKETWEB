const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const isBcryptHash = (value) =>
  typeof value === 'string' && /^\$2[abxy]\$/.test(value);

const isLegacySaltHash = (value) =>
  typeof value === 'string' && /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(value);

const isDirectDigestHash = (value) =>
  typeof value === 'string' && /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64}|[a-f0-9]{128})$/i.test(value);

const verifyDirectDigestPassword = (password, storedHash) => {
  if (!storedHash || !isDirectDigestHash(storedHash)) {
    return false;
  }

  const lowerStored = storedHash.toLowerCase();
  const algorithms = [
    { name: 'md5', length: 32 },
    { name: 'sha1', length: 40 },
    { name: 'sha256', length: 64 },
    { name: 'sha512', length: 128 },
  ];

  for (const algo of algorithms) {
    const candidate = crypto.createHash(algo.name).update(password).digest('hex');
    if (candidate.length === algo.length && candidate.toLowerCase() === lowerStored) {
      return true;
    }
  }

  return false;
};

const verifyLegacyPassword = (password, storedHash) => {
  if (!isLegacySaltHash(storedHash)) {
    return false;
  }

  const [saltHex, expectedHash] = storedHash.split(':');
  const saltBuf = Buffer.from(saltHex, 'hex');
  const passwordBuf = Buffer.from(password);
  
  // Extended SHA512 candidates
  const sha512Candidates = [
    // Basic concatenations
    Buffer.concat([saltBuf, passwordBuf]),
    Buffer.concat([passwordBuf, saltBuf]),
    Buffer.from(`${password}:${saltHex}`),
    Buffer.from(`${saltHex}:${password}`),
    Buffer.from(password + saltHex),
    Buffer.from(saltHex + password),
    Buffer.concat([saltBuf, passwordBuf, saltBuf]),
    Buffer.concat([passwordBuf, saltBuf, passwordBuf]),
    // Additional variants
    Buffer.concat([saltBuf, Buffer.from(':'), passwordBuf]),
    Buffer.concat([passwordBuf, Buffer.from(':'), saltBuf]),
    Buffer.from(saltHex + ':' + password),
    Buffer.from(password + ':' + saltHex),
    // Try double salt
    Buffer.concat([saltBuf, saltBuf, passwordBuf]),
    Buffer.concat([passwordBuf, saltBuf, saltBuf]),
  ];

  for (const candidateInput of sha512Candidates) {
    const candidateHash = crypto
      .createHash('sha512')
      .update(candidateInput)
      .digest('hex');
    if (candidateHash === expectedHash) {
      return true;
    }
  }

  // Try double hashing
  for (const candidateInput of sha512Candidates) {
    const firstHash = crypto.createHash('sha512').update(candidateInput).digest();
    const doubleHash = crypto.createHash('sha512').update(firstHash).digest('hex');
    if (doubleHash === expectedHash) {
      return true;
    }
  }

  const pbkdf2Iters = [1, 10, 100, 500, 1000, 5000, 10000, 20000];
  for (const iter of pbkdf2Iters) {
    const sha512Hash = crypto
      .pbkdf2Sync(password, saltBuf, iter, 64, 'sha512')
      .toString('hex');
    if (sha512Hash === expectedHash) return true;

    const sha256Hash = crypto
      .pbkdf2Sync(password, saltBuf, iter, 64, 'sha256')
      .toString('hex');
    if (sha256Hash === expectedHash) return true;
  }

  const hmacCandidates = [
    crypto.createHmac('sha256', saltBuf).update(password).digest('hex'),
    crypto.createHmac('sha512', saltBuf).update(password).digest('hex'),
    crypto.createHmac('sha256', saltHex).update(password).digest('hex'),
    crypto.createHmac('sha512', saltHex).update(password).digest('hex'),
  ];
  
  return hmacCandidates.some((candidate) => candidate === expectedHash);
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

exports.register = async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        
        // Check if user already exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user_id = crypto.randomBytes(16).toString('hex');

        await pool.query(
            `INSERT INTO users (user_id, username, email, phone, password, role, status, created_by, updated_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [user_id, username, email, phone || null, hashedPassword, 'user', 'active', user_id, user_id]
        );
        
        res.status(201).json({ message: 'User registered successfully', user_id });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle MySQL duplicate entry errors (e.g. for phone or username)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A user with this phone number or username already exists.' });
        }
        
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, username, phone, password, identifier } = req.body;
        
        const loginIdentifier = email || username || phone || identifier;
        
        if (!loginIdentifier || !password) {
            return res.status(400).json({ error: 'Email/Username/Phone and password are required' });
        }
        
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR username = ? OR phone = ?', 
            [loginIdentifier, loginIdentifier, loginIdentifier]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        const storedHash = user.password_hash || user.password || null;
        
        const isMatch = await verifyPassword(password, storedHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (isLegacySaltHash(storedHash) && !isBcryptHash(storedHash)) {
          const newHash = await bcrypt.hash(password, 10);
          await pool.query('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
        }
        
        const payload = {
            user_id: user.user_id,
            username: user.username,
            role: user.role
        };
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, user_id, username, email, phone, role, status, created_at FROM users');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, phone, role, status, password } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: 'Username and email are required' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE user_id = ? OR id = ?', [id, id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existingUser = users[0];
        const resolvedUserId = existingUser.user_id;
        const resolvedRole = role ? String(role).toLowerCase() : existingUser.role;
        const resolvedStatus = status ? String(status).toLowerCase() : existingUser.status;

        const updateFields = [
            'username = ?',
            'email = ?',
            'phone = ?',
            'role = ?',
            'status = ?',
            'updated_at = NOW()'
        ];
        const updateValues = [
            username,
            email,
            phone || null,
            resolvedRole,
            resolvedStatus
        ];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }

        updateValues.push(resolvedUserId);

        await pool.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`,
            updateValues
        );

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
