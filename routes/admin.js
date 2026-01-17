const express = require("express");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
const dbPath = path.join(__dirname, "..", "data", "app.db");
const openDb = () => new sqlite3.Database(dbPath);

router.get("/login", (req, res) => res.render("admin-login", { error: null }));

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const db = openDb();
  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    if (err) {
      db.close();
      return res.render("admin-login", { error: "Database error" });
    }
    if (!user) {
      db.close();
      return res.render("admin-login", { error: "Invalid login" });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      db.close();
      return res.render("admin-login", { error: "Invalid login" });
    }
    req.session.user = { id: user.id, email: user.email, role: user.role };
    db.close();
    return res.redirect("/admin");
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

router.get("/", requireAdmin, (req, res) => {
  res.render("admin", { user: req.session.user });
});

module.exports = router;
