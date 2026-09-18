const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mainAPI', {
    settings: () => ipcRenderer.send('settings-window'),
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    resize: (mode) => ipcRenderer.send('resize-window', mode),
    close: () => ipcRenderer.send('close-window'),
    savesession: (data) => ipcRenderer.send('save-session', data),
    setAlwaysOnTop: (isAlwaysOnTop) => ipcRenderer.send('set-always-on-top', isAlwaysOnTop),
    loadanalytics: (weeksAgo) => ipcRenderer.invoke('load-analytics', weeksAgo),
    restoreWindow: () => ipcRenderer.send('restore-window'),
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    downloadUpdate: () => ipcRenderer.send('download-update'),
    restartApp: () => ipcRenderer.send('restart-app'),
    onUpdateMessage: (callback) => ipcRenderer.on('update-message', (event, message) => callback(message)),
    getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
    getVersion: () => ipcRenderer.invoke('get-version') 
});