const { pool } = require('./src/config/db');

async function alterTable() {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.query("ALTER TABLE products ADD COLUMN customer_review LONGTEXT DEFAULT '[]'");
            console.log('Successfully added customer_review column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists');
            } else {
                throw err;
            }
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

alterTable();
