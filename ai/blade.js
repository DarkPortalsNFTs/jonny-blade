import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'blade.db');

const DEFAULT_KNOWLEDGE = [
  {
    keyword: 'razor',
    response: 'Our Precision Razor uses a balanced weight and glide guard for a smooth, confident shave.',
  },
  {
    keyword: 'cream',
    response: 'The Rich Shaving Cream hydrates first, then lifts the hair for a clean finish.',
  },
  {
    keyword: 'beard',
    response: 'Beard Oil keeps the line sharp and the skin calm, especially after a hot towel rinse.',
  },
  {
    keyword: 'pomade',
    response: 'Styling Pomade gives controlled hold with a soft matte finish and zero crunch.',
  },
  {
    keyword: 'franchise',
    response: 'We are expanding through franchise partners who value premium grooming and local community trust.',
  },
  {
    keyword: 'price',
    response: 'Each product is priced for daily use with pro-grade quality. Ask me about a specific item.',
  },
];

export async function initBladeDb() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(
    'CREATE TABLE IF NOT EXISTS knowledge (keyword TEXT NOT NULL, response TEXT NOT NULL)'
  );
  await db.exec(
    'CREATE TABLE IF NOT EXISTS search_analytics (query TEXT PRIMARY KEY, count INTEGER NOT NULL, last_seen TEXT NOT NULL)'
  );
  await db.exec(
    'CREATE TABLE IF NOT EXISTS rewards_members (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, member_code TEXT NOT NULL, points INTEGER NOT NULL, created_at TEXT NOT NULL)'
  );

  const row = await db.get('SELECT COUNT(*) as count FROM knowledge');
  if (row?.count === 0) {
    const insert = await db.prepare('INSERT INTO knowledge (keyword, response) VALUES (?, ?)');
    for (const item of DEFAULT_KNOWLEDGE) {
      await insert.run(item.keyword, item.response);
    }
    await insert.finalize();
  }

  return db;
}

export async function getBladeResponse(db, message) {
  const normalized = (message || '').toLowerCase();
  if (!normalized.trim()) {
    return 'I am Blade. Ask me about grooming, products, or franchising.';
  }

  const row = await db.get(
    'SELECT response FROM knowledge WHERE ? LIKE "%" || keyword || "%" ORDER BY LENGTH(keyword) DESC LIMIT 1',
    normalized
  );

  if (row?.response) {
    return row.response;
  }

  return 'I am Blade. Share what you are looking for and I will guide you to the right product.';
}

export async function learnBlade(db, keyword, response) {
  const trimmedKeyword = (keyword || '').trim().toLowerCase();
  const trimmedResponse = (response || '').trim();

  if (!trimmedKeyword || !trimmedResponse) {
    return { ok: false, message: 'Keyword and response are required.' };
  }

  await db.run('INSERT INTO knowledge (keyword, response) VALUES (?, ?)', trimmedKeyword, trimmedResponse);
  return { ok: true };
}

export async function recordSearch(db, query) {
  const now = new Date().toISOString();
  const existing = await db.get('SELECT count FROM search_analytics WHERE query = ?', query);
  if (!existing) {
    await db.run('INSERT INTO search_analytics (query, count, last_seen) VALUES (?, ?, ?)', query, 1, now);
    return;
  }
  await db.run('UPDATE search_analytics SET count = ?, last_seen = ? WHERE query = ?', existing.count + 1, now, query);
}

export async function listSearches(db, limit = 20) {
  return db.all(
    'SELECT query, count, last_seen FROM search_analytics ORDER BY count DESC, last_seen DESC LIMIT ?',
    limit
  );
}

const createMemberCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

export async function createMember(db, name, email) {
  const normalizedEmail = email.toLowerCase();
  const existing = await db.get('SELECT id, name, email, member_code, points FROM rewards_members WHERE email = ?', normalizedEmail);
  if (existing) {
    return { ok: true, member: existing, message: 'You are already enrolled.' };
  }
  const memberCode = createMemberCode();
  const now = new Date().toISOString();
  await db.run(
    'INSERT INTO rewards_members (name, email, member_code, points, created_at) VALUES (?, ?, ?, ?, ?)',
    name.trim(),
    normalizedEmail,
    memberCode,
    1,
    now
  );
  const member = await db.get('SELECT id, name, email, member_code, points FROM rewards_members WHERE email = ?', normalizedEmail);
  return { ok: true, member, message: 'Welcome to Blade Rewards.' };
}

export async function loginMember(db, email, code) {
  const normalizedEmail = email.toLowerCase();
  const member = await db.get(
    'SELECT id, name, email, member_code, points FROM rewards_members WHERE email = ? AND member_code = ?',
    normalizedEmail,
    code.trim().toUpperCase()
  );
  if (!member) {
    return { ok: false, message: 'Invalid member code.' };
  }
  return { ok: true, member };
}

export async function addMemberPoints(db, email, points) {
  const normalizedEmail = email.toLowerCase();
  const member = await db.get('SELECT points FROM rewards_members WHERE email = ?', normalizedEmail);
  if (!member) {
    return { ok: false, message: 'Member not found.' };
  }
  const updated = member.points + points;
  await db.run('UPDATE rewards_members SET points = ? WHERE email = ?', updated, normalizedEmail);
  const updatedMember = await db.get(
    'SELECT id, name, email, member_code, points FROM rewards_members WHERE email = ?',
    normalizedEmail
  );
  return { ok: true, member: updatedMember };
}

export async function listMembers(db, limit = 50) {
  return db.all(
    'SELECT id, name, email, member_code, points, created_at FROM rewards_members ORDER BY created_at DESC LIMIT ?',
    limit
  );
}
