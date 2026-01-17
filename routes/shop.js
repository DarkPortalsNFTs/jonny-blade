const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();
const dbPath = path.join(__dirname, "..", "data", "app.db");
const openDb = () => new sqlite3.Database(dbPath);

router.get("/products", (req, res) => {
  const db = openDb();
  db.all("SELECT * FROM products WHERE active=1 ORDER BY id DESC", (err, rows) => {
    db.close();
    if (err) return res.status(500).send("DB error");
    res.render("products", { products: rows || [] });
  });
});

module.exports = router;
