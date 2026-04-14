'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('widget', {
  sendPrayer:  ()         => ipcRenderer.send('widget-send-prayer'),
  onPrayerSent:(fn)       => ipcRenderer.on('widget-prayer-sent', (_, prayer) => fn(prayer)),
  dragStart:   (x, y)    => ipcRenderer.send('widget-drag-start', { x, y }),
  dragMove:    (x, y)    => ipcRenderer.send('widget-drag-move',  { x, y }),
  dragEnd:     ()         => ipcRenderer.send('widget-drag-end'),
})
