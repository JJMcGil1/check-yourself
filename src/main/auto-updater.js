const { app, ipcMain } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REPO_OWNER = 'JJMcGil1';
const REPO_NAME = 'check-yourself';
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STARTUP_DELAY = 5 * 1000; // 5 seconds
const DOWNLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT = 30 * 1000; // 30 seconds
const DOWNLOAD_DIR = '/tmp/check-yourself-update';

let mainWindow = null;
let updateInfo = null;
let downloadedPath = null;
let pollTimer = null;

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || API_TIMEOUT;
    const req = https.get(url, { headers: { 'User-Agent': 'Check-Yourself-Updater' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, options).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkForUpdates() {
  try {
    const currentVersion = app.getVersion();
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
    const data = JSON.parse(await httpsGet(url));

    const latestVersion = data.tag_name.replace(/^v/, '');
    if (compareVersions(latestVersion, currentVersion) <= 0) {
      return null;
    }

    // Fetch latest.json from the release assets
    const latestJsonAsset = data.assets.find((a) => a.name === 'latest.json');
    if (!latestJsonAsset) return null;

    const latestJson = JSON.parse(await httpsGet(latestJsonAsset.browser_download_url));

    // Determine the correct DMG asset for this architecture
    const arch = process.arch; // 'arm64' or 'x64'
    const dmgName = `Check-Yourself-${latestVersion}-${arch}.dmg`;

    const dmgAsset = data.assets.find((a) => a.name === dmgName);
    if (!dmgAsset) return null;

    const platformKey = arch === 'arm64' ? 'macArm64' : 'mac';
    const expectedHash = latestJson.platforms?.[platformKey]?.sha256;

    updateInfo = {
      version: latestVersion,
      downloadUrl: dmgAsset.browser_download_url,
      expectedHash,
      releaseNotes: data.body || 'Bug fixes and improvements.',
    };

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:available', {
        version: latestVersion,
        releaseNotes: updateInfo.releaseNotes,
      });
    }

    return updateInfo;
  } catch (err) {
    console.error('Auto-updater check failed:', err.message);
    return null;
  }
}

async function downloadUpdate() {
  if (!updateInfo) throw new Error('No update available');

  try {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    const dmgPath = path.join(DOWNLOAD_DIR, `update.dmg`);

    const data = await new Promise((resolve, reject) => {
      const timeout = DOWNLOAD_TIMEOUT;
      let totalBytes = 0;
      let receivedBytes = 0;
      const chunks = [];

      const makeRequest = (url) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Check-Yourself-Updater' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return makeRequest(res.headers.location);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }

          totalBytes = parseInt(res.headers['content-length'], 10) || 0;

          res.on('data', (chunk) => {
            chunks.push(chunk);
            receivedBytes += chunk.length;
            if (totalBytes > 0 && mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('updater:progress', {
                percent: Math.round((receivedBytes / totalBytes) * 100),
                transferred: receivedBytes,
                total: totalBytes,
              });
            }
          });
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(timeout, () => {
          req.destroy();
          reject(new Error('Download timeout'));
        });
      };

      makeRequest(updateInfo.downloadUrl);
    });

    // Verify SHA256 hash
    if (updateInfo.expectedHash) {
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      if (hash !== updateInfo.expectedHash) {
        throw new Error('SHA256 hash mismatch — download may be corrupted');
      }
    }

    fs.writeFileSync(dmgPath, data);
    downloadedPath = dmgPath;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:downloaded');
    }

    // Auto-install after download
    installUpdate();
  } catch (err) {
    console.error('Auto-updater download failed:', err.message);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:error', err.message);
    }
  }
}

function installUpdate() {
  if (!downloadedPath || !fs.existsSync(downloadedPath)) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:error', 'Downloaded file not found');
    }
    return;
  }

  try {
    const appPath = path.dirname(app.getPath('exe')).replace(/\/Contents\/MacOS$/, '');
    const mountPoint = '/tmp/check-yourself-dmg';

    // Unmount if previously mounted
    try { execSync(`hdiutil detach "${mountPoint}" -quiet -force`); } catch (_) {}

    // Mount DMG
    fs.mkdirSync(mountPoint, { recursive: true });
    execSync(`hdiutil attach "${downloadedPath}" -mountpoint "${mountPoint}" -nobrowse -quiet`);

    // Find the .app in the mounted DMG
    const items = fs.readdirSync(mountPoint);
    const appBundle = items.find((i) => i.endsWith('.app'));
    if (!appBundle) throw new Error('No .app found in DMG');

    const source = path.join(mountPoint, appBundle);

    // Copy new app over old app
    execSync(`rm -rf "${appPath}"`);
    execSync(`cp -R "${source}" "${appPath}"`);
    execSync(`xattr -cr "${appPath}"`);

    // Unmount and clean up
    execSync(`hdiutil detach "${mountPoint}" -quiet -force`);
    fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });

    // Relaunch
    app.relaunch();
    app.exit(0);
  } catch (err) {
    console.error('Auto-updater install failed:', err.message);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:error', err.message);
    }
  }
}

function initAutoUpdater(win) {
  mainWindow = win;

  // IPC handlers
  ipcMain.handle('updater:check', async () => {
    const result = await checkForUpdates();
    return result ? { version: result.version, releaseNotes: result.releaseNotes } : null;
  });

  ipcMain.handle('updater:download', () => downloadUpdate());

  ipcMain.handle('updater:install', () => installUpdate());

  ipcMain.handle('updater:dismiss', () => {
    updateInfo = null;
    downloadedPath = null;
  });

  // Start polling after a delay
  setTimeout(() => {
    checkForUpdates();
    pollTimer = setInterval(checkForUpdates, POLL_INTERVAL);
  }, STARTUP_DELAY);
}

module.exports = { initAutoUpdater };
