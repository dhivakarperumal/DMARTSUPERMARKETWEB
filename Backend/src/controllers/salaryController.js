const { getPool } = require("../config/db");

/* ─────────────────────────────────────────────
   TABLE BOOTSTRAP
───────────────────────────────────────────── */
const ensureSalaryTables = async () => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS employee_salary (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        employee_id       INT NOT NULL,
        salary_month      VARCHAR(7) NOT NULL,
        basic_salary      DECIMAL(12,2) DEFAULT 0,
        hra               DECIMAL(12,2) DEFAULT 0,
        da                DECIMAL(12,2) DEFAULT 0,
        travel_allowance  DECIMAL(12,2) DEFAULT 0,
        medical_allowance DECIMAL(12,2) DEFAULT 0,
        incentive         DECIMAL(12,2) DEFAULT 0,
        bonus             DECIMAL(12,2) DEFAULT 0,
        overtime_amount   DECIMAL(12,2) DEFAULT 0,
        other_allowances  DECIMAL(12,2) DEFAULT 0,
        pf                DECIMAL(12,2) DEFAULT 0,
        esi               DECIMAL(12,2) DEFAULT 0,
        professional_tax  DECIMAL(12,2) DEFAULT 0,
        loan_deduction    DECIMAL(12,2) DEFAULT 0,
        advance_salary    DECIMAL(12,2) DEFAULT 0,
        leave_deduction   DECIMAL(12,2) DEFAULT 0,
        other_deductions  DECIMAL(12,2) DEFAULT 0,
        gross_salary      DECIMAL(12,2) GENERATED ALWAYS AS (
          basic_salary + hra + da + travel_allowance + medical_allowance +
          incentive + bonus + overtime_amount + other_allowances
        ) STORED,
        total_deductions  DECIMAL(12,2) GENERATED ALWAYS AS (
          pf + esi + professional_tax + loan_deduction +
          advance_salary + leave_deduction + other_deductions
        ) STORED,
        net_salary        DECIMAL(12,2) GENERATED ALWAYS AS (
          (basic_salary + hra + da + travel_allowance + medical_allowance +
           incentive + bonus + overtime_amount + other_allowances) -
          (pf + esi + professional_tax + loan_deduction +
           advance_salary + leave_deduction + other_deductions)
        ) STORED,
        working_days      INT DEFAULT 26,
        present_days      INT DEFAULT 0,
        leave_days        INT DEFAULT 0,
        overtime_hours    DECIMAL(5,2) DEFAULT 0,
        status            ENUM('Pending','Processing','Paid') DEFAULT 'Pending',
        payment_date      DATE DEFAULT NULL,
        payment_method    VARCHAR(50) DEFAULT NULL,
        payment_reference VARCHAR(100) DEFAULT NULL,
        remarks           TEXT DEFAULT NULL,
        created_by        VARCHAR(100) DEFAULT NULL,
        updated_by        VARCHAR(100) DEFAULT NULL,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_emp_month (employee_id, salary_month),
        INDEX idx_month (salary_month)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } finally {
    conn.release();
  }
};

/* ─────────────────────────────────────────────
   SALARY DASHBOARD SUMMARY
───────────────────────────────────────────── */
exports.getSalarySummary = async (req, res) => {
  try {
    await ensureSalaryTables();
    const pool = getPool();
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const [summary] = await pool.query(`
      SELECT
        COUNT(*) AS total_employees,
        COALESCE(SUM(net_salary), 0) AS total_payroll,
        COALESCE(SUM(CASE WHEN status='Paid' THEN net_salary END), 0) AS paid_amount,
        COALESCE(SUM(CASE WHEN status='Pending' THEN net_salary END), 0) AS pending_amount,
        COUNT(CASE WHEN status='Paid' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN status='Pending' THEN 1 END) AS pending_count
      FROM employee_salary WHERE salary_month=?
    `, [targetMonth]);

    res.json({ success: true, data: summary[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET ALL SALARY RECORDS
───────────────────────────────────────────── */
exports.getSalaries = async (req, res) => {
  try {
    await ensureSalaryTables();
    const pool = getPool();
    const { month, employee_id, status, department } = req.query;

    let where = "WHERE 1=1";
    const params = [];
    if (month)       { where += " AND s.salary_month=?";  params.push(month); }
    if (employee_id) { where += " AND s.employee_id=?";   params.push(employee_id); }
    if (status)      { where += " AND s.status=?";        params.push(status); }
    if (department)  { where += " AND e.role=?";          params.push(department); }

    const [rows] = await pool.query(`
      SELECT s.*, e.name AS employee_name, e.role AS department,
             e.photo AS employee_photo, e.shift
      FROM employee_salary s
      JOIN employees e ON e.id=s.employee_id
      ${where}
      ORDER BY s.salary_month DESC, e.name ASC
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   AUTO-CALCULATE SALARY FROM ATTENDANCE
───────────────────────────────────────────── */
exports.calculateSalary = async (req, res) => {
  try {
    await ensureSalaryTables();
    const pool = getPool();
    const { salary_month } = req.body;
    if (!salary_month) return res.status(400).json({ success: false, message: "salary_month required" });

    // Get all active employees
    const [employees] = await pool.query("SELECT * FROM employees WHERE status='active'");

    // Get attendance summary for the month
    const [attRows] = await pool.query(`
      SELECT employee_id,
        COUNT(CASE WHEN status='Present'  THEN 1 END) AS present_days,
        COUNT(CASE WHEN status='Leave'    THEN 1 END) AS leave_days,
        COALESCE(SUM(overtime_hours), 0)              AS overtime_hours
      FROM employee_attendance
      WHERE DATE_FORMAT(date,'%Y-%m')=?
      GROUP BY employee_id
    `, [salary_month]);

    const attMap = {};
    attRows.forEach(a => { attMap[a.employee_id] = a; });

    const conn = await pool.getConnection();
    await conn.beginTransaction();
    let created = 0;
    try {
      for (const emp of employees) {
        const att = attMap[emp.id] || { present_days: 0, leave_days: 0, overtime_hours: 0 };
        const baseSalary = parseFloat(emp.salary || 0);
        const workingDays = 26;
        const dailyRate = baseSalary / workingDays;
        const presentDays = parseInt(att.present_days) || 0;
        const overtimeHours = parseFloat(att.overtime_hours) || 0;
        const overtimeRate = (dailyRate / 8) * 1.5;
        const overtimeAmount = parseFloat((overtimeHours * overtimeRate).toFixed(2));

        // Basic proportional salary
        const earnedBasic = parseFloat(((baseSalary / workingDays) * presentDays).toFixed(2));
        const hra = parseFloat((earnedBasic * 0.4).toFixed(2));
        const da  = parseFloat((earnedBasic * 0.1).toFixed(2));

        // Standard deductions
        const pf = parseFloat((earnedBasic * 0.12).toFixed(2));
        const esi = earnedBasic > 21000 ? 0 : parseFloat((earnedBasic * 0.0075).toFixed(2));
        const profTax = 200;

        await conn.query(`
          INSERT INTO employee_salary
            (employee_id, salary_month, basic_salary, hra, da, overtime_amount,
             pf, esi, professional_tax, working_days, present_days, leave_days, overtime_hours)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            basic_salary=VALUES(basic_salary), hra=VALUES(hra), da=VALUES(da),
            overtime_amount=VALUES(overtime_amount),
            pf=VALUES(pf), esi=VALUES(esi), professional_tax=VALUES(professional_tax),
            working_days=VALUES(working_days), present_days=VALUES(present_days),
            leave_days=VALUES(leave_days), overtime_hours=VALUES(overtime_hours),
            updated_at=NOW()
        `, [
          emp.id, salary_month, earnedBasic, hra, da, overtimeAmount,
          pf, esi, profTax, workingDays, presentDays, att.leave_days||0, overtimeHours
        ]);
        created++;
      }
      await conn.commit();
      res.json({ success: true, message: `Salary calculated for ${created} employees` });
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
   CREATE / UPDATE SALARY RECORD (manual)
───────────────────────────────────────────── */
exports.saveSalary = async (req, res) => {
  try {
    await ensureSalaryTables();
    const pool = getPool();
    const d = req.body;

    const fields = [
      "employee_id","salary_month","basic_salary","hra","da",
      "travel_allowance","medical_allowance","incentive","bonus",
      "overtime_amount","other_allowances",
      "pf","esi","professional_tax","loan_deduction",
      "advance_salary","leave_deduction","other_deductions",
      "working_days","present_days","leave_days","overtime_hours","remarks"
    ];

    const values = fields.map(f => d[f] !== undefined ? d[f] : 0);

    await pool.query(`
      INSERT INTO employee_salary (${fields.join(",")})
      VALUES (${fields.map(() => "?").join(",")})
      ON DUPLICATE KEY UPDATE
        ${fields.slice(2).map(f => `${f}=VALUES(${f})`).join(",")},
        updated_at=NOW()
    `, values);

    res.json({ success: true, message: "Salary saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   MARK AS PAID
───────────────────────────────────────────── */
exports.paySalary = async (req, res) => {
  try {
    await ensureSalaryTables();
    const pool = getPool();
    const { id } = req.params;
    const { payment_method, payment_reference, payment_date, remarks } = req.body;

    await pool.query(`
      UPDATE employee_salary
      SET status='Paid', payment_method=?, payment_reference=?,
          payment_date=?, remarks=?, updated_at=NOW()
      WHERE id=?
    `, [payment_method||'Cash', payment_reference||null,
        payment_date||new Date().toISOString().slice(0,10), remarks||null, id]);

    res.json({ success: true, message: "Salary marked as paid" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   PAYSLIP DATA (single record with employee)
───────────────────────────────────────────── */
exports.getPayslip = async (req, res) => {
  try {
    await ensureSalaryTables();
    const pool = getPool();
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT s.*, e.name, e.email, e.phone, e.role AS department,
             e.joining_date, e.shift, e.photo, e.salary AS base_salary,
             e.address, e.id AS emp_db_id
      FROM employee_salary s
      JOIN employees e ON e.id=s.employee_id
      WHERE s.id=?
    `, [id]);

    if (!rows.length) return res.status(404).json({ success: false, message: "Payslip not found" });

    // Attendance for that month
    const row = rows[0];
    const [att] = await pool.query(`
      SELECT
        COUNT(CASE WHEN status='Present'  THEN 1 END) AS present_days,
        COUNT(CASE WHEN status='Leave'    THEN 1 END) AS leave_days,
        COALESCE(SUM(overtime_hours),0) AS overtime_hours
      FROM employee_attendance
      WHERE employee_id=? AND DATE_FORMAT(date,'%Y-%m')=?
    `, [row.employee_id, row.salary_month]);

    res.json({ success: true, data: { ...row, attendance: att[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE SALARY RECORD
───────────────────────────────────────────── */
exports.deleteSalary = async (req, res) => {
  try {
    await ensureSalaryTables();
    await getPool().query("DELETE FROM employee_salary WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Salary record deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
