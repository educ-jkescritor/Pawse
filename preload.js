const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mainAPI', {
    settings: () => ipcRenderer.send('settings-window'),
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    resize: (mode) => ipcRenderer.send('resize-window', mode),
    close: () => ipcRenderer.send('close-window'),
    savesession: (data) => ipcRenderer.send('save-session', data),
    setAlwaysOnTop: (isAlwaysOnTop) => ipcRenderer.send('set-always-on-top', isAlwaysOnTop),
    loadanalytics: () => ipcRenderer.invoke('load-analytics')
});