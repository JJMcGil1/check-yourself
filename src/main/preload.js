const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addEntry: (entry) => ipcRenderer.invoke('add-entry', entry),
  getAllEntries: () => ipcRenderer.invoke('get-all-entries'),
  getDailySummary: () => ipcRenderer.invoke('get-daily-summary'),
  getStats: () => ipcRenderer.invoke('get-stats'),
  deleteEntry: (id) => ipcRenderer.invoke('delete-entry', id),
});

contextBridge.exposeInMainWorld('electron', {
  version: null, // Will be populated asynchronously
  getVersion: () => ipcRenderer.invoke('get-version'),
});

contextBridge.exposeInMainWorld('updater', {
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  dismissUpdate: () => ipcRenderer.invoke('updater:dismiss'),
  onUpdateAvailable: (cb) => {
    const listener = (_e, info) => cb(info);
    ipcRenderer.on('updater:available', listener);
    return () => ipcRenderer.removeListener('updater:available', listener);
  },
  onDownloadProgress: (cb) => {
    const listener = (_e, progress) => cb(progress);
    ipcRenderer.on('updater:progress', listener);
    return () => ipcRenderer.removeListener('updater:progress', listener);
  },
  onUpdateDownloaded: (cb) => {
    const listener = () => cb();
    ipcRenderer.on('updater:downloaded', listener);
    return () => ipcRenderer.removeListener('updater:downloaded', listener);
  },
  onUpdateError: (cb) => {
    const listener = (_e, err) => cb(err);
    ipcRenderer.on('updater:error', listener);
    return () => ipcRenderer.removeListener('updater:error', listener);
  },
});
