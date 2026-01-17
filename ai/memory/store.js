const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

function openDb() {
  const dbPath = path.join(__dirname, "..", "..", "data", "app.db");
  return new sqlite3.Database(dbPath);
}

async function ensureDb() {
  const db = openDb();
  const schemaPath = path.join(__dirname, "..", "..", "data", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await new Promise((res, rej) => db.exec(sql, (e) => (e ? rej(e) : res())));
  db.close();
}

async function saveMemory({ userKey = "public", input, response }) {
  const db = openDb();
  await new Promise((res, rej) =>
    db.run(
      "INSERT INTO ai_memory(user_key, input, response) VALUES (?, ?, ?)",
      [userKey, input, response],
      (e) => (e ? rej(e) : res())
    )
  );
  db.close();
}

async function recentMemory({ userKey = "public", limit = 8 }) {
  const db = openDb();
  const rows = await new Promise((res, rej) =>
    db.all(
      "SELECT input, response, created_at FROM ai_memory WHERE user_key=? ORDER BY id DESC LIMIT ?",
      [userKey, limit],
      (e, r) => (e ? rej(e) : res(r))
    )
  );
  db.close();
  return rows || [];
}

module.exports = { ensureDb, saveMemory, recentMemory };
