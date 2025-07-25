/* ------------------------------------------------------------------ */
/* وابستگی‌ها                                                          */
/* ------------------------------------------------------------------ */
const express = require("express");
const cors = require("cors");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { spawn } = require('child_process');
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key"; // کلید محرمانه برای JWT

/* ------------------------------------------------------------------ */
/* تنظیمات عمومی                                                       */
/* ------------------------------------------------------------------ */
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json({ limit: '10mb' })); // افزایش حجم برای ارسال محتوای حجیم
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ------------------------------------------------------------------ */
/* اطمینان از وجود جداول مورد نیاز                                    */
/* ------------------------------------------------------------------ */
try {
  db.run(
    `CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        employeeId TEXT UNIQUE,
        data TEXT,
        createdAt TEXT,
        updatedAt TEXT
     )`
  );
} catch (e) {
  console.error("⚠️  CREATE TABLE contracts failed:", e.message);
}
// --------------------------------- Sales tables ---------------------------------
try {
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoiceNo TEXT,
      customer TEXT,
      branch TEXT,
      seller TEXT,
      amount REAL,      -- مبلغ قبل از مالیات/تخفیف
      tax REAL,         -- مالیات
      discount REAL,    -- تخفیف
      total REAL,       -- مبلغ نهایی پرداختی
      notes TEXT,
      date TEXT,        -- تاریخ فاکتور (ISO: 2025-07-24 10:20:00)
      createdAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      saleId TEXT,
      product TEXT,
      qty REAL,
      unitPrice REAL,
      total REAL,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
    )
  `);
} catch (e) {
  console.error("⚠️  CREATE TABLE sales failed:", e.message);
}

/* ------------------------------------------------------------------ */
/* بارگذاری فایل‌ها (عکس و ضمائم)                                     */
/* ------------------------------------------------------------------ */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, uniqueSuffix + "-" + originalName.replace(/\s/g, "_"));
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static(uploadDir));

/* ================================================================== */
/* API ROUTES                                                         */
/* ================================================================== */

/* --------------------------------- Auth API --------------------------------- */
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "نام کاربری و رمز عبور الزامی است." });
  }

  const sql = `SELECT * FROM users WHERE username = ?`;
  db.get(sql, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "خطای داخلی سرور" });
    }
    if (!user) {
      return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "حساب کاربری شما غیرفعال است." });
    }

    // مقایسه رمز عبور وارد شده با هش ذخیره شده
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: "خطا در پردازش ورود" });
      }
      if (!isMatch) {
        return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
      }

      // ایجاد توکن JWT
      const { password: _pw, ...userData } = user; // حذف password از پاسخ
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: "1h" }); // توکن برای یک ساعت معتبر است

      res.json({
        message: "ورود موفقیت آمیز بود",
        user: userData,
        token,
      });
    });
  });
});

/* --------------------------------- Auth Middleware --------------------------------- */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // اگر توکن وجود نداشت
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // اگر توکن نامعتبر بود
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "دسترسی غیرمجاز. این عملیات مخصوص مدیران است." });
  }
  next();
};

const createNotification = (userId, title, body, type = "default") => {
  const createdAt = new Date().toISOString();
  const sql = `INSERT INTO notifications (userId, title, body, isRead, createdAt, type) VALUES (?, ?, ?, ?, ?, ?)`;

  const finalUserId = userId || "system";

  db.run(sql, [finalUserId, title, body, 0, createdAt, type], (err) => {
    if (err) {
      console.error("خطا در ثبت اعلان:", err.message);
    }
  });
};

/* --------------------------------- Dashboard API --------------------------------- */
app.get("/api/dashboard/stats", authenticateToken, (req, res) => {
  const promises = [
    new Promise((resolve, reject) =>
      db.get("SELECT COUNT(*) as count FROM employees", [], (err, row) =>
        err ? reject(err) : resolve(row.count)
      )
    ),
    new Promise((resolve, reject) =>
      db.get(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'تکمیل شده'",
        [],
        (err, row) => (err ? reject(err) : resolve(row.count))
      )
    ),
    new Promise((resolve, reject) =>
      db.get(
        "SELECT COUNT(*) as count FROM tasks WHERE status != 'تکمیل شده'",
        [],
        (err, row) => (err ? reject(err) : resolve(row.count))
      )
    ),
    new Promise((resolve, reject) =>
      db.all(
        "SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 5",
        [],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    ),
  ];

  Promise.all(promises)
    .then(([totalEmployees, completedTasks, pendingTasks, recentActivities]) => {
      res.json({
        totalEmployees,
        completedTasks,
        pendingTasks,
        recentActivities,
      });
    })
    .catch((err) => {
      console.error("Error fetching dashboard stats:", err);
      res.status(500).json({ error: "خطا در دریافت آمار داشبورد" });
    });
});

/* --------------------------------- Employees API --------------------------------- */
app.get("/api/employees", (_, res) => {
  db.all(`SELECT * FROM employees ORDER BY dateJoined DESC`, [], (e, rows) =>
    e ? res.status(500).json({ error: e.message }) : res.json(rows)
  );
});

app.get("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM employees WHERE id = ?`, [id], (e, employee) => {
    if (e) return res.status(500).json({ error: e.message });
    if (!employee) return res.status(404).json({ error: "کارمند یافت نشد" });

    // >>> ADDED: گرفتن قرارداد این کارمند
    db.get(
      `SELECT data FROM contracts WHERE employeeId = ?`,
      [id],
      (errC, contractRow) => {
        if (errC) return res.status(500).json({ error: errC.message });
        const contract = contractRow ? JSON.parse(contractRow.data || "{}") : null;

        db.all(
          `SELECT * FROM documents WHERE employeeId = ? ORDER BY uploadDate DESC`,
          [id],
          (err, documents) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...employee, contract, documents: documents || [] });
          }
        );
      }
    );
  });
});

app.post(
  "/api/employees",
  authenticateToken,
  upload.fields([{ name: "photo", maxCount: 1 }, { name: "documents" }]),
  (req, res) => {
    try {
      const {
        fullName,
        nationalId,
        employeeId,
        jobTitle,
        department,
        branch,
        contactNumber,
        email,
        dateJoined,
        dateOfBirth,
        monthlySalary,
        status,
        gender,
        militaryStatus,
        additionalNotes,
        contract: contractRaw, // >>> ADDED: قرارداد از فرم
      } = req.body;

      const photoPath = req.files?.photo?.[0]
        ? `uploads/${req.files.photo[0].filename}`
        : null;

      const sql = `INSERT INTO employees (id, fullName, nationalId, jobTitle, department, branch, contactNumber, email, dateJoined, dateOfBirth, monthlySalary, status, gender, militaryStatus, additionalNotes, photo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
      const params = [
        employeeId,
        fullName,
        nationalId,
        jobTitle,
        department,
        branch,
        contactNumber,
        email,
        dateJoined,
        dateOfBirth,
        monthlySalary,
        status,
        gender,
        militaryStatus,
        additionalNotes,
        photoPath,
      ];

      db.run(sql, params, function (e) {
        if (e) {
          console.error("❌ DB Insert Error:", e.message);
          return res.status(500).json({ error: "خطا در ذخیرهٔ کارمند" });
        }

        // ذخیره مدارک
        if (req.files.documents) {
          const docStmt = db.prepare(
            "INSERT INTO documents (id, employeeId, fileName, filePath, fileType, uploadDate) VALUES (?, ?, ?, ?, ?, ?)"
          );
          req.files.documents.forEach((file) => {
            const originalName = Buffer.from(file.originalname, "latin1").toString(
              "utf8"
            );
            const docPath = `uploads/${file.filename}`;
            docStmt.run(
              crypto.randomUUID(),
              employeeId,
              originalName,
              docPath,
              file.mimetype,
              new Date().toISOString()
            );
          });
          docStmt.finalize();
        }

        // >>> ADDED: ذخیره قرارداد (در صورت ارسال)
        if (contractRaw) {
          let contractJson = null;
          try {
            contractJson = JSON.parse(contractRaw);
          } catch (errParse) {
            console.warn("⚠️ قرارداد ارسال‌شده JSON معتبر نیست.", errParse);
          }
          if (contractJson) {
            const cId = "CON-" + Date.now();
            const now = new Date().toISOString();
            db.run(
              `INSERT INTO contracts (id, employeeId, data, createdAt, updatedAt) VALUES (?,?,?,?,?)`,
              [cId, employeeId, JSON.stringify(contractJson), now, now],
              (cErr) => {
                if (cErr) {
                  console.error("❌ ذخیره قرارداد شکست خورد:", cErr.message);
                }
                // پاسخ نهایی
                res.status(201).json({ message: "کارمند ثبت شد", id: employeeId });
                createNotification(
                  req.user.id,
                  "ایجاد کارمند جدید",
                  `کارمند ${fullName} به سیستم اضافه شد.`
                );
              }
            );
          } else {
            res.status(201).json({ message: "کارمند ثبت شد", id: employeeId });
            createNotification(
              req.user.id,
              "ایجاد کارمند جدید",
              `کارمند ${fullName} به سیستم اضافه شد.`
            );
          }
        } else {
          // اگر قرارداد ارسال نشده
          res.status(201).json({ message: "کارمند ثبت شد", id: employeeId });
          createNotification(
            req.user.id,
            "ایجاد کارمند جدید",
            `کارمند ${fullName} به سیستم اضافه شد.`
          );
        }
      });
    } catch (e) {
      console.error("❌ API Error:", e);
      res.status(500).json({ error: "خطای غیرمنتظرهٔ سرور" });
    }
  }
);

app.put(
  "/api/employees/:id",
  upload.fields([{ name: "photo", maxCount: 1 }, { name: "documents" }]),
  (req, res) => {
    const { id } = req.params;
    const {
      fullName,
      nationalId,
      jobTitle,
      department,
      branch,
      contactNumber,
      email,
      dateJoined,
      dateOfBirth,
      monthlySalary,
      status,
      gender,
      militaryStatus,
      additionalNotes,
      contract: contractRaw, // >>> ADDED: قرارداد برای بروزرسانی
    } = req.body;

    const salary = monthlySalary ? Number(monthlySalary) : null;
    let sql = `UPDATE employees SET fullName = ?, nationalId = ?, jobTitle = ?, department = ?, branch = ?, contactNumber = ?, email = ?, dateJoined = ?, dateOfBirth = ?, monthlySalary = ?, status = ?, gender = ?, militaryStatus = ?, additionalNotes = ?`;
    const params = [
      fullName,
      nationalId,
      jobTitle,
      department,
      branch,
      contactNumber,
      email,
      dateJoined,
      dateOfBirth,
      salary,
      status,
      gender,
      militaryStatus,
      additionalNotes,
    ];

    if (req.files?.photo) {
      const photoPath = `uploads/${req.files.photo[0].filename}`;
      sql += `, photo = ?`;
      params.push(photoPath);
    }
    sql += ` WHERE id = ?`;
    params.push(id);

    db.run(sql, params, function (err) {
      if (err) {
        console.error("❌ DB Update Error:", err.message);
        return res.status(500).json({ error: err.message });
      }

      // ذخیره مدارک جدید (در صورت وجود)
      if (req.files?.documents) {
        const docStmt = db.prepare(
          "INSERT INTO documents (id, employeeId, fileName, filePath, fileType, uploadDate) VALUES (?, ?, ?, ?, ?, ?)"
        );
        req.files.documents.forEach((file) => {
          const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
          const docPath = `uploads/${file.filename}`;
          docStmt.run(
            crypto.randomUUID(),
            id,
            originalName,
            docPath,
            file.mimetype,
            new Date().toISOString()
          );
        });
        docStmt.finalize();
      }

      // >>> ADDED: بروزرسانی/ایجاد قرارداد اگر ارسال شده باشد
      if (contractRaw) {
        let contractJson = null;
        try {
          contractJson = JSON.parse(contractRaw);
        } catch (errParse) {
          console.warn("⚠️ قرارداد ارسالی JSON معتبر نیست.", errParse);
        }

        if (contractJson) {
          const now = new Date().toISOString();
          db.get(
            `SELECT id FROM contracts WHERE employeeId = ?`,
            [id],
            (cErr, row) => {
              if (cErr) {
                console.error("❌ خطای جستجوی قرارداد:", cErr.message);
                return res.json({
                  message: "اطلاعات کارمند بروزرسانی شد (بدون قرارداد)",
                  changes: this.changes,
                });
              }
              if (row) {
                // Update
                db.run(
                  `UPDATE contracts SET data = ?, updatedAt = ? WHERE employeeId = ?`,
                  [JSON.stringify(contractJson), now, id],
                  (uErr) => {
                    if (uErr) {
                      console.error("❌ خطای بروزرسانی قرارداد:", uErr.message);
                    }
                    return res.json({
                      message: "اطلاعات کارمند بروزرسانی شد",
                      changes: this.changes,
                    });
                  }
                );
              } else {
                // Insert new
                const cId = "CON-" + Date.now();
                db.run(
                  `INSERT INTO contracts (id, employeeId, data, createdAt, updatedAt) VALUES (?,?,?,?,?)`,
                  [cId, id, JSON.stringify(contractJson), now, now],
                  (iErr) => {
                    if (iErr) {
                      console.error("❌ خطای درج قرارداد:", iErr.message);
                    }
                    return res.json({
                      message: "اطلاعات کارمند بروزرسانی شد",
                      changes: this.changes,
                    });
                  }
                );
              }
            }
          );
        } else {
          // قرارداد معتبر نبود
          return res.json({
            message: "اطلاعات کارمند بروزرسانی شد (قرارداد نامعتبر)",
            changes: this.changes,
          });
        }
      } else {
        // هیچ قرارداد جدیدی ارسال نشده بود
        return res.json({
          message: "اطلاعات کارمند با موفقیت بروزرسانی شد",
          changes: this.changes,
        });
      }
    });
  }
);

app.delete("/api/employees/:id", (req, res) => {
  db.run(`DELETE FROM employees WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: "Employee deleted", changes: this.changes });
  });
});

/* --------------------------------- Contracts API (Optional endpoints) --------- */
// >>> ADDED: در صورت نیاز فرانت‌اند به API مستقل
app.get("/api/contracts/:employeeId", (req, res) => {
  const { employeeId } = req.params;
  db.get(
    `SELECT data FROM contracts WHERE employeeId = ?`,
    [employeeId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "قراردادی یافت نشد" });
      res.json({ employeeId, data: JSON.parse(row.data || "{}") });
    }
  );
});

app.put("/api/contracts/:employeeId", (req, res) => {
  const { employeeId } = req.params;
  const { data } = req.body; // JSON Object
  if (!data) return res.status(400).json({ error: "data الزامی است" });
  const now = new Date().toISOString();
  const jsonStr = JSON.stringify(data);

  db.get(
    `SELECT id FROM contracts WHERE employeeId = ?`,
    [employeeId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        db.run(
          `UPDATE contracts SET data = ?, updatedAt = ? WHERE employeeId = ?`,
          [jsonStr, now, employeeId],
          function (uErr) {
            if (uErr) return res.status(500).json({ error: uErr.message });
            res.json({ message: "قرارداد بروزرسانی شد", changes: this.changes });
          }
        );
      } else {
        const cId = "CON-" + Date.now();
        db.run(
          `INSERT INTO contracts (id, employeeId, data, createdAt, updatedAt) VALUES (?,?,?,?,?)`,
          [cId, employeeId, jsonStr, now, now],
          function (iErr) {
            if (iErr) return res.status(500).json({ error: iErr.message });
            res.status(201).json({ message: "قرارداد ایجاد شد", id: cId });
          }
        );
      }
    }
  );
});

/* --------------------------------- Documents API --------------------------------- */
app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT filePath FROM documents WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Document not found" });

    const fullPath = path.join(__dirname, row.filePath);
    fs.unlink(fullPath, (unlinkErr) => {
      if (unlinkErr) console.error("Failed to delete file:", unlinkErr);
    });

    db.run("DELETE FROM documents WHERE id = ?", [id], function (dbErr) {
      if (dbErr) return res.status(500).json({ error: dbErr.message });
      res.json({ message: "Document deleted", changes: this.changes });
    });
  });
});

/* --------------------------------- Notifications API --------------------------------- */
app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  db.all(
    `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  db.run(`UPDATE notifications SET isRead = 1 WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Notification marked as read", changes: this.changes });
  });
});

/* --------------------------------- Tasks API --------------------------------- */
app.get("/api/tasks", (_, res) => {
  db.all(
    `SELECT * FROM tasks ORDER BY assignedDate DESC`,
    [],
    (e, rows) => (e ? res.status(400).json({ error: e.message }) : res.json(rows))
  );
});
app.post("/api/tasks", authenticateToken, (req, res) => {
  const { id, employeeName, description, assignedDate, dueDate, status, priority, department } =
    req.body;
  db.run(
    `INSERT INTO tasks (id, employeeName, description, assignedDate, dueDate, status, priority, department) VALUES (?,?,?,?,?,?,?,?)`,
    [id, employeeName, description, assignedDate, dueDate, status, priority, department],
    function (e) {
      if (e) return res.status(400).json({ error: e.message });
      res.status(201).json({ message: "success", id: this.lastID });
      createNotification(
        req.user.id,
        "ثبت وظیفه جدید",
        `وظیفه جدیدی برای ${req.body.employeeName} ثبت شد.`
      );
    }
  );
});
app.put("/api/tasks/:id", (req, res) => {
  const { employeeName, description, assignedDate, dueDate, status, priority, department } =
    req.body;
  db.run(
    `UPDATE tasks SET employeeName = ?, description = ?, assignedDate = ?, dueDate = ?, status = ?, priority = ?, department = ? WHERE id = ?`,
    [employeeName, description, assignedDate, dueDate, status, priority, department, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "updated", changes: this.changes });
    }
  );
});
app.delete("/api/tasks/:id", (req, res) => {
  db.run(`DELETE FROM tasks WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: "deleted", changes: this.changes });
  });
});

/* --------------------------------- Requests API --------------------------------- */
app.get("/api/requests", (_, res) => {
  db.all(`SELECT * FROM requests ORDER BY submissionDate DESC`, [], (e, rows) => {
    if (e) return res.status(500).json({ error: e.message });
    res.json(
      rows.map((row) => ({
        ...row,
        comments: JSON.parse(row.comments || "[]"),
        history: JSON.parse(row.history || "[]"),
        attachments: JSON.parse(row.attachments || "[]"),
      }))
    );
  });
});
app.post("/api/requests", upload.array("attachments"), (req, res) => {
  const {
    employeeId,
    employeeName,
    requestType,
    priority,
    description,
    startDate,
    endDate,
    amount,
    reason,
  } = req.body;
  const attachments = req.files
    ? req.files.map((file) => ({
        fileName: Buffer.from(file.originalname, "latin1").toString("utf8"),
        filePath: `uploads/${file.filename}`,
        fileType: file.mimetype,
      }))
    : [];
  const id = `REQ-${Date.now()}`;
  const submissionDate = new Date().toISOString();
  const status = "pending";
  const history = JSON.stringify([
    { action: "درخواست ثبت شد", author: employeeName, timestamp: new Date().toLocaleString("fa-IR") },
  ]);
  const comments = JSON.stringify([]);
  const sql = `INSERT INTO requests (id, employeeId, employeeName, requestType, status, priority, submissionDate, startDate, endDate, amount, description, reason, attachments, comments, history) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const params = [
    id,
    employeeId,
    employeeName,
    requestType,
    status,
    priority,
    submissionDate,
    startDate,
    endDate,
    amount,
    description,
    reason,
    JSON.stringify(attachments),
    comments,
    history,
  ];
  db.run(sql, params, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ message: "Request created", id: this.lastID });
  });
});
app.put("/api/requests/:id", (req, res) => {
  const { status, comments, history } = req.body;
  db.run(
    `UPDATE requests SET status = ?, comments = ?, history = ? WHERE id = ?`,
    [status, JSON.stringify(comments), JSON.stringify(history), req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Request updated", changes: this.changes });
    }
  );
});
app.delete("/api/requests/:id", (req, res) => {
  db.run(`DELETE FROM requests WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: "Request deleted", changes: this.changes });
  });
});
/* --------------------------------- Sales API --------------------------------- */

// لیست فروش‌ها با فیلتر اختیاری تاریخ/شعبه/فروشنده
app.get("/api/sales", authenticateToken, (req, res) => {
  const { from, to, branch, seller } = req.query;
  const where = [];
  const params = [];

  if (from) { where.push("date(date) >= date(?)"); params.push(from); }
  if (to)   { where.push("date(date) <= date(?)"); params.push(to); }
  if (branch) { where.push("branch = ?"); params.push(branch); }
  if (seller) { where.push("seller = ?"); params.push(seller); }

  const sql = `
    SELECT * FROM sales
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY date DESC
  `;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// دریافت یک فروش + آیتم‌ها
app.get("/api/sales/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM sales WHERE id = ?`, [id], (err, sale) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!sale) return res.status(404).json({ error: "فروش یافت نشد" });

    db.all(`SELECT * FROM sale_items WHERE saleId = ?`, [id], (e2, items) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json({ ...sale, items });
    });
  });
});

// ایجاد فروش جدید
app.post("/api/sales", authenticateToken, upload.none(), (req, res) => {
  const {
    invoiceNo, customer, branch, seller,
    amount = 0, tax = 0, discount = 0, total = 0,
    notes = "", date, items = "[]"
  } = req.body;

  const id = `SALE-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const sql = `
    INSERT INTO sales (id, invoiceNo, customer, branch, seller, amount, tax, discount, total, notes, date, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `;
  db.run(
    sql,
    [id, invoiceNo, customer, branch, seller, amount, tax, discount, total, notes, date, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // ذخیره آیتم‌ها (در صورت ارسال)
      let parsedItems = [];
      try { parsedItems = JSON.parse(items); } catch (_) {}

      if (Array.isArray(parsedItems) && parsedItems.length) {
        const stmt = db.prepare(
          `INSERT INTO sale_items (id, saleId, product, qty, unitPrice, total) VALUES (?,?,?,?,?,?)`
        );
        parsedItems.forEach((it) => {
          stmt.run(
            crypto.randomUUID(),
            id,
            it.product || "",
            Number(it.qty || 0),
            Number(it.unitPrice || 0),
            Number(it.total || 0)
          );
        });
        stmt.finalize();
      }

      createNotification(
        req.user.id,
        "ثبت فروش جدید",
        `فروش جدید با فاکتور ${invoiceNo || id} ثبت شد.`,
        "sale"
      );

      res.status(201).json({ message: "فروش ثبت شد", id });
    }
  );
});

// بروزرسانی فروش
app.put("/api/sales/:id", authenticateToken, upload.none(), (req, res) => {
  const { id } = req.params;
  const {
    invoiceNo, customer, branch, seller,
    amount = 0, tax = 0, discount = 0, total = 0,
    notes = "", date, items = "[]"
  } = req.body;

  const sql = `
    UPDATE sales SET invoiceNo=?, customer=?, branch=?, seller=?, amount=?, tax=?, discount=?, total=?, notes=?, date=? WHERE id=?
  `;
  const params = [invoiceNo, customer, branch, seller, amount, tax, discount, total, notes, date, id];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // آیتم‌ها را ساده حذف و دوباره درج می‌کنیم
    db.run(`DELETE FROM sale_items WHERE saleId = ?`, [id], (delErr) => {
      if (delErr) return res.status(500).json({ error: delErr.message });

      let parsedItems = [];
      try { parsedItems = JSON.parse(items); } catch (_) {}

      if (Array.isArray(parsedItems) && parsedItems.length) {
        const stmt = db.prepare(
          `INSERT INTO sale_items (id, saleId, product, qty, unitPrice, total) VALUES (?,?,?,?,?,?)`
        );
        parsedItems.forEach((it) => {
          stmt.run(
            crypto.randomUUID(),
            id,
            it.product || "",
            Number(it.qty || 0),
            Number(it.unitPrice || 0),
            Number(it.total || 0)
          );
        });
        stmt.finalize();
      }

      res.json({ message: "فروش بروزرسانی شد", changes: this.changes });
    });
  });
});

// حذف فروش
app.delete("/api/sales/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM sale_items WHERE saleId = ?`, [id], function (e1) {
    if (e1) return res.status(500).json({ error: e1.message });

    db.run(`DELETE FROM sales WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "فروش حذف شد", changes: this.changes });
    });
  });
});

// خلاصه فروش (برای نمودار/گزارش)
app.get("/api/sales/summary", authenticateToken, (req, res) => {
  const { from, to, groupBy = "month" } = req.query;
  // groupBy: 'day' | 'month' | 'year'
  const fmt =
    groupBy === "day" ? "%Y-%m-%d" :
    groupBy === "year" ? "%Y" :
    "%Y-%m"; // default month

  const where = [];
  const params = [];
  if (from) { where.push("date(date) >= date(?)"); params.push(from); }
  if (to)   { where.push("date(date) <= date(?)"); params.push(to); }

  const sql = `
    SELECT strftime('${fmt}', date) AS bucket,
           SUM(total)   AS total,
           SUM(amount)  AS net,
           SUM(tax)     AS tax,
           SUM(discount) AS discount,
           COUNT(*)     AS count
    FROM sales
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    GROUP BY bucket
    ORDER BY bucket
  `;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// خروجی اکسل فروش‌ها
const ExcelJS = require("exceljs"); // اگر بالاتر require شده، این خط تکراری را بردار
app.get("/api/sales/export.xlsx", authenticateToken, (req, res) => {
  const { from, to, branch } = req.query;
  const where = [];
  const params = [];
  if (from) { where.push("date(date) >= date(?)"); params.push(from); }
  if (to)   { where.push("date(date) <= date(?)"); params.push(to); }
  if (branch) { where.push("branch = ?"); params.push(branch); }

  const sql = `
    SELECT * FROM sales
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY date DESC
  `;
  db.all(sql, params, async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sales");

    ws.columns = [
      { header: "کد",          key: "id",        width: 20 },
      { header: "شماره فاکتور", key: "invoiceNo", width: 16 },
      { header: "مشتری",       key: "customer",  width: 24 },
      { header: "شعبه",        key: "branch",    width: 16 },
      { header: "فروشنده",     key: "seller",    width: 18 },
      { header: "مبلغ",        key: "amount",    width: 14 },
      { header: "مالیات",      key: "tax",       width: 12 },
      { header: "تخفیف",       key: "discount",  width: 12 },
      { header: "جمع کل",      key: "total",     width: 14 },
      { header: "تاریخ",       key: "date",      width: 22 },
      { header: "توضیحات",     key: "notes",     width: 40 },
    ];

    rows.forEach((r) => ws.addRow(r));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="sales.xlsx"');

    await wb.xlsx.write(res);
    res.end();
  });
});

// ======================= EXPORT REQUESTS TO EXCEL =======================
const ExcelJS = require("exceljs");

app.get("/api/requests/export.xlsx", (req, res) => {
  const sql = `SELECT * FROM requests ORDER BY submissionDate DESC`;
  db.all(sql, [], async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // تبدیل فیلدهای JSON به متن برای نمایش در اکسل
    const cleaned = rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      requestType: r.requestType,
      status: r.status,
      priority: r.priority,
      submissionDate: r.submissionDate,
      startDate: r.startDate,
      endDate: r.endDate,
      amount: r.amount,
      description: r.description,
      reason: r.reason,
      // تبدیل آرایه‌ها به رشته برای اینکه اکسل خراب نشود
      comments: (JSON.parse(r.comments || "[]") || []).length,
      history: (JSON.parse(r.history || "[]") || []).length,
      attachments: (JSON.parse(r.attachments || "[]") || []).length,
    }));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Requests");

    ws.columns = [
      { header: "کد", key: "id", width: 18 },
      { header: "نام کارمند", key: "employeeName", width: 22 },
      { header: "نوع درخواست", key: "requestType", width: 18 },
      { header: "وضعیت", key: "status", width: 14 },
      { header: "اولویت", key: "priority", width: 12 },
      { header: "تاریخ ثبت", key: "submissionDate", width: 24 },
      { header: "شروع", key: "startDate", width: 16 },
      { header: "پایان", key: "endDate", width: 16 },
      { header: "مبلغ", key: "amount", width: 14 },
      { header: "توضیحات", key: "description", width: 40 },
      { header: "دلیل", key: "reason", width: 30 },
      { header: "تعداد کامنت", key: "comments", width: 14 },
      { header: "تعداد تاریخچه", key: "history", width: 14 },
      { header: "تعداد پیوست", key: "attachments", width: 14 },
    ];

    cleaned.forEach((row) => ws.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="requests.xlsx"');

    await wb.xlsx.write(res);
    res.end();
  });
});

/* --------------------------------- Branches, Positions, Departments API --------------------------------- */
app.get("/api/branches", (_, res) => {
  db.all(
    `SELECT b.id, b.name, e.fullName AS managerName, (SELECT COUNT(*) FROM employees WHERE branch = b.name) AS employeeCount FROM branches b LEFT JOIN employees e ON b.managerId = e.id`,
    [],
    (e, rows) => (e ? res.status(500).json({ error: e.message }) : res.json(rows))
  );
});
app.post("/api/branches", (req, res) => {
  const { name, managerId } = req.body;
  const id = `BR-${Date.now()}`;
  db.run(
    `INSERT INTO branches (id,name,managerId) VALUES (?,?,?)`,
    [id, name, managerId],
    function (e) {
      e
        ? res.status(500).json({ error: e.message })
        : res.status(201).json({ id, name, managerId });
    }
  );
});
app.put("/api/branches/:id", (req, res) => {
  db.run(
    `UPDATE branches SET name=?, managerId=? WHERE id=?`,
    [req.body.name, req.body.managerId, req.params.id],
    function (e) {
      e
        ? res.status(500).json({ error: e.message })
        : res.json({ message: "Branch updated", changes: this.changes });
    }
  );
});
app.delete("/api/branches/:id", (req, res) => {
  db.run(`DELETE FROM branches WHERE id=?`, req.params.id, function (e) {
    e
      ? res.status(500).json({ error: e.message })
      : res.json({ message: "Branch deleted", changes: this.changes });
  });
});

app.get("/api/positions", (_, res) => {
  db.all(`SELECT * FROM positions ORDER BY title`, [], (e, rows) =>
    e ? res.status(500).json({ error: e.message }) : res.json(rows)
  );
});
app.post("/api/positions", (req, res) => {
  const { title } = req.body;
  const id = `POS-${Date.now()}`;
  db.run(
    `INSERT INTO positions (id,title) VALUES (?,?)`,
    [id, title],
    function (e) {
      e
        ? res.status(500).json({ error: e.message })
        : res.status(201).json({ id, title });
    }
  );
});
app.put("/api/positions/:id", (req, res) => {
  db.run(
    `UPDATE positions SET title=? WHERE id=?`,
    [req.body.title, req.params.id],
    function (e) {
      e
        ? res.status(500).json({ error: e.message })
        : res.json({ message: "Position updated", changes: this.changes });
    }
  );
});
app.delete("/api/positions/:id", (req, res) => {
  db.run(`DELETE FROM positions WHERE id=?`, req.params.id, function (e) {
    e
      ? res.status(500).json({ error: e.message })
      : res.json({ message: "Position deleted", changes: this.changes });
  });
});

app.get("/api/departments", (_, res) => {
  db.all(`SELECT * FROM departments ORDER BY name`, [], (e, rows) =>
    e ? res.status(500).json({ error: e.message }) : res.json(rows)
  );
});
app.post("/api/departments", (req, res) => {
  const { name } = req.body;
  const id = `DEP-${Date.now()}`;
  db.run(
    `INSERT INTO departments (id, name) VALUES (?,?)`,
    [id, name],
    function (e) {
      e
        ? res.status(500).json({ error: e.message })
        : res.status(201).json({ id, name });
    }
  );
});
app.put("/api/departments/:id", (req, res) => {
  db.run(
    `UPDATE departments SET name=? WHERE id=?`,
    [req.body.name, req.params.id],
    function (e) {
      e
        ? res.status(500).json({ error: e.message })
        : res.json({ message: "Department updated", changes: this.changes });
    }
  );
});
app.delete("/api/departments/:id", (req, res) => {
  db.run(`DELETE FROM departments WHERE id=?`, req.params.id, function (e) {
    e
      ? res.status(500).json({ error: e.message })
      : res.json({ message: "Department deleted", changes: this.changes });
  });
});

/* --------------------------------- Users API --------------------------------- */
app.get("/api/users", authenticateToken, isAdmin, (_, res) => {
  db.all(
    `SELECT id, fullName, username, role, isActive, createdAt FROM users ORDER BY createdAt DESC`,
    [],
    (e, rows) => (e ? res.status(500).json({ error: e.message }) : res.json(rows))
  );
});

app.post("/api/users", authenticateToken, isAdmin, (req, res) => {
  const { fullName, username, password, role } = req.body;

  if (!fullName || !username || !password || !role) {
    return res.status(400).json({ error: "تمام فیلدها الزامی هستند." });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: "خطا در هش کردن رمز عبور" });

    const id = `USER-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const sql = `INSERT INTO users (id, fullName, username, password, role, isActive, createdAt) VALUES (?,?,?,?,?,?,?)`;
    const params = [id, fullName, username, hashedPassword, role, 1, createdAt];

    db.run(sql, params, function (e) {
      if (e) {
        if (e.message.includes("UNIQUE constraint failed")) {
          return res.status(409).json({ error: "نام کاربری تکراری است." });
        }
        return res.status(500).json({ error: "خطا در ایجاد کاربر" });
      }
      res.status(201).json({ message: "کاربر با موفقیت ایجاد شد", id: this.lastID });
      createNotification(
        req.user.id,
        "ایجاد کاربر جدید",
        `کاربر ${fullName} با نقش '${role}' ساخته شد.`
      );
    });
  });
});

app.put("/api/users/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { fullName, username, role, password } = req.body;

  let sql = `UPDATE users SET fullName = ?, username = ?, role = ?`;
  let params = [fullName, username, role];

  const updateUser = () => {
    sql += ` WHERE id = ?`;
    params.push(id);

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(409).json({ error: "نام کاربری تکراری است." });
        }
        return res.status(500).json({ error: "خطا در بروزرسانی کاربر" });
      }
      res.json({ message: "اطلاعات کاربر بروزرسانی شد", changes: this.changes });
    });
  };

  if (password) {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ error: "خطا در هش کردن رمز عبور جدید" });
      sql += `, password = ?`;
      params.push(hashedPassword);
      updateUser();
    });
  } else {
    updateUser();
  }
});

app.patch("/api/users/:id/status", authenticateToken, isAdmin, (req, res) => {
  const { isActive } = req.body;
  db.run(`UPDATE users SET isActive = ? WHERE id = ?`, [isActive, req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: "وضعیت کاربر بروزرسانی شد", changes: this.changes });
  });
});

app.delete("/api/users/:id", authenticateToken, isAdmin, (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: "کاربر با موفقیت حذف شد", changes: this.changes });
  });
});

// ================================================================== //
// START: بخش مربوط به خروجی DOCX (نسخه نهایی و اصلاح شده)            //
// ================================================================== //

app.post('/api/export-docx', express.text({ type: '*/*', limit: '10mb' }), (req, res) => {
  const html = req.body || '';
  if (!html.trim()) {
    return res.status(400).json({ error: 'محتوای HTML نمی‌تواند خالی باشد.' });
  }

  const fileName = req.query.fileName || `document-${Date.now()}.docx`;

  // پارامتر "-o -" به دستور اضافه شد تا خروجی به درستی ارسال شود
  const pandocArgs = ['-f', 'html', '-t', 'docx', '-o', '-'];
  const pandocProcess = spawn('pandoc', pandocArgs);

  // تنظیم هدرهای پاسخ برای دانلود فایل
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

  // هدایت مستقیم خروجی pandoc به پاسخ (response)
  pandocProcess.stdout.pipe(res);

  // رسیدگی به خطاها
  pandocProcess.stderr.on('data', (data) => {
    // این لاگ در کنسول بک‌اند شما نمایش داده می‌شود
    console.error(`Pandoc Stderr: ${data.toString()}`);
  });

  pandocProcess.on('error', (err) => {
    console.error('Failed to start Pandoc process.', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start Pandoc process' });
    }
  });

  pandocProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Pandoc process exited with code ${code}`);
      if (!res.headersSent) {
        res.status(500).json({ error: `Pandoc process exited with code ${code}` });
      }
    }
  });
  
  // ارسال محتوای HTML به ورودی pandoc
  pandocProcess.stdin.write(html);
  pandocProcess.stdin.end();
});

// ================================================================== //
// END: بخش مربوط به خروجی DOCX                                       //
// ================================================================== //


/* ------------------------------------------------------------------ */
/* راه‌اندازی سرور                                                     */
/* ------------------------------------------------------------------ */
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3001;

app.listen(PORT, HOST, () => {
  console.log("------------------------------------------------");
  console.log(
    `🚀  API ready on:\n    http://${HOST === "0.0.0.0" ? "192.168.11.115:3001" : HOST}:${PORT}`
  );
  console.log("------------------------------------------------");
});
