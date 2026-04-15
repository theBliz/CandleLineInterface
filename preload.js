'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('shrine', {
  requestPrayer: () => ipcRenderer.send('request-prayer'),
  onPrayerReady: (fn) => ipcRenderer.on('prayer-ready', (_, prayer) => fn(prayer)),
  deliverPrayer: () => ipcRenderer.send('deliver-prayer'),
  closeShrine: () => ipcRenderer.send('close-shrine'),
  openWebsite: () => ipcRenderer.send('open-website'),
  openGithub:  () => ipcRenderer.send('open-github'),
})
