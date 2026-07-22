const { getPool } = require("../config/db");

/* ─────────────────────────────────────────────
   TABLE BOOTSTRAP (called lazily)
───────────────────────────────────────────── */
const ensureAttendanceTables = async () => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS employee_attendance (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        employee_id     INT NOT NULL,
        date            DATE NOT NULL,
        check_in        TIME DEFAULT NULL,
        check_out       TIME DEFAULT NULL,
        working_hours   DECIMAL(5,2) DEFAULT 0,
        overtime_hours  DECIMAL(5,2) DEFAULT 0,
        status          ENUM('Present','Absent','Half Day','Leave','Weekly Off','Holiday') DEFAULT 'Absent',
        late_entry      TINYINT(1) DEFAULT 0,
        early_exit      TINYINT(1) DEFAULT 0,
        remarks         TEXT DEFAULT NULL,
        created_by      VARCHAR(100) DEFAULT NULL,
        updated_by      VARCHAR(100) DEFAULT NULL,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_emp_date (employee_id, date),
        INDEX idx_date (date),
        INDEX idx_emp  (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } finally {
    conn.release();
  }
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const calcWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const [ih, im] = checkIn.split(":").map(Number);
  const [oh, om] = checkOut.split(":").map(Number);
  const diff = (oh * 60 + om) - (ih * 60 + im);
  return Math.max(0, parseFloat((diff / 60).toFixed(2)));
};

const calcOvertime = (workingHours, shiftHours = 8) => {
  return Math.max(0, parseFloat((workingHours - shiftHours).toFixed(2)));
};

/* ─────────────────────────────────────────────
   GET TODAY'S ATTENDANCE DASHBOARD
───────────────────────────────────────────── */
exports.getAttendanceToday = async (req, res) => {
  try {
    await ensureAttendanceTables();
    const pool = getPool();
    const today = new Date().toISOString().slice(0, 10);

    const [summary] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM employees WHERE status='active') AS total_employees,
        COUNT(CASE WHEN a.status='Present' THEN 1 END)    AS present,
        COUNT(CASE WHEN a.status='Absent'  THEN 1 END)    AS absent,
        COUNT(CASE WHEN a.status='Leave'   THEN 1 END)    AS on_leave,
        COUNT(CASE WHEN a.status='Half Day' THEN 1 END)   AS half_day,
        COUNT(CASE WHEN a.late_entry=1     THEN 1 END)    AS late_entries
      FROM employees e
      LEFT JOIN employee_attendance a ON a.employee_id=e.id AND a.date=?
      WHERE e.status='active'
    `, [today]);

    res.json({ success: true, data: summary[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET ATTENDANCE LIST (daily + history)
───────────────────────────────────────────── */
exports.getAttendance = async (req, res) => {
  try {
    await ensureAttendanceTables();
    const pool = getPool();
    const { date, employee_id, month, status, department } = req.query;

    let where = "WHERE 1=1";
    const params = [];

    if (date)        { where += " AND a.date=?";                  params.push(date); }
    if (month)       { where += " AND DATE_FORMAT(a.date,'%Y-%m')=?"; params.push(month); }
    if (employee_id) { where += " AND a.employee_id=?";           params.push(employee_id); }
    if (status)      { where += " AND a.status=?";                params.push(status); }
    if (department)  { where += " AND e.role=?";                  params.push(department); }

    const [rows] = await pool.query(`
      SELECT a.*, e.name AS employee_name, e.role AS department,
             e.shift, e.time_in AS shift_start, e.time_out AS shift_end,
             e.photo AS employee_photo
      FROM employee_attendance a
      JOIN employees e ON e.id=a.employee_id
      ${where}
      ORDER BY a.date DESC, e.name ASC
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET EMPLOYEES FOR ATTENDANCE MARKING (date)
───────────────────────────────────────────── */
exports.getEmployeesForDate = async (req, res) => {
  try {
    await ensureAttendanceTables();
    const pool = getPool();
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const [rows] = await pool.query(`
      SELECT
        e.id, e.name, e.role AS department, e.shift,
        e.time_in AS shift_start, e.time_out AS shift_end, e.photo,
        a.id      AS att_id,
        a.check_in, a.check_out,
        a.working_hours, a.overtime_hours,
        a.status, a.late_entry, a.early_exit, a.remarks
      FROM employees e
      LEFT JOIN employee_attendance a ON a.employee_id=e.id AND a.date=?
      WHERE e.status='active'
      ORDER BY e.name ASC
    `, [targetDate]);

    res.json({ success: true, data: rows, date: targetDate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   MARK / UPDATE SINGLE ATTENDANCE
───────────────────────────────────────────── */
exports.markAttendance = async (req, res) => {
  try {
    await ensureAttendanceTables();
    const pool = getPool();
    const {
      employee_id, date, check_in, check_out,
      status = "Present", remarks,
    } = req.body;

    if (!employee_id || !date) {
      return res.status(400).json({ success: false, message: "employee_id and date are required" });
    }

    const working_hours  = calcWorkingHours(check_in, check_out);
    const overtime_hours = calcOvertime(working_hours);

    // Detect late entry vs shift start
    let late_entry = 0;
    const [emp] = await pool.query("SELECT time_in FROM employees WHERE id=?", [employee_id]);
    if (emp.length && check_in && emp[0].time_in) {
      const [sh, sm] = emp[0].time_in.split(":").map(Number);
      const [ch, cm] = check_in.split(":").map(Number);
      if (ch * 60 + cm > sh * 60 + sm + 15) late_entry = 1;
    }

    await pool.query(`
      INSERT INTO employee_attendance
        (employee_id, date, check_in, check_out, working_hours, overtime_hours, status, late_entry, remarks)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        check_in=VALUES(check_in), check_out=VALUES(check_out),
        working_hours=VALUES(working_hours), overtime_hours=VALUES(overtime_hours),
        status=VALUES(status), late_entry=VALUES(late_entry), remarks=VALUES(remarks),
        updated_at=NOW()
    `, [employee_id, date, check_in||null, check_out||null,
        working_hours, overtime_hours, status, late_entry, remarks||null]);

    res.json({ success: true, message: "Attendance marked" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   BULK MARK ATTENDANCE
───────────────────────────────────────────── */
exports.bulkMarkAttendance = async (req, res) => {
  try {
    await ensureAttendanceTables();
    const pool = getPool();
    const { date, records } = req.body; // records: [{employee_id, status, check_in, check_out}]

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: "date and records[] required" });
    }

    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      for (const r of records) {
        const wh = calcWorkingHours(r.check_in, r.check_out);
        const ot = calcOvertime(wh);
        await conn.query(`
          INSERT INTO employee_attendance
            (employee_id, date, check_in, check_out, working_hours, overtime_hours, status, remarks)
          VALUES (?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            check_in=VALUES(check_in), check_out=VALUES(check_out),
            working_hours=VALUES(working_hours), overtime_hours=VALUES(overtime_hours),
            status=VALUES(status), remarks=VALUES(remarks), updated_at=NOW()
        `, [r.employee_id, date, r.check_in||null, r.check_out||null, wh, ot, r.status||'Absent', r.remarks||null]);
      }
      await conn.commit();
      res.json({ success: true, message: `${records.length} attendance records saved` });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   MONTHLY SUMMARY PER EMPLOYEE
───────────────────────────────────────────── */
exports.getMonthlySummary = async (req, res) => {
  try {
    await ensureAttendanceTables();
    const pool = getPool();
    const { month } = req.query; // YYYY-MM

    const [rows] = await pool.query(`
      SELECT
        e.id AS employee_id, e.name, e.role AS department,
        COUNT(CASE WHEN a.status='Present'   THEN 1 END) AS present_days,
        COUNT(CASE WHEN a.status='Absent'    THEN 1 END) AS absent_days,
        COUNT(CASE WHEN a.status='Half Day'  THEN 1 END) AS half_days,
        COUNT(CASE WHEN a.status='Leave'     THEN 1 END) AS leave_days,
        COUNT(CASE WHEN a.status='Weekly Off' THEN 1 END) AS weekly_off,
        COALESCE(SUM(a.working_hours), 0)  AS total_working_hours,
        COALESCE(SUM(a.overtime_hours), 0) AS total_overtime,
        COUNT(CASE WHEN a.late_entry=1 THEN 1 END) AS late_entries
      FROM employees e
      LEFT JOIN employee_attendance a
        ON a.employee_id=e.id
        AND (? IS NULL OR DATE_FORMAT(a.date,'%Y-%m')=?)
      WHERE e.status='active'
      GROUP BY e.id
      ORDER BY e.name ASC
    `, [month||null, month||null]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
