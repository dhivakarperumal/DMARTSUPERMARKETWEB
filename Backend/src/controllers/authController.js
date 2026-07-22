const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        
        // Check if user already exists
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user_id = crypto.randomUUID();
        // Since created_by and updated_by are NOT NULL, we use the generated user_id
        const created_by = user_id; 
        const updated_by = user_id;

        await db.query(
            `INSERT INTO users (user_id, username, email, phone, password, role, status, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, username, email, phone || null, hashedPassword, 'user', 'active', created_by, updated_by]
        );
        
        res.status(201).json({ message: 'User registered successfully', user_id });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle MySQL duplicate entry errors (e.g. for phone or username)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A user with this phone number or username already exists.' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        console.log("LOGIN REQUEST BODY:", req.body);
        const { email, username, phone, password, identifier } = req.body;
        
        const loginIdentifier = email || username || phone || identifier;
        
        if (!loginIdentifier || !password) {
            return res.status(400).json({ error: 'Email/Username/Phone and password are required' });
        }
        
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ? OR username = ? OR phone = ?', 
            [loginIdentifier, loginIdentifier, loginIdentifier]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
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
        res.status(500).json({ error: 'Internal server error' });
    }
};
