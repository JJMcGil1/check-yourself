const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
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

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 700,
    minWidth: 640,
    minHeight: 500,
    icon: path.join(app.getAppPath(), 'assets/icon.png'),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#0C0C0E',
    vibrancy: undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
};

app.whenReady().then(() => {
  initDatabase();

  ipcMain.handle('add-entry', (_e, entry) => addEntry(entry));
  ipcMain.handle('get-all-entries', () => getAllEntries());
  ipcMain.handle('get-daily-summary', () => getDailySummary());
  ipcMain.handle('get-stats', () => getStats());
  ipcMain.handle('delete-entry', (_e, id) => deleteEntry(id));
  ipcMain.handle('get-version', () => app.getVersion());

  // Set dock icon in dev mode (macOS ignores BrowserWindow icon option)
  if (!app.isPackaged && process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(app.getAppPath(), 'assets/icon.png'));
  }

  createWindow();

  // Start auto-updater in production
  if (app.isPackaged) {
    const { initAutoUpdater } = require('./auto-updater');
    initAutoUpdater(mainWindow);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
