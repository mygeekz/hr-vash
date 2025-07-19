// backend/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ خطا در اتصال:', err.message);
    else console.log('✅ اتصال موفق به SQLite');
});

/* ------------------------------------------------------------------ */
/* ایجاد یا به‌روزرسانی جداول                                          */
/* ------------------------------------------------------------------ */
db.serialize(() => {
    // برای محیط توسعه: حذف جدول کاربران جهت بازسازی ساختار جدید
    db.run(`DROP TABLE IF EXISTS users`);

    // جدول اعلان‌ها
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        isRead BOOLEAN NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        type TEXT NOT NULL
      )
    `);

    // جدول اصلی کارمندان
    db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id               TEXT PRIMARY KEY,
        fullName         TEXT,
        nationalId       TEXT,
        jobTitle         TEXT,
        department       TEXT,
        branch           TEXT,
        contactNumber    TEXT,
        email            TEXT,
        gender           TEXT,
        militaryStatus   TEXT,
        monthlySalary    INTEGER,
        status           TEXT,
        dateJoined       TEXT,
        dateOfBirth      TEXT,
        photo            TEXT,
        additionalNotes  TEXT
      )
    `);

    // جدول مدارک کارمندان
    db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id            TEXT PRIMARY KEY,
        employeeId    TEXT NOT NULL,
        fileName      TEXT NOT NULL,
        filePath      TEXT NOT NULL,
        fileType      TEXT,
        uploadDate    TEXT NOT NULL,
        FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // جدول کاربران با ساختار جدید (username به جای mobile/email)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        fullName      TEXT NOT NULL,
        username      TEXT UNIQUE NOT NULL,
        password      TEXT NOT NULL,
        role          TEXT NOT NULL,
        isActive      BOOLEAN NOT NULL DEFAULT 1,
        createdAt     TEXT NOT NULL
      )
    `);

    /* ستون‌های سازگاری برای نسخه‌های قدیمی */
    const addColumn = (tableName, columnName, type) => {
        db.run(
          `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${type}`,
          [],
          (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error(`Error adding column ${columnName} to ${tableName}:`, err);
            }
          }
        );
    };

    db.all(`PRAGMA table_info(employees)`, (err, existingColumns) => {
        if (err || !existingColumns) {
            console.error("Error fetching employees table info:", err);
            return;
        }
        const columnsToAdd = [
            ['nationalId', 'TEXT'],
            ['branch', 'TEXT'],
            ['gender', 'TEXT'],
            ['militaryStatus', 'TEXT'],
            ['monthlySalary', 'INTEGER'],
            ['additionalNotes', 'TEXT'],
            ['dateOfBirth', 'TEXT']
        ];
        columnsToAdd.forEach(([c, t]) => {
            if (!existingColumns.some(col => col.name === c)) {
                addColumn('employees', c, t);
            }
        });
    });

    // جدول تسک‌ها
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id            TEXT PRIMARY KEY,
        employeeName  TEXT,
        description   TEXT,
        assignedDate  TEXT,
        dueDate       TEXT,
        status        TEXT,
        priority      TEXT,
        department    TEXT,
        completedDate TEXT
      )
    `);

    // جدول درخواست‌ها
    db.run(`
      CREATE TABLE IF NOT EXISTS requests (
        id             TEXT PRIMARY KEY,
        employeeName   TEXT,
        employeeId     TEXT,
        requestType    TEXT,
        status         TEXT,
        priority       TEXT,
        submissionDate TEXT,
        startDate      TEXT,
        endDate        TEXT,
        amount         INTEGER,
        description    TEXT,
        reason         TEXT,
        attachments    TEXT,
        comments       TEXT,
        history        TEXT
      )
    `);

    // جداول شعب، سمت‌ها و بخش‌ها
    db.run(`
      CREATE TABLE IF NOT EXISTS branches (
        id        TEXT PRIMARY KEY,
        name      TEXT NOT NULL UNIQUE,
        managerId TEXT,
        FOREIGN KEY (managerId) REFERENCES employees(id) ON DELETE SET NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS positions (
        id      TEXT PRIMARY KEY,
        title   TEXT NOT NULL UNIQUE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id      TEXT PRIMARY KEY,
        name    TEXT NOT NULL UNIQUE
      )
    `);
});

module.exports = db;
