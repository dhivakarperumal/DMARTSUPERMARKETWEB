const db = require('./src/config/db');

(async () => {
    try {
        const [rows] = await db.query('SHOW TABLES');
        console.log("Tables:", rows);
        
        let userTable = 'users';
        if (userTable) {
            console.log(`Found user table: ${userTable}`);
            const [schema] = await db.query(`DESCRIBE \`${userTable}\``);
            console.log("Schema:", schema);
        }
    } catch(e) {
        console.error(e);
    }
    process.exit();
})();
