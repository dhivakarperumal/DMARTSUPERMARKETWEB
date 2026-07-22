const getPool = () => require("../config/db").getPool();

/* =========================================
   INITIALIZE ALL PURCHASE TABLES
========================================= */
const initPurchaseTables = async () => {
    const pool = getPool();
    try {
        // 1. Suppliers
        await pool.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                supplier_code VARCHAR(20) UNIQUE,
                supplier_name VARCHAR(200) NOT NULL,
                company_name VARCHAR(200),
                contact_person VARCHAR(100),
                mobile VARCHAR(20),
                alt_mobile VARCHAR(20),
                email VARCHAR(150),
                gst_number VARCHAR(20),
                pan_number VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100) DEFAULT 'India',
                pincode VARCHAR(10),
                bank_name VARCHAR(100),
                account_number VARCHAR(50),
                ifsc_code VARCHAR(20),
                upi_id VARCHAR(100),
                payment_terms VARCHAR(100),
                credit_days INT DEFAULT 0,
                credit_limit DECIMAL(15,2) DEFAULT 0,
                opening_balance DECIMAL(15,2) DEFAULT 0,
                outstanding_balance DECIMAL(15,2) DEFAULT 0,
                status ENUM('Active','Inactive') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        // Alter suppliers: add missing columns safely
        const supplierCols = ['alt_mobile','pan_number','city','state','country','pincode','bank_name','account_number','ifsc_code','upi_id','payment_terms','credit_days','opening_balance','outstanding_balance'];
        for (const col of supplierCols) {
            try { await pool.query(`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ${col} VARCHAR(200)`); } catch(e){}
        }

        // 2. Purchase Orders
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                po_number VARCHAR(30) UNIQUE,
                supplier_id INT,
                purchase_date DATE,
                expected_delivery_date DATE,
                warehouse VARCHAR(100) DEFAULT 'Main Warehouse',
                buyer VARCHAR(100),
                status ENUM('Draft','Pending','Approved','Ordered','Partially Received','Fully Received','Cancelled') DEFAULT 'Pending',
                notes TEXT,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
            ) ENGINE=InnoDB
        `);
        // Alter purchase_orders: add missing columns safely
        const poCols = [
            "expected_delivery_date DATE",
            "warehouse VARCHAR(100) DEFAULT 'Main Warehouse'",
            "buyer VARCHAR(100)",
            "status VARCHAR(50) DEFAULT 'Pending'",
            "notes TEXT",
            "created_by VARCHAR(100)"
        ];
        for (const col of poCols) {
            const colName = col.split(' ')[0];
            try { await pool.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ${col}`); } catch(e){}
        }
        // 3. Purchases (GRN / Invoices)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                grn_number VARCHAR(30) UNIQUE,
                po_id INT,
                supplier_id INT,
                supplier_invoice_no VARCHAR(100),
                invoice_date DATE,
                warehouse VARCHAR(100) DEFAULT 'Main Warehouse',
                purchase_type ENUM('Cash Purchase','Credit Purchase','Direct Purchase','Purchase Against PO') DEFAULT 'Credit Purchase',
                subtotal DECIMAL(15,2) DEFAULT 0,
                discount_percent DECIMAL(5,2) DEFAULT 0,
                discount_amount DECIMAL(15,2) DEFAULT 0,
                tax_amount DECIMAL(15,2) DEFAULT 0,
                transport_charge DECIMAL(15,2) DEFAULT 0,
                other_charge DECIMAL(15,2) DEFAULT 0,
                round_off DECIMAL(5,2) DEFAULT 0,
                net_amount DECIMAL(15,2) DEFAULT 0,
                paid_amount DECIMAL(15,2) DEFAULT 0,
                balance_amount DECIMAL(15,2) DEFAULT 0,
                payment_method ENUM('Cash','UPI','Debit Card','Credit Card','Bank Transfer','Cheque','Credit','Mixed') DEFAULT 'Credit',
                payment_status ENUM('Paid','Partially Paid','Unpaid') DEFAULT 'Unpaid',
                due_date DATE,
                transaction_number VARCHAR(100),
                reference_number VARCHAR(100),
                notes TEXT,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
                FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
            ) ENGINE=InnoDB
        `);

        // Alter purchases: add missing columns
        const purchaseCols = [
            "grn_number VARCHAR(30)", "supplier_invoice_no VARCHAR(100)",
            "po_id INT", "supplier_id INT", "invoice_date DATE",
            "warehouse VARCHAR(100) DEFAULT 'Main Warehouse'",
            "purchase_type VARCHAR(50) DEFAULT 'Credit Purchase'",
            "subtotal DECIMAL(15,2) DEFAULT 0", "discount_percent DECIMAL(5,2) DEFAULT 0",
            "discount_amount DECIMAL(15,2) DEFAULT 0", "tax_amount DECIMAL(15,2) DEFAULT 0",
            "transport_charge DECIMAL(15,2) DEFAULT 0", "other_charge DECIMAL(15,2) DEFAULT 0",
            "round_off DECIMAL(5,2) DEFAULT 0", "net_amount DECIMAL(15,2) DEFAULT 0",
            "paid_amount DECIMAL(15,2) DEFAULT 0", "balance_amount DECIMAL(15,2) DEFAULT 0",
            "payment_method VARCHAR(50) DEFAULT 'Credit'", "payment_status VARCHAR(50) DEFAULT 'Unpaid'",
            "transaction_number VARCHAR(100)", "reference_number VARCHAR(100)",
            "due_date DATE", "notes TEXT", "created_by VARCHAR(100)"
        ];
        const [existingCols] = await pool.query(`SHOW COLUMNS FROM purchases`);
        const existingColNames = existingCols.map(c => c.Field.toLowerCase());
        for (const col of purchaseCols) {
            const colName = col.split(' ')[0].toLowerCase();
            if (!existingColNames.includes(colName)) {
                try { await pool.query(`ALTER TABLE purchases ADD COLUMN ${col}`); } catch(e){ console.log('Col add skip:', colName, e.message); }
            }
        }

        // 4. Purchase Items
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_id INT NOT NULL,
                product_id INT,
                product_name VARCHAR(200),
                barcode VARCHAR(100),
                sku VARCHAR(100),
                batch_number VARCHAR(100),
                lot_number VARCHAR(100),
                quantity DECIMAL(10,3) DEFAULT 0,
                free_quantity DECIMAL(10,3) DEFAULT 0,
                unit VARCHAR(50) DEFAULT 'Pcs',
                unit_price DECIMAL(15,2) DEFAULT 0,
                landing_cost DECIMAL(15,2) DEFAULT 0,
                discount_percent DECIMAL(5,2) DEFAULT 0,
                discount_amount DECIMAL(15,2) DEFAULT 0,
                tax_percent DECIMAL(5,2) DEFAULT 0,
                tax_amount DECIMAL(15,2) DEFAULT 0,
                mrp DECIMAL(15,2) DEFAULT 0,
                selling_price DECIMAL(15,2) DEFAULT 0,
                expiry_date DATE,
                manufacturing_date DATE,
                total_price DECIMAL(15,2) DEFAULT 0,
                FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // 5. Purchase Payments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_id INT NOT NULL,
                payment_date DATE NOT NULL,
                payment_method ENUM('Cash','UPI','Debit Card','Credit Card','Bank Transfer','Cheque') DEFAULT 'Cash',
                amount DECIMAL(15,2) NOT NULL,
                transaction_number VARCHAR(100),
                reference_number VARCHAR(100),
                remarks TEXT,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // 6. Purchase Returns
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_returns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                return_number VARCHAR(30) UNIQUE,
                purchase_id INT,
                supplier_id INT,
                return_date DATE,
                total_amount DECIMAL(15,2) DEFAULT 0,
                reason VARCHAR(200),
                notes TEXT,
                status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
            ) ENGINE=InnoDB
        `);

        // 7. Purchase Return Items
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_return_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                return_id INT NOT NULL,
                product_id INT,
                product_name VARCHAR(200),
                quantity DECIMAL(10,3) DEFAULT 0,
                unit_price DECIMAL(15,2) DEFAULT 0,
                total_price DECIMAL(15,2) DEFAULT 0,
                FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // 8. Stock Ledger
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stock_ledger (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT,
                batch_number VARCHAR(100),
                transaction_type ENUM('Opening Stock','Purchase','Purchase Return','Sale','Sales Return','Damage','Adjustment','Stock Transfer') DEFAULT 'Purchase',
                reference_id INT,
                reference_number VARCHAR(50),
                quantity_in DECIMAL(10,3) DEFAULT 0,
                quantity_out DECIMAL(10,3) DEFAULT 0,
                expiry_date DATE,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        // 9. Purchase Audit Logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(50),
                module VARCHAR(50),
                reference_id INT,
                reference_number VARCHAR(50),
                description TEXT,
                performed_by VARCHAR(100),
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        // Additional fallback ALTERS
        try { await pool.query("ALTER TABLE purchase_returns ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0"); } catch(e){}
        try { await pool.query("ALTER TABLE purchase_returns ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending'"); } catch(e){}
        try { await pool.query("ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100)"); } catch(e){}
        try { await pool.query("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending'"); } catch(e){}
        
        const purchaseItemCols = ["product_name VARCHAR(200)","barcode VARCHAR(100)","sku VARCHAR(100)","batch_number VARCHAR(100)","lot_number VARCHAR(100)","quantity DECIMAL(10,3) DEFAULT 0","free_quantity DECIMAL(10,3) DEFAULT 0","unit VARCHAR(50) DEFAULT 'Pcs'","unit_price DECIMAL(15,2) DEFAULT 0","landing_cost DECIMAL(15,2) DEFAULT 0","discount_percent DECIMAL(5,2) DEFAULT 0","discount_amount DECIMAL(15,2) DEFAULT 0","tax_percent DECIMAL(5,2) DEFAULT 0","tax_amount DECIMAL(15,2) DEFAULT 0","mrp DECIMAL(15,2) DEFAULT 0","selling_price DECIMAL(15,2) DEFAULT 0","expiry_date DATE","manufacturing_date DATE","total_price DECIMAL(15,2) DEFAULT 0"];
        for (const col of purchaseItemCols) {
            try { await pool.query(`ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS ${col}`); } catch(e){}
        }

        console.log("✅ Purchase tables initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing purchase tables:", error.message);
    }
};

/* ─── Audit Log Helper ───────────────────────────────────── */
const logAudit = async (pool, action, module, refId, refNumber, desc, user) => {
    try {
        await pool.query(
            `INSERT INTO purchase_audit_logs (action, module, reference_id, reference_number, description, performed_by) VALUES (?,?,?,?,?,?)`,
            [action, module, refId, refNumber, desc, user || 'system']
        );
    } catch(e) { /* non-critical */ }
};

/* ─── Auto-generate codes ────────────────────────────────── */
const generateCode = (prefix) => `${prefix}-${Date.now().toString().slice(-7)}`;

const getTableColumns = async (connection, tableName) => {
    const [rows] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
    return new Set(rows.map((row) => row.Field));
};

const insertRow = async (connection, tableName, data) => {
    const columns = await getTableColumns(connection, tableName);
    const entries = Object.entries(data).filter(([key, value]) => columns.has(key) && value !== undefined);

    if (entries.length === 0) {
        throw new Error(`No supported columns found for ${tableName}`);
    }

    const columnList = entries.map(([key]) => `\`${key}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map(([, value]) => value);

    const [result] = await connection.query(`INSERT INTO \`${tableName}\` (${columnList}) VALUES (${placeholders})`, values);
    return result;
};

const insertStockLedgerEntry = async (connection, payload) => {
    const columns = await getTableColumns(connection, 'stock_ledger');
    const data = {
        product_id: payload.product_id,
        batch_number: payload.batch_number,
        transaction_type: payload.transaction_type || 'Purchase',
        reference_id: payload.reference_id,
        reference_number: payload.reference_number,
        created_by: payload.created_by,
    };

    if (columns.has('quantity')) {
        data.quantity = payload.quantity;
    } else if (columns.has('quantity_in')) {
        data.quantity_in = payload.quantity;
    }

    if (columns.has('quantity_out')) {
        data.quantity_out = 0;
    }

    if (columns.has('opening_stock')) {
        data.opening_stock = 0;
    }

    if (columns.has('closing_stock')) {
        data.closing_stock = payload.quantity;
    }

    return insertRow(connection, 'stock_ledger', data);
};

/* =========================================
   DASHBOARD
========================================= */
const getDashboardStats = async (req, res) => {
    const pool = getPool();
    try {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

        const [[todayRow]] = await pool.query(`SELECT COALESCE(SUM(net_amount),0) as val, COUNT(*) as cnt FROM purchases WHERE DATE(invoice_date)=?`, [today]);
        const [[weekRow]] = await pool.query(`SELECT COALESCE(SUM(net_amount),0) as val, COUNT(*) as cnt FROM purchases WHERE invoice_date>=?`, [weekAgo]);
        const [[monthRow]] = await pool.query(`SELECT COALESCE(SUM(net_amount),0) as val, COUNT(*) as cnt FROM purchases WHERE invoice_date>=?`, [monthStart]);
        const [[totalRow]] = await pool.query(`SELECT COALESCE(SUM(net_amount),0) as val, COUNT(*) as cnt FROM purchases`);
        const [[pendingPO]] = await pool.query(`SELECT COUNT(*) as cnt FROM purchase_orders WHERE status NOT IN ('Fully Received','Cancelled')`);
        const [[outstandingRow]] = await pool.query(`SELECT COALESCE(SUM(outstanding_balance),0) as val FROM suppliers`);
        const [[supplierCount]] = await pool.query(`SELECT COUNT(*) as cnt FROM suppliers`);
        const [[returnsRow]] = await pool.query(`SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as val FROM purchase_returns`);
        const [[paidRow]] = await pool.query(`SELECT COALESCE(SUM(paid_amount),0) as val FROM purchases`);
        const [[unpaidRow]] = await pool.query(`SELECT COALESCE(SUM(balance_amount),0) as val FROM purchases`);

        // Monthly trend (last 6 months)
        const [monthlyTrend] = await pool.query(`
            SELECT DATE_FORMAT(invoice_date,'%b %Y') as month, 
                   COALESCE(SUM(net_amount),0) as total,
                   COUNT(*) as count
            FROM purchases 
            WHERE invoice_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(invoice_date,'%Y-%m')
            ORDER BY MIN(invoice_date)
        `);

        // Supplier-wise
        const [supplierWise] = await pool.query(`
            SELECT s.supplier_name as name, COALESCE(SUM(p.net_amount),0) as value
            FROM purchases p JOIN suppliers s ON p.supplier_id=s.id
            GROUP BY p.supplier_id ORDER BY value DESC LIMIT 8
        `);

        // Top products
        const [topProducts] = await pool.query(`
            SELECT pi.product_name as name, SUM(pi.quantity) as qty, SUM(pi.total_price) as value
            FROM purchase_items pi
            GROUP BY pi.product_id, pi.product_name
            ORDER BY qty DESC LIMIT 8
        `);

        res.json({
            success: true,
            stats: {
                today: { amount: todayRow.val, count: todayRow.cnt },
                week: { amount: weekRow.val, count: weekRow.cnt },
                month: { amount: monthRow.val, count: monthRow.cnt },
                total: { amount: totalRow.val, count: totalRow.cnt },
                pendingPOs: pendingPO.cnt,
                outstanding: outstandingRow.val,
                suppliers: supplierCount.cnt,
                returns: { count: returnsRow.cnt, amount: returnsRow.val },
                paid: paidRow.val,
                unpaid: unpaidRow.val
            },
            charts: { monthlyTrend, supplierWise, topProducts }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Dashboard error", error: error.message });
    }
};

/* =========================================
   SUPPLIER MANAGEMENT
========================================= */
const getAllSuppliers = async (req, res) => {
    const pool = getPool();
    try {
        const [rows] = await pool.query(`SELECT * FROM suppliers ORDER BY supplier_name`);
        res.json({ success: true, suppliers: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching suppliers", error: error.message });
    }
};

const getSupplierById = async (req, res) => {
    const pool = getPool();
    try {
        const [[supplier]] = await pool.query(`SELECT * FROM suppliers WHERE id=?`, [req.params.id]);
        if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });

        // Ledger: purchases + payments + returns
        const [purchases] = await pool.query(`
            SELECT id, grn_number as ref, invoice_date as date, net_amount as debit, 0 as credit, 'Purchase' as type, payment_status as status
            FROM purchases WHERE supplier_id=? ORDER BY invoice_date DESC LIMIT 50`, [req.params.id]);
        const [payments] = await pool.query(`
            SELECT pp.id, pp.payment_date as date, 0 as debit, pp.amount as credit, 'Payment' as type, '' as status, p.grn_number as ref
            FROM purchase_payments pp JOIN purchases p ON pp.purchase_id=p.id WHERE p.supplier_id=? ORDER BY pp.payment_date DESC LIMIT 50`, [req.params.id]);
        const [returns] = await pool.query(`
            SELECT id, return_number as ref, return_date as date, 0 as debit, total_amount as credit, 'Return' as type, status
            FROM purchase_returns WHERE supplier_id=? ORDER BY return_date DESC LIMIT 50`, [req.params.id]);

        res.json({ success: true, supplier, ledger: { purchases, payments, returns } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching supplier", error: error.message });
    }
};

const addSupplier = async (req, res) => {
    const pool = getPool();
    try {
        const code = generateCode('SUP');
        const { supplier_name, company_name, contact_person, mobile, alt_mobile, email, gst_number, pan_number,
                address, city, state, country, pincode, bank_name, account_number, ifsc_code, upi_id,
                payment_terms, credit_days, credit_limit, opening_balance, status } = req.body;
        const [result] = await pool.query(`
            INSERT INTO suppliers (supplier_code, supplier_name, company_name, contact_person, mobile, alt_mobile, email, gst_number, pan_number,
                address, city, state, country, pincode, bank_name, account_number, ifsc_code, upi_id,
                payment_terms, credit_days, credit_limit, opening_balance, outstanding_balance, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [code, supplier_name, company_name, contact_person, mobile, alt_mobile, email, gst_number, pan_number,
             address, city, state, country||'India', pincode, bank_name, account_number, ifsc_code, upi_id,
             payment_terms, credit_days||0, credit_limit||0, opening_balance||0, opening_balance||0, status||'Active']);
        await logAudit(pool, 'CREATE', 'Supplier', result.insertId, code, `Supplier ${supplier_name} created`);
        res.json({ success: true, message: "Supplier added successfully", id: result.insertId, supplier_code: code });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding supplier", error: error.message });
    }
};

const updateSupplier = async (req, res) => {
    const pool = getPool();
    try {
        const { supplier_name, company_name, contact_person, mobile, alt_mobile, email, gst_number, pan_number,
                address, city, state, country, pincode, bank_name, account_number, ifsc_code, upi_id,
                payment_terms, credit_days, credit_limit, status } = req.body;
        await pool.query(`
            UPDATE suppliers SET supplier_name=?, company_name=?, contact_person=?, mobile=?, alt_mobile=?, email=?, gst_number=?, pan_number=?,
                address=?, city=?, state=?, country=?, pincode=?, bank_name=?, account_number=?, ifsc_code=?, upi_id=?,
                payment_terms=?, credit_days=?, credit_limit=?, status=?
            WHERE id=?`,
            [supplier_name, company_name, contact_person, mobile, alt_mobile, email, gst_number, pan_number,
             address, city, state, country, pincode, bank_name, account_number, ifsc_code, upi_id,
             payment_terms, credit_days||0, credit_limit||0, status||'Active', req.params.id]);
        await logAudit(pool, 'UPDATE', 'Supplier', req.params.id, null, `Supplier ${supplier_name} updated`);
        res.json({ success: true, message: "Supplier updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating supplier", error: error.message });
    }
};

const deleteSupplier = async (req, res) => {
    const pool = getPool();
    try {
        await pool.query("DELETE FROM suppliers WHERE id=?", [req.params.id]);
        res.json({ success: true, message: "Supplier deleted successfully" });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2')
            return res.status(400).json({ success: false, message: "Cannot delete supplier with existing purchase records." });
        res.status(500).json({ success: false, message: "Error deleting supplier", error: error.message });
    }
};

/* =========================================
   PURCHASE ORDERS
========================================= */
const getAllPurchaseOrders = async (req, res) => {
    const pool = getPool();
    try {
        const [rows] = await pool.query(`
            SELECT po.*, s.supplier_name, s.supplier_code FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id=s.id ORDER BY po.id DESC`);
        res.json({ success: true, orders: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching POs", error: error.message });
    }
};

const createPurchaseOrder = async (req, res) => {
    const pool = getPool();
    const { supplier_id, expected_delivery_date, warehouse, buyer, notes, status } = req.body;
    try {
        const po_number = generateCode('PO');
        const purchase_date = new Date().toISOString().split('T')[0];
        const [result] = await pool.query(`
            INSERT INTO purchase_orders (po_number, supplier_id, purchase_date, expected_delivery_date, warehouse, buyer, status, notes)
            VALUES (?,?,?,?,?,?,?,?)`,
            [po_number, supplier_id, purchase_date, expected_delivery_date||null, warehouse||'Main Warehouse', buyer||null, status||'Pending', notes||null]);
        await logAudit(pool, 'CREATE', 'PurchaseOrder', result.insertId, po_number, `PO ${po_number} created`);
        res.json({ success: true, message: "Purchase Order created", id: result.insertId, po_number });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error creating PO", error: error.message });
    }
};

const updatePurchaseOrder = async (req, res) => {
    const pool = getPool();
    const { status, expected_delivery_date, buyer, notes } = req.body;
    try {
        await pool.query(`UPDATE purchase_orders SET status=?, expected_delivery_date=?, buyer=?, notes=? WHERE id=?`,
            [status, expected_delivery_date||null, buyer||null, notes||null, req.params.id]);
        res.json({ success: true, message: "PO updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating PO", error: error.message });
    }
};

/* =========================================
   PURCHASES (GRN / INVOICES)
========================================= */
const getAllPurchases = async (req, res) => {
    const pool = getPool();
    try {
        const [rows] = await pool.query(`
            SELECT p.*, s.supplier_name, po.po_number FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id=s.id
            LEFT JOIN purchase_orders po ON p.po_id=po.id
            ORDER BY p.id DESC`);
        res.json({ success: true, purchases: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching purchases", error: error.message });
    }
};

const getPurchaseById = async (req, res) => {
    const pool = getPool();
    try {
        const [[purchase]] = await pool.query(`
            SELECT p.*, s.supplier_name, po.po_number FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id=s.id
            LEFT JOIN purchase_orders po ON p.po_id=po.id WHERE p.id=?`, [req.params.id]);
        if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
        const [items] = await pool.query(`SELECT * FROM purchase_items WHERE purchase_id=?`, [req.params.id]);
        const [payments] = await pool.query(`SELECT * FROM purchase_payments WHERE purchase_id=? ORDER BY payment_date DESC`, [req.params.id]);
        res.json({ success: true, purchase, items, payments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching purchase", error: error.message });
    }
};

const createPurchase = async (req, res) => {
    const pool = getPool();
    const {
        supplier_id, po_id, supplier_invoice_no, invoice_date, warehouse, purchase_type,
        subtotal, discount_percent, discount_amount, tax_amount, transport_charge, other_charge, round_off, net_amount,
        paid_amount, payment_method, payment_status, due_date, transaction_number, reference_number, notes,
        items, created_by
    } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const grn_number = generateCode('GRN');
        const balance_amount = (parseFloat(net_amount) || 0) - (parseFloat(paid_amount) || 0);

        // 1. Insert purchase header
        const purchaseResult = await insertRow(connection, 'purchases', {
            purchase_number: grn_number,
            grn_number,
            po_id: po_id || null,
            supplier_id,
            supplier_invoice_no,
            invoice_date,
            warehouse: warehouse || 'Main Warehouse',
            purchase_type: purchase_type || 'Credit Purchase',
            subtotal: subtotal || 0,
            discount_percent: discount_percent || 0,
            discount_amount: discount_amount || 0,
            tax_amount: tax_amount || 0,
            transport_charge: transport_charge || 0,
            other_charge: other_charge || 0,
            round_off: round_off || 0,
            net_amount: net_amount || 0,
            paid_amount: paid_amount || 0,
            balance_amount,
            payment_method: payment_method || 'Credit',
            payment_status: payment_status || 'Unpaid',
            due_date: due_date || null,
            transaction_number: transaction_number || null,
            reference_number: reference_number || null,
            notes: notes || null,
            created_by: created_by || 'Admin'
        });

        const purchase_id = purchaseResult.insertId;

        // 2. Insert items + stock ledger
        if (items && items.length > 0) {
            for (const item of items) {
                await insertRow(connection, 'purchase_items', {
                    purchase_id,
                    product_id: item.product_id || null,
                    product_name: item.product_name,
                    barcode: item.barcode || null,
                    sku: item.sku || null,
                    batch_number: item.batch_number || null,
                    lot_number: item.lot_number || null,
                    quantity: item.quantity,
                    free_quantity: item.free_quantity || 0,
                    unit: item.unit || 'Pcs',
                    unit_price: item.unit_price,
                    landing_cost: item.landing_cost || item.unit_price,
                    discount_percent: item.discount_percent || 0,
                    discount_amount: item.discount_amount || 0,
                    tax_percent: item.tax_percent || 0,
                    tax_amount: item.tax_amount || 0,
                    mrp: item.mrp || 0,
                    selling_price: item.selling_price || 0,
                    expiry_date: item.expiry_date || null,
                    manufacturing_date: item.manufacturing_date || null,
                    total_price: item.total_price
                });

                await insertStockLedgerEntry(connection, {
                    product_id: item.product_id || null,
                    batch_number: item.batch_number || null,
                    transaction_type: 'Purchase',
                    reference_id: purchase_id,
                    reference_number: grn_number,
                    quantity: item.quantity,
                    expiry_date: item.expiry_date || null,
                    created_by: created_by || 'Admin'
                });
            }
        }

        // 3. Record payment if any paid
        if (parseFloat(paid_amount) > 0) {
            await insertRow(connection, 'purchase_payments', {
                purchase_id,
                payment_date: invoice_date,
                payment_method: payment_method || 'Cash',
                amount: paid_amount,
                transaction_number: transaction_number || null,
                reference_number: reference_number || null
            });
        }

        // 4. Update supplier outstanding balance
        if (balance_amount > 0) {
            await connection.query(`UPDATE suppliers SET outstanding_balance = outstanding_balance + ? WHERE id=?`, [balance_amount, supplier_id]);
        }

        // 5. Update PO status
        if (po_id) {
            await connection.query(`UPDATE purchase_orders SET status='Fully Received' WHERE id=?`, [po_id]);
        }

        await connection.commit();
        await logAudit(pool, 'CREATE', 'Purchase', purchase_id, grn_number, `GRN ${grn_number} created for supplier ${supplier_id}`);
        res.json({ success: true, message: "Purchase created successfully", purchase_id, grn_number });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: "Error creating purchase", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/* =========================================
   PURCHASE PAYMENTS
========================================= */
const getAllPayments = async (req, res) => {
    const pool = getPool();
    try {
        const [rows] = await pool.query(`
            SELECT pp.*, p.grn_number, p.supplier_invoice_no, p.net_amount, p.balance_amount, s.supplier_name
            FROM purchase_payments pp
            JOIN purchases p ON pp.purchase_id=p.id
            LEFT JOIN suppliers s ON p.supplier_id=s.id
            ORDER BY pp.id DESC`);
        res.json({ success: true, payments: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching payments", error: error.message });
    }
};

const addPayment = async (req, res) => {
    const pool = getPool();
    const { purchase_id, payment_date, payment_method, amount, transaction_number, reference_number, remarks, created_by } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [[purchase]] = await connection.query(`SELECT * FROM purchases WHERE id=?`, [purchase_id]);
        if (!purchase) { await connection.rollback(); return res.status(404).json({ success: false, message: "Purchase not found" }); }
        if (parseFloat(amount) > parseFloat(purchase.balance_amount)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: `Amount exceeds balance of ₹${purchase.balance_amount}` });
        }

        await insertRow(connection, 'purchase_payments', {
            purchase_id,
            payment_date,
            payment_method: payment_method || 'Cash',
            amount,
            transaction_number: transaction_number || null,
            reference_number: reference_number || null,
            remarks: remarks || null,
            created_by: created_by || 'Admin'
        });

        const newPaid = parseFloat(purchase.paid_amount) + parseFloat(amount);
        const newBalance = parseFloat(purchase.net_amount) - newPaid;
        const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
        await connection.query(`UPDATE purchases SET paid_amount=?, balance_amount=?, payment_status=? WHERE id=?`, [newPaid, newBalance, newStatus, purchase_id]);
        await connection.query(`UPDATE suppliers SET outstanding_balance = outstanding_balance - ? WHERE id=?`, [amount, purchase.supplier_id]);

        await connection.commit();
        res.json({ success: true, message: "Payment recorded", new_balance: newBalance, new_status: newStatus });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: "Error recording payment", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/* =========================================
   PURCHASE RETURNS
========================================= */
const getAllReturns = async (req, res) => {
    const pool = getPool();
    try {
        const [rows] = await pool.query(`
            SELECT pr.*, s.supplier_name, p.grn_number FROM purchase_returns pr
            LEFT JOIN suppliers s ON pr.supplier_id=s.id
            LEFT JOIN purchases p ON pr.purchase_id=p.id ORDER BY pr.id DESC`);
        res.json({ success: true, returns: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching returns", error: error.message });
    }
};

const createReturn = async (req, res) => {
    const pool = getPool();
    const { purchase_id, supplier_id, return_date, reason, notes, items, created_by } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const return_number = generateCode('PRN');
        const total_amount = (items||[]).reduce((s, i) => s + parseFloat(i.total_price||0), 0);

        const returnResult = await insertRow(connection, 'purchase_returns', {
            return_number,
            purchase_id: purchase_id || null,
            supplier_id,
            return_date,
            total_amount,
            reason,
            status: 'Pending',
            created_by: created_by || 'Admin'
        });

        const return_id = returnResult.insertId;

        for (const item of (items||[])) {
            await insertRow(connection, 'purchase_return_items', {
                purchase_return_id: return_id,
                product_id: item.product_id || null,
                quantity: item.quantity,
                return_price: item.unit_price,
                total: item.total_price
            });

            await insertStockLedgerEntry(connection, {
                product_id: item.product_id || null,
                transaction_type: 'Purchase Return',
                reference_id: return_id,
                reference_number: return_number,
                quantity: item.quantity,
                created_by: created_by || 'Admin'
            });
        }

        await connection.query(`UPDATE suppliers SET outstanding_balance = GREATEST(0, outstanding_balance - ?) WHERE id=?`, [total_amount, supplier_id]);
        await connection.commit();
        await logAudit(pool, 'CREATE', 'PurchaseReturn', return_id, return_number, `Return ${return_number} created`);
        res.json({ success: true, message: "Return created successfully", return_id, return_number });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: "Error creating return", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/* =========================================
   REPORTS
========================================= */
const getPurchaseReport = async (req, res) => {
    const pool = getPool();
    const { from, to, supplier_id, payment_status, purchase_type } = req.query;
    try {
        let where = ['1=1'];
        const params = [];
        if (from) { where.push('p.invoice_date >= ?'); params.push(from); }
        if (to) { where.push('p.invoice_date <= ?'); params.push(to); }
        if (supplier_id) { where.push('p.supplier_id = ?'); params.push(supplier_id); }
        if (payment_status) { where.push('p.payment_status = ?'); params.push(payment_status); }
        if (purchase_type) { where.push('p.purchase_type = ?'); params.push(purchase_type); }

        const [rows] = await pool.query(`
            SELECT p.*, s.supplier_name FROM purchases p
            LEFT JOIN suppliers s ON p.supplier_id=s.id
            WHERE ${where.join(' AND ')} ORDER BY p.invoice_date DESC`, params);

        const totalAmount = rows.reduce((s, r) => s + parseFloat(r.net_amount||0), 0);
        const totalPaid = rows.reduce((s, r) => s + parseFloat(r.paid_amount||0), 0);
        const totalBalance = rows.reduce((s, r) => s + parseFloat(r.balance_amount||0), 0);

        res.json({ success: true, data: rows, summary: { count: rows.length, totalAmount, totalPaid, totalBalance } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error generating report", error: error.message });
    }
};

const getStockLedger = async (req, res) => {
    const pool = getPool();
    const { product_id, from, to } = req.query;
    try {
        let where = ['1=1'];
        const params = [];
        if (product_id) { where.push('sl.product_id=?'); params.push(product_id); }
        if (from) { where.push('DATE(sl.created_at)>=?'); params.push(from); }
        if (to) { where.push('DATE(sl.created_at)<=?'); params.push(to); }
        const [rows] = await pool.query(`
            SELECT sl.*, pr.title as product_name FROM stock_ledger sl
            LEFT JOIN products pr ON sl.product_id=pr.id
            WHERE ${where.join(' AND ')} ORDER BY sl.created_at DESC LIMIT 500`, params);
        res.json({ success: true, ledger: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching stock ledger", error: error.message });
    }
};

/* =========================================
   EXCEL EXPORT
========================================= */
const exportPurchasesExcel = async (req, res) => {
    const pool = getPool();
    try {
        const XLSX = require('xlsx');
        const [rows] = await pool.query(`
            SELECT p.grn_number as 'GRN Number', s.supplier_name as 'Supplier', p.supplier_invoice_no as 'Invoice No',
                   p.invoice_date as 'Date', p.net_amount as 'Net Amount', p.paid_amount as 'Paid Amount',
                   p.balance_amount as 'Balance', p.payment_status as 'Payment Status', p.purchase_type as 'Type'
            FROM purchases p LEFT JOIN suppliers s ON p.supplier_id=s.id ORDER BY p.id DESC`);

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename="purchases.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (error) {
        res.status(500).json({ success: false, message: "Export error", error: error.message });
    }
};

const exportSuppliersExcel = async (req, res) => {
    const pool = getPool();
    try {
        const XLSX = require('xlsx');
        const [rows] = await pool.query(`SELECT supplier_code, supplier_name, company_name, mobile, email, gst_number, city, state, credit_limit, outstanding_balance, status FROM suppliers ORDER BY supplier_name`);
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename="suppliers.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (error) {
        res.status(500).json({ success: false, message: "Export error", error: error.message });
    }
};

/* =========================================
   AUDIT LOGS
========================================= */
const getAuditLogs = async (req, res) => {
    const pool = getPool();
    try {
        const [rows] = await pool.query(`SELECT * FROM purchase_audit_logs ORDER BY id DESC LIMIT 200`);
        res.json({ success: true, logs: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching audit logs", error: error.message });
    }
};

module.exports = {
    initPurchaseTables,
    getDashboardStats,
    getAllSuppliers, getSupplierById, addSupplier, updateSupplier, deleteSupplier,
    getAllPurchaseOrders, createPurchaseOrder, updatePurchaseOrder,
    getAllPurchases, getPurchaseById, createPurchase,
    getAllPayments, addPayment,
    getAllReturns, createReturn,
    getPurchaseReport, getStockLedger,
    exportPurchasesExcel, exportSuppliersExcel,
    getAuditLogs
};
