const { getPool } = require("../config/db");

/* ─────────────────────────────────────────────
   TABLE BOOTSTRAP
───────────────────────────────────────────── */
const ensureLeaveTables = async () => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS employee_leave_types (
        id    INT AUTO_INCREMENT PRIMARY KEY,
        name  VARCHAR(100) NOT NULL,
        total_days_per_year INT DEFAULT 12,
        is_paid TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default leave types if empty
    const [lt] = await conn.query("SELECT COUNT(*) AS cnt FROM employee_leave_types");
    if (Number(lt[0].cnt) === 0) {
      await conn.query(`
        INSERT INTO employee_leave_types (name, total_days_per_year, is_paid) VALUES
        ('Casual Leave', 12, 1),
        ('Sick Leave', 6, 1),
        ('Paid Leave', 15, 1),
        ('Unpaid Leave', 0, 0)
      `);
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS employee_leave (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        employee_id    INT NOT NULL,
        leave_type_id  INT NOT NULL,
        from_date      DATE NOT NULL,
        to_date        DATE NOT NULL,
        total_days     DECIMAL(4,1) DEFAULT 1,
        reason         TEXT DEFAULT NULL,
        status         ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
        approved_by    VARCHAR(100) DEFAULT NULL,
        rejection_note TEXT DEFAULT NULL,
        created_by     VARCHAR(100) DEFAULT NULL,
        updated_by     VARCHAR(100) DEFAULT NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_emp  (employee_id),
        INDEX idx_date (from_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } finally {
    conn.release();
  }
};

/* ─────────────────────────────────────────────
   LEAVE TYPES
───────────────────────────────────────────── */
exports.getLeaveTypes = async (req, res) => {
  try {
    await ensureLeaveTables();
    const [rows] = await getPool().query("SELECT * FROM employee_leave_types ORDER BY id");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET LEAVE REQUESTS
───────────────────────────────────────────── */
exports.getLeaves = async (req, res) => {
  try {
    await ensureLeaveTables();
    const pool = getPool();
    const { employee_id, status, month, year } = req.query;

    let where = "WHERE 1=1";
    const params = [];
    if (employee_id) { where += " AND l.employee_id=?"; params.push(employee_id); }
    if (status)      { where += " AND l.status=?";      params.push(status); }
    if (month && year) { where += " AND MONTH(l.from_date)=? AND YEAR(l.from_date)=?"; params.push(month, year); }

    const [rows] = await pool.query(`
      SELECT l.*, e.name AS employee_name, e.role AS department,
             lt.name AS leave_type_name, lt.is_paid
      FROM employee_leave l
      JOIN employees e  ON e.id=l.employee_id
      JOIN employee_leave_types lt ON lt.id=l.leave_type_id
      ${where}
      ORDER BY l.created_at DESC
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   CREATE LEAVE REQUEST
───────────────────────────────────────────── */
exports.createLeave = async (req, res) => {
  try {
    await ensureLeaveTables();
    const pool = getPool();
    const { employee_id, leave_type_id, from_date, to_date, total_days, reason } = req.body;

    if (!employee_id || !leave_type_id || !from_date || !to_date) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const days = total_days || Math.ceil((new Date(to_date) - new Date(from_date)) / 86400000) + 1;

    const [result] = await pool.query(`
      INSERT INTO employee_leave (employee_id, leave_type_id, from_date, to_date, total_days, reason)
      VALUES (?,?,?,?,?,?)
    `, [employee_id, leave_type_id, from_date, to_date, days, reason||null]);

    res.status(201).json({ success: true, message: "Leave request submitted", id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   UPDATE LEAVE (approve / reject / edit)
───────────────────────────────────────────── */
exports.updateLeave = async (req, res) => {
  try {
    await ensureLeaveTables();
    const pool = getPool();
    const { id } = req.params;
    const { status, rejection_note, approved_by, from_date, to_date, total_days, reason, leave_type_id } = req.body;

    const sets = [];
    const vals = [];
    if (status)         { sets.push("status=?");         vals.push(status); }
    if (rejection_note) { sets.push("rejection_note=?"); vals.push(rejection_note); }
    if (approved_by)    { sets.push("approved_by=?");    vals.push(approved_by); }
    if (from_date)      { sets.push("from_date=?");      vals.push(from_date); }
    if (to_date)        { sets.push("to_date=?");        vals.push(to_date); }
    if (total_days)     { sets.push("total_days=?");     vals.push(total_days); }
    if (reason)         { sets.push("reason=?");         vals.push(reason); }
    if (leave_type_id)  { sets.push("leave_type_id=?");  vals.push(leave_type_id); }

    if (!sets.length) return res.status(400).json({ success: false, message: "Nothing to update" });
    vals.push(id);

    await pool.query(`UPDATE employee_leave SET ${sets.join(",")}, updated_at=NOW() WHERE id=?`, vals);
    res.json({ success: true, message: "Leave updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE LEAVE REQUEST
───────────────────────────────────────────── */
exports.deleteLeave = async (req, res) => {
  try {
    await ensureLeaveTables();
    await getPool().query("DELETE FROM employee_leave WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Leave deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   LEAVE BALANCE PER EMPLOYEE
───────────────────────────────────────────── */
exports.getLeaveBalance = async (req, res) => {
  try {
    await ensureLeaveTables();
    const pool = getPool();
    const { employeeId } = req.params;
    const year = new Date().getFullYear();

    const [types] = await pool.query("SELECT * FROM employee_leave_types");
    const [used] = await pool.query(`
      SELECT leave_type_id, SUM(total_days) AS used_days
      FROM employee_leave
      WHERE employee_id=? AND status='Approved' AND YEAR(from_date)=?
      GROUP BY leave_type_id
    `, [employeeId, year]);

    const usedMap = {};
    used.forEach(u => { usedMap[u.leave_type_id] = parseFloat(u.used_days || 0); });

    const balance = types.map(t => ({
      ...t,
      used_days: usedMap[t.id] || 0,
      remaining: t.total_days_per_year - (usedMap[t.id] || 0),
    }));

    res.json({ success: true, data: balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
