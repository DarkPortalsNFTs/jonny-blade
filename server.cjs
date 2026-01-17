require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const sqlite3 = require("sqlite3").verbose();

const { ensureDb } = require("./ai/memory/store");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const aiRoutes = require("./routes/ai");

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "data", "app.db");
const openDb = () => new sqlite3.Database(dbPath);

(async () => {
  try { await ensureDb(); } catch (e) { console.error("DB init failed:", e); }
})();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: "./data" }),
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  })
);

// Serve public assets from the site root so existing links like /css/style.css work.
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  // Load active products for the hero + shop sections on the home page.
  const db = openDb();
  db.all("SELECT * FROM products WHERE active=1 ORDER BY id DESC", (err, rows) => {
    db.close();
    const products = rows || [];
    if (err) {
      console.error("Failed to load products for home page:", err);
    }
    return res.render("index", { products }, (renderErr, html) => {
      if (renderErr) {
        console.error("Home page render failed:", renderErr);
        return res.send(`
          <body style="background:#0b0b0b;color:#fff;font-family:Arial;padding:30px">
            <h1 style="color:#d4af37">Blade</h1>
            <p><a style="color:#d4af37" href="/products">Products</a> •
               <a style="color:#d4af37" href="/ai">BladeAI</a> •
               <a style="color:#d4af37" href="/admin">Admin</a></p>
          </body>
        `);
      }
      return res.send(html);
    });
  });
});

app.use("/admin", adminRoutes);
app.use("/", shopRoutes);
app.use("/", aiRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Blade running on http://localhost:${PORT}`));
