const db = require('../config/db');
const crypto = require('crypto');

exports.createCategory = async (req, res) => {
    try {
        const { name, catId, description, subcategory, images, show_in_navbar } = req.body;
        
        // At least name and catId are required
        if (!name || !catId) {
            return res.status(400).json({ error: 'Name and catId are required' });
        }
        
        const category_id = crypto.randomUUID();
        
        await db.query(
            `INSERT INTO categories (category_id, catId, name, description, subcategory, images, show_in_navbar)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                description = VALUES(description),
                subcategory = VALUES(subcategory),
                images = VALUES(images),
                show_in_navbar = VALUES(show_in_navbar)`,
            [
                category_id, 
                catId, 
                name, 
                description || null, 
                subcategory ? JSON.stringify(subcategory) : null, 
                images ? JSON.stringify(images) : null, 
                show_in_navbar !== undefined ? show_in_navbar : 1
            ]
        );
        
        res.status(201).json({ message: 'Category created successfully', category_id });
    } catch (error) {
        console.error('Create category error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A category with this catId or category_id already exists.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY created_at DESC');
        
        // Parse JSON strings back into objects/arrays for frontend
        const formattedCategories = categories.map(cat => ({
            ...cat,
            subcategory: cat.subcategory ? JSON.parse(cat.subcategory) : null,
            images: cat.images ? JSON.parse(cat.images) : null
        }));
        
        res.status(200).json(formattedCategories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
