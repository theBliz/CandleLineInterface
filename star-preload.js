'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('starBtn', {
  openGithub: () => ipcRenderer.send('open-github'),
})
