const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'check-yourself.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS temptations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      what       TEXT    NOT NULL,
      category   TEXT    DEFAULT 'food',
      choice     TEXT    NOT NULL CHECK(choice IN ('good', 'bad')),
      amount     REAL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_temptations_created_at ON temptations(created_at);
  `);

  return db;
}

function addEntry({ what, category, choice, amount }) {
  const stmt = db.prepare(
    'INSERT INTO temptations (what, category, choice, amount) VALUES (?, ?, ?, ?)'
  );
  return stmt.run(what, category || 'food', choice, amount || null);
}

function getAllEntries() {
  return db.prepare('SELECT * FROM temptations ORDER BY created_at DESC').all();
}

function getDailySummary() {
  return db.prepare(`
    SELECT
      date(created_at) as date,
      SUM(CASE WHEN choice = 'good' THEN 1 ELSE 0 END) as good,
      SUM(CASE WHEN choice = 'bad' THEN 1 ELSE 0 END) as bad
    FROM temptations
    WHERE created_at >= datetime('now', '-30 days', 'localtime')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();
}

function getStats() {
  return db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN choice = 'good' THEN 1 ELSE 0 END) as good,
      SUM(CASE WHEN choice = 'bad' THEN 1 ELSE 0 END) as bad
    FROM temptations
  `).get();
}

function deleteEntry(id) {
  return db.prepare('DELETE FROM temptations WHERE id = ?').run(id);
}

module.exports = { initDatabase, addEntry, getAllEntries, getDailySummary, getStats, deleteEntry };
