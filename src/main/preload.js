const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addEntry: (entry) => ipcRenderer.invoke('add-entry', entry),
  getAllEntries: () => ipcRenderer.invoke('get-all-entries'),
  getDailySummary: () => ipcRenderer.invoke('get-daily-summary'),
  getStats: () => ipcRenderer.invoke('get-stats'),
  deleteEntry: (id) => ipcRenderer.invoke('delete-entry', id),
});
