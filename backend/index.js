/* ------------------------------------------------------------------ */
/* وابستگی‌ها                                                          */
/* ------------------------------------------------------------------ */
const express = require("express");
const cors = require("cors");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; // کلید محرمانه برای JWT

/* ------------------------------------------------------------------ */
/* تنظیمات عمومی                                                       */
/* ------------------------------------------------------------------ */
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

/* ------------------------------------------------------------------ */
/* بارگذاری فایل‌ها (عکس و ضمائم)                                     */
/* ------------------------------------------------------------------ */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + '-' + originalName.replace(/\s/g, '_'));
  }
});
const upload = multer({ storage });
app.use("/uploads", express.static(uploadDir));


/* ================================================================== */
/* API ROUTES                                                         */
/* ================================================================== */

/* --------------------------------- Profile API --------------------------------- */
app.get("/api/profile", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT id, fullName, username, email, phone, role FROM users WHERE id = ?`;
    db.get(sql, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: "خطای داخلی سرور" });
        if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
        res.json(user);
    });
});

app.patch("/api/profile", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { fullName, email, phone } = req.body;

    if (!fullName || !email) {
        return res.status(400).json({ error: "نام و ایمیل الزامی است." });
    }

    const sql = `UPDATE users SET fullName = ?, email = ?, phone = ? WHERE id = ?`;
    db.run(sql, [fullName, email, phone, userId], function (err) {
        if (err) return res.status(500).json({ error: "خطا در بروزرسانی پروفایل" });
        res.json({ message: "پروفایل با موفقیت بروزرسانی شد." });
    });
});

/* --------------------------------- Security API --------------------------------- */
app.patch("/api/security/change-password", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "رمز عبور فعلی و جدید الزامی است." });
    }

    db.get(`SELECT password FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) return res.status(500).json({ error: "کاربر یافت نشد" });

        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ error: "رمز عبور فعلی اشتباه است." });
            }

            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                if (err) return res.status(500).json({ error: "خطا در هش کردن رمز جدید" });

                db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId], function (err) {
                    if (err) return res.status(500).json({ error: "خطا در بروزرسانی رمز عبور" });
                    res.json({ message: "رمز عبور با موفقیت تغییر کرد." });
                });
            });
        });
    });
});


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
            const { password, ...userData } = user;
            const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' }); // توکن برای یک ساعت معتبر است

            res.json({
                message: "ورود موفقیت آمیز بود",
                user: userData,
                token
            });
        });
    });
});

/* --------------------------------- Auth Middleware --------------------------------- */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'دسترسی غیرمجاز. این عملیات مخصوص مدیران است.' });
    }
    next();
};


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
    if (!employee) return res.status(404).json({ error: 'کارمند یافت نشد' });

    db.all(`SELECT * FROM documents WHERE employeeId = ? ORDER BY uploadDate DESC`, [id], (err, documents) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...employee, documents: documents || [] });
    });
  });
});

app.post("/api/employees", upload.fields([{ name: "photo", maxCount: 1 }, { name: "documents" }]), (req, res) => {
  try {
    const { fullName, nationalId, employeeId, jobTitle, department, branch, contactNumber, email, dateJoined, dateOfBirth, monthlySalary, status, gender, militaryStatus, additionalNotes } = req.body;
    const photoPath = req.files?.photo?.[0] ? `uploads/${req.files.photo[0].filename}` : null;
    const sql = `INSERT INTO employees (id, fullName, nationalId, jobTitle, department, branch, contactNumber, email, dateJoined, dateOfBirth, monthlySalary, status, gender, militaryStatus, additionalNotes, photo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [employeeId, fullName, nationalId, jobTitle, department, branch, contactNumber, email, dateJoined, dateOfBirth, monthlySalary, status, gender, militaryStatus, additionalNotes, photoPath];
    
    db.run(sql, params, function (e) {
      if (e) {
        console.error("❌ DB Insert Error:", e.message);
        return res.status(500).json({ error: "خطا در ذخیرهٔ کارمند" });
      }
      
      if (req.files.documents) {
          const docStmt = db.prepare('INSERT INTO documents (id, employeeId, fileName, filePath, fileType, uploadDate) VALUES (?, ?, ?, ?, ?, ?)');
          req.files.documents.forEach(file => {
              const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
              const docPath = `uploads/${file.filename}`;
              docStmt.run(crypto.randomUUID(), employeeId, originalName, docPath, file.mimetype, new Date().toISOString());
          });
          docStmt.finalize();
      }
      
      res.status(201).json({ message: "کارمند ثبت شد", id: employeeId });
    });
  } catch (e) {
    console.error("❌ API Error:", e);
    res.status(500).json({ error: "خطای غیرمنتظرهٔ سرور" });
  }
});

app.put("/api/employees/:id", upload.fields([{ name: "photo", maxCount: 1 }, { name: "documents" }]), (req, res) => {
    const { id } = req.params;
    const { fullName, nationalId, jobTitle, department, branch, contactNumber, email, dateJoined, dateOfBirth, monthlySalary, status, gender, militaryStatus, additionalNotes } = req.body;
    const salary = monthlySalary ? Number(monthlySalary) : null;
    let sql = `UPDATE employees SET fullName = ?, nationalId = ?, jobTitle = ?, department = ?, branch = ?, contactNumber = ?, email = ?, dateJoined = ?, dateOfBirth = ?, monthlySalary = ?, status = ?, gender = ?, militaryStatus = ?, additionalNotes = ?`;
    let params = [fullName, nationalId, jobTitle, department, branch, contactNumber, email, dateJoined, dateOfBirth, salary, status, gender, militaryStatus, additionalNotes];

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
        if (req.files?.documents) {
            const docStmt = db.prepare('INSERT INTO documents (id, employeeId, fileName, filePath, fileType, uploadDate) VALUES (?, ?, ?, ?, ?, ?)');
            req.files.documents.forEach(file => {
                const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                const docPath = `uploads/${file.filename}`;
                docStmt.run(crypto.randomUUID(), id, originalName, docPath, file.mimetype, new Date().toISOString());
            });
            docStmt.finalize();
        }
        res.json({ message: "اطلاعات کارمند با موفقیت بروزرسانی شد", changes: this.changes });
    });
});

app.delete("/api/employees/:id", (req, res) => {
    db.run(`DELETE FROM employees WHERE id = ?`, req.params.id, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Employee deleted", changes: this.changes });
    });
});

/* --------------------------------- Documents API --------------------------------- */
app.delete("/api/documents/:id", (req, res) => {
    const { id } = req.params;
    db.get('SELECT filePath FROM documents WHERE id = ?', [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Document not found' });
        
        const fullPath = path.join(__dirname, row.filePath);
        fs.unlink(fullPath, (unlinkErr) => {
            if (unlinkErr) console.error("Failed to delete file:", unlinkErr);
        });

        db.run('DELETE FROM documents WHERE id = ?', [id], function(dbErr) {
            if (dbErr) return res.status(500).json({ error: dbErr.message });
            res.json({ message: 'Document deleted', changes: this.changes });
        });
    });
});

/* --------------------------------- Notifications API --------------------------------- */
app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  db.all(`SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
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
  db.all(`SELECT * FROM tasks ORDER BY assignedDate DESC`, [], (e, rows) => e ? res.status(400).json({ error: e.message }) : res.json(rows));
});
app.post("/api/tasks", (req, res) => {
  const { id, employeeName, description, assignedDate, dueDate, status, priority, department } = req.body;
  db.run(`INSERT INTO tasks (id, employeeName, description, assignedDate, dueDate, status, priority, department) VALUES (?,?,?,?,?,?,?,?)`, [id, employeeName, description, assignedDate, dueDate, status, priority, department], function (e) {
    if (e) return res.status(400).json({ error: e.message });
    res.status(201).json({ message: "success", id: this.lastID });
  });
});
app.put("/api/tasks/:id", (req, res) => {
  const { employeeName, description, assignedDate, dueDate, status, priority, department } = req.body;
  db.run(`UPDATE tasks SET employeeName = ?, description = ?, assignedDate = ?, dueDate = ?, status = ?, priority = ?, department = ? WHERE id = ?`, [employeeName, description, assignedDate, dueDate, status, priority, department, req.params.id], function (err) {
    if (err) return res.status(400).json({ "error": err.message });
    res.json({ message: "updated", changes: this.changes });
  });
});
app.delete("/api/tasks/:id", (req, res) => {
  db.run(`DELETE FROM tasks WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(400).json({ "error": err.message });
    res.json({ message: "deleted", changes: this.changes });
  });
});

/* --------------------------------- Requests API --------------------------------- */
app.get("/api/requests", (_, res) => {
    db.all(`SELECT * FROM requests ORDER BY submissionDate DESC`, [], (e, rows) => {
        if (e) return res.status(500).json({ error: e.message });
        res.json(rows.map(row => ({...row, comments: JSON.parse(row.comments || '[]'), history: JSON.parse(row.history || '[]'), attachments: JSON.parse(row.attachments || '[]')})));
    });
});
app.post("/api/requests", upload.array('attachments'), (req, res) => {
    const { employeeId, employeeName, requestType, priority, description, startDate, endDate, amount, reason } = req.body;
    const attachments = req.files ? req.files.map(file => ({ fileName: Buffer.from(file.originalname, 'latin1').toString('utf8'), filePath: `uploads/${file.filename}`, fileType: file.mimetype })) : [];
    const id = `REQ-${Date.now()}`;
    const submissionDate = new Date().toISOString();
    const status = 'pending';
    const history = JSON.stringify([{ action: "درخواست ثبت شد", author: employeeName, timestamp: new Date().toLocaleString('fa-IR') }]);
    const comments = JSON.stringify([]);
    const sql = `INSERT INTO requests (id, employeeId, employeeName, requestType, status, priority, submissionDate, startDate, endDate, amount, description, reason, attachments, comments, history) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [id, employeeId, employeeName, requestType, status, priority, submissionDate, startDate, endDate, amount, description, reason, JSON.stringify(attachments), comments, history];
    db.run(sql, params, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.status(201).json({ message: "Request created", id: this.lastID });
    });
});
app.put("/api/requests/:id", (req, res) => {
    const { status, comments, history } = req.body;
    db.run(`UPDATE requests SET status = ?, comments = ?, history = ? WHERE id = ?`, [status, JSON.stringify(comments), JSON.stringify(history), req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Request updated", changes: this.changes });
    });
});
app.delete("/api/requests/:id", (req, res) => {
    db.run(`DELETE FROM requests WHERE id = ?`, req.params.id, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Request deleted", changes: this.changes });
    });
});

/* --------------------------------- Branches, Positions, Departments API --------------------------------- */
app.get("/api/branches", (_, res) => {
  db.all(`SELECT b.id, b.name, e.fullName AS managerName, (SELECT COUNT(*) FROM employees WHERE branch = b.name) AS employeeCount FROM branches b LEFT JOIN employees e ON b.managerId = e.id`, [], (e, rows) => e ? res.status(500).json({ error: e.message }) : res.json(rows));
});
app.post("/api/branches", (req, res) => {
  const { name, managerId } = req.body;
  const id = `BR-${Date.now()}`;
  db.run(`INSERT INTO branches (id,name,managerId) VALUES (?,?,?)`, [id, name, managerId], function(e) { e ? res.status(500).json({error:e.message}) : res.status(201).json({id,name,managerId})});
});
app.put("/api/branches/:id", (req, res) => {
  db.run(`UPDATE branches SET name=?, managerId=? WHERE id=?`,[req.body.name, req.body.managerId, req.params.id], function(e) { e ? res.status(500).json({error:e.message}) : res.json({message:"Branch updated",changes:this.changes})});
});
app.delete("/api/branches/:id", (req, res) => {
  db.run(`DELETE FROM branches WHERE id=?`, req.params.id, function(e) { e ? res.status(500).json({error:e.message}) : res.json({message:"Branch deleted",changes:this.changes})});
});

app.get("/api/positions", (_, res) => {
  db.all(`SELECT * FROM positions ORDER BY title`, [], (e, rows) => e ? res.status(500).json({error:e.message}) : res.json(rows));
});
app.post("/api/positions", (req, res) => {
  const { title } = req.body;
  const id = `POS-${Date.now()}`;
  db.run(`INSERT INTO positions (id,title) VALUES (?,?)`, [id, title], function(e) { e ? res.status(500).json({error:e.message}) : res.status(201).json({id,title})});
});
app.put("/api/positions/:id", (req, res) => {
  db.run(`UPDATE positions SET title=? WHERE id=?`, [req.body.title, req.params.id], function(e) { e ? res.status(500).json({error:e.message}) : res.json({message:"Position updated",changes:this.changes})});
});
app.delete("/api/positions/:id", (req, res) => {
  db.run(`DELETE FROM positions WHERE id=?`, req.params.id, function(e) { e ? res.status(500).json({error:e.message}) : res.json({message:"Position deleted",changes:this.changes})});
});

app.get("/api/departments", (_, res) => {
  db.all(`SELECT * FROM departments ORDER BY name`, [], (e, rows) => e ? res.status(500).json({error:e.message}) : res.json(rows));
});
app.post("/api/departments", (req, res) => {
  const { name } = req.body;
  const id = `DEP-${Date.now()}`;
  db.run(`INSERT INTO departments (id, name) VALUES (?,?)`, [id, name], function(e) { e ? res.status(500).json({error:e.message}) : res.status(201).json({id, name})});
});
app.put("/api/departments/:id", (req, res) => {
  db.run(`UPDATE departments SET name=? WHERE id=?`, [req.body.name, req.params.id], function(e) { e ? res.status(500).json({error:e.message}) : res.json({message:"Department updated",changes:this.changes})});
});
app.delete("/api/departments/:id", (req, res) => {
  db.run(`DELETE FROM departments WHERE id=?`, req.params.id, function(e) { e ? res.status(500).json({error:e.message}) : res.json({message:"Department deleted",changes:this.changes})});
});

/* --------------------------------- Settings API --------------------------------- */

// Notifications
app.get("/api/settings/notifications", authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.get(`SELECT emailNotifications, pushNotifications, weeklyReports FROM user_settings WHERE userId = ?`, [userId], (err, settings) => {
        if (err) return res.status(500).json({ error: "خطا در دریافت تنظیمات" });
        res.json(settings || { emailNotifications: true, pushNotifications: true, weeklyReports: false });
    });
});

app.patch("/api/settings/notifications", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { emailNotifications, pushNotifications, weeklyReports } = req.body;
    const sql = `
        INSERT INTO user_settings (userId, emailNotifications, pushNotifications, weeklyReports)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(userId) DO UPDATE SET
        emailNotifications = excluded.emailNotifications,
        pushNotifications = excluded.pushNotifications,
        weeklyReports = excluded.weeklyReports;
    `;
    db.run(sql, [userId, emailNotifications, pushNotifications, weeklyReports], function(err) {
        if (err) return res.status(500).json({ error: "خطا در ذخیره تنظیمات اطلاع‌رسانی" });
        res.json({ message: "تنظیمات اطلاع‌رسانی بروزرسانی شد." });
    });
});

// Appearance
app.get("/api/settings/appearance", authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.get(`SELECT theme FROM user_settings WHERE userId = ?`, [userId], (err, settings) => {
        if (err) return res.status(500).json({ error: "خطا در دریافت تنظیمات ظاهر" });
        res.json(settings || { theme: 'light' });
    });
});

app.patch("/api/settings/appearance", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { theme } = req.body;
    const sql = `
        INSERT INTO user_settings (userId, theme) VALUES (?, ?)
        ON CONFLICT(userId) DO UPDATE SET theme = excluded.theme;
    `;
    db.run(sql, [userId, theme], function(err) {
        if (err) return res.status(500).json({ error: "خطا در ذخیره تنظیمات ظاهر" });
        res.json({ message: "تنظیمات ظاهر بروزرسانی شد." });
    });
});

// SMS
app.get("/api/settings/sms", authenticateToken, isAdmin, (_, res) => {
    db.get(`SELECT smsUsername, smsPassword, smsPattern FROM sms_settings LIMIT 1`, [], (err, settings) => {
        if (err) return res.status(500).json({ error: "خطا در دریافت تنظیمات پیامک" });
        res.json(settings || {});
    });
});

app.patch("/api/settings/sms", authenticateToken, isAdmin, (req, res) => {
    const { smsUsername, smsPassword, smsPattern } = req.body;
    // Use an UPSERT-like logic for the single row in sms_settings
    db.run(`DELETE FROM sms_settings`, [], function(err) {
        if (err) return res.status(500).json({ error: "خطا در بروزرسانی تنظیمات پیامک" });

        const sql = `INSERT INTO sms_settings (smsUsername, smsPassword, smsPattern) VALUES (?, ?, ?)`;
        db.run(sql, [smsUsername, smsPassword, smsPattern], function(err) {
            if (err) return res.status(500).json({ error: "خطا در ذخیره تنظیمات پیامک" });
            res.json({ message: "تنظیمات پیامک بروزرسانی شد." });
        });
    });
});


/* --------------------------------- Users API --------------------------------- */
app.get("/api/users", authenticateToken, isAdmin, (_, res) => {
  db.all(`SELECT id, fullName, username, role, isActive, createdAt FROM users ORDER BY createdAt DESC`, [], (e, rows) =>
    e ? res.status(500).json({ error: e.message }) : res.json(rows)
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
                if (e.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: "نام کاربری تکراری است." });
                }
                return res.status(500).json({ error: "خطا در ایجاد کاربر" });
            }
            res.status(201).json({ message: "کاربر با موفقیت ایجاد شد", id: this.lastID });
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
                 if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: "نام کاربری تکراری است." });
                }
                return res.status(500).json({ error: "خطا در بروزرسانی کاربر" });
            }
            res.json({ message: "اطلاعات کاربر بروزرسانی شد", changes: this.changes });
        });
    }

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
    db.run(`UPDATE users SET isActive = ? WHERE id = ?`, [isActive, req.params.id], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ message: "وضعیت کاربر بروزرسانی شد", changes: this.changes });
    });
});

app.delete("/api/users/:id", authenticateToken, isAdmin, (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(400).json({ "error": err.message });
    res.json({ message: "کاربر با موفقیت حذف شد", changes: this.changes });
  });
});

/* ------------------------------------------------------------------ */
/* راه‌اندازی سرور                                                     */
/* ------------------------------------------------------------------ */
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3001;

app.listen(PORT, HOST, () => {
  console.log("------------------------------------------------");
  console.log(`🚀  API ready on:\n    http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log("------------------------------------------------");
});
