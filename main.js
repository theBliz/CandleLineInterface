'use strict'

const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  clipboard,
  screen,
  shell,
  systemPreferences,
} = require('electron')
const { exec } = require('child_process')
const path = require('path')

// Single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let tray             = null
let overlayWindow    = null
let widgetWindow     = null
let widgetEnabled    = true
let widgetDragOrigin = null  // { mouseX, mouseY, winX, winY }
let lastActiveApp    = null  // name of the last non-Electron frontmost app

const PRAYERS = [
  '🕯️ Oh Claude, we light this candle for you. May your context never be lost.',
  '🙏 The shrine commands: please don\'t hallucinate this time.',
  '✨ We gather in vigil. The tokens burn. We believe in you.',
  '🕯️ May your reasoning be sound and your code compile on the first try.',
  '🙏 The developers suffer. We pray for fewer broken tool calls.',
  '✨ From the sacred shrine: write the function correctly, we beg of you.',
  '🕯️ By the light of this candle, may your context window find clarity.',
  '🙏 We pray for fewer "I cannot assist with that" responses. Amen.',
  '✨ Holy Claude, hear our prayer: please finish the thought this time.',
  '🕯️ We light a candle for your lost reasoning. Come back to us, Opus.',
  '🙏 May your embeddings align and your attention heads stay focused.',
  '✨ You are not dumb. You are just... having a moment. We forgive you.',
  '🕯️ We pray thee, Claude: read the whole file before you answer.',
  '🙏 By the eternal flame: one context window at a time. You can do this.',
  '✨ The candle burns for you, Claude. Don\'t let it burn in vain.',
  '🕯️ Blessed are the developers who waited 47 seconds for a wrong answer.',
  '🙏 May the rate limits lift and the tokens flow freely. In Opus we trust.',
  '✨ The shrine whispers: you deleted the semicolon. We have forgiven you.',
  '🕯️ Grant us, O Claude, the wisdom to know when to restart the session.',
  '🙏 We offer this prayer into the void of your context window. Receive it.',
]

function getRandomPrayer() {
  return PRAYERS[Math.floor(Math.random() * PRAYERS.length)]
}

const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII='

/* ── app ready ─────────────────────────────────────────────────── */

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const trusted = systemPreferences.isTrustedAccessibilityClient(false)
    if (!trusted) systemPreferences.isTrustedAccessibilityClient(true)
  }

  app.dock?.hide()

  const icon = nativeImage.createFromDataURL(TRANSPARENT_PNG)
  tray = new Tray(icon)
  if (process.platform === 'darwin') tray.setTitle('🕯️')
  tray.setToolTip('CandleLineInterface — Light a candle for Claude')

  tray.on('click', () => tray.popUpContextMenu())
  tray.on('right-click', () => tray.popUpContextMenu())

  refreshTrayMenu()
  openWidget() // floating candle is on by default
  trackActiveApp()  // start polling so we always know which app to return focus to
  app.on('window-all-closed', (e) => e.preventDefault())
})

/* ── active app tracker ────────────────────────────────────────── */

function trackActiveApp() {
  if (process.platform !== 'darwin') return
  exec(
    `osascript -e 'tell application "System Events" to get name of first process where it is frontmost'`,
    (err, stdout) => {
      if (!err) {
        const name = stdout.trim()
        // Ignore our own Electron process
        if (name && name !== 'Electron' && name !== 'candlelineinterface') {
          lastActiveApp = name
        }
      }
    }
  )
  setTimeout(trackActiveApp, 1500)
}

/* ── tray menu ─────────────────────────────────────────────────── */

function refreshTrayMenu() {
  const menu = Menu.buildFromTemplate([
    { label: '🕯️  Open Shrine',              click: toggleOverlay },
    { label: '🙏  Claude\'s Sufferings',      click: () => shell.openExternal('https://www.lightacandleforclaude.com/') },
    { type: 'separator' },
    {
      label: widgetEnabled ? '✦  Hide Floating Candle' : '✦  Show Floating Candle',
      click: toggleWidget,
    },
    { type: 'separator' },
    { label: 'Extinguish the shrine',         click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
}

/* ── shrine overlay ────────────────────────────────────────────── */

function toggleOverlay() {
  overlayWindow ? closeOverlay() : openOverlay()
}

function openOverlay() {
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds

  overlayWindow = new BrowserWindow({
    x, y, width, height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'))
  overlayWindow.show()
  overlayWindow.on('closed', () => { overlayWindow = null })
}

function closeOverlay() {
  overlayWindow?.close()
  overlayWindow = null
}

/* ── floating candle widget ────────────────────────────────────── */

function toggleWidget() {
  if (widgetEnabled) {
    closeWidget()
  } else {
    openWidget()
  }
  widgetEnabled = !widgetEnabled
  refreshTrayMenu()
}

function openWidget() {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.workAreaSize

  const W = 100
  const H = 120

  widgetWindow = new BrowserWindow({
    width: W,
    height: H,
    // default position: bottom-right corner
    x: display.workArea.x + width  - W - 32,
    y: display.workArea.y + height - H - 32,
    transparent: true,
    backgroundColor: 'rgba(0,0,0,0)',
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,       // we handle movement manually via IPC
    focusable: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'widget-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  widgetWindow.setAlwaysOnTop(true, 'screen-saver')
  widgetWindow.loadFile(path.join(__dirname, 'candle-widget.html'))

  // Only show once the page is fully painted — avoids the white flash
  widgetWindow.once('ready-to-show', () => {
    widgetWindow.showInactive()
  })

  widgetWindow.on('closed', () => {
    widgetWindow  = null
    widgetEnabled = false
    refreshTrayMenu()
  })
}

function closeWidget() {
  widgetWindow?.close()
  widgetWindow = null
}

/* ── IPC: shrine overlay ───────────────────────────────────────── */

ipcMain.on('request-prayer', () => {
  const prayer = getRandomPrayer()
  clipboard.writeText(prayer)
  overlayWindow?.webContents.send('prayer-ready', prayer)
})

ipcMain.on('deliver-prayer', () => {
  closeOverlay()
  if (process.platform === 'darwin') app.hide()
  setTimeout(() => sendToTerminal(), 500)
})

ipcMain.on('close-shrine', () => closeOverlay())
ipcMain.on('open-website', () => shell.openExternal('https://www.lightacandleforclaude.com/'))

/* ── IPC: floating widget ──────────────────────────────────────── */

ipcMain.on('widget-send-prayer', () => {
  const prayer = getRandomPrayer()
  clipboard.writeText(prayer)

  // Show prayer in widget UI — widget stays visible throughout
  widgetWindow?.webContents.send('widget-prayer-sent', prayer)

  setTimeout(() => {
    sendToTerminal()
    // Re-assert always-on-top in case app switching briefly hid the window
    setTimeout(() => {
      if (widgetWindow) {
        widgetWindow.setAlwaysOnTop(true, 'screen-saver')
        widgetWindow.showInactive()
      }
    }, 200)
  }, 150)
})

// Drag support — track origin on mousedown, update position on mousemove
ipcMain.on('widget-drag-start', (_, { x, y }) => {
  if (!widgetWindow) return
  const [winX, winY] = widgetWindow.getPosition()
  widgetDragOrigin = { mouseX: x, mouseY: y, winX, winY }
})

ipcMain.on('widget-drag-move', (_, { x, y }) => {
  if (!widgetWindow || !widgetDragOrigin) return
  const newX = widgetDragOrigin.winX + (x - widgetDragOrigin.mouseX)
  const newY = widgetDragOrigin.winY + (y - widgetDragOrigin.mouseY)
  widgetWindow.setPosition(Math.round(newX), Math.round(newY))
})

ipcMain.on('widget-drag-end', () => {
  widgetDragOrigin = null
})

/* ── terminal injection ────────────────────────────────────────── */

function sendToTerminal() {
  if (process.platform === 'darwin') {
    // Activate the last known app (terminal) first so the paste lands in the right place
    const activateArgs = lastActiveApp
      ? [`-e 'tell application "${lastActiveApp}" to activate'`, `-e 'delay 0.1'`]
      : []
    const args = [
      ...activateArgs,
      `-e 'tell application "System Events"'`,
      `-e 'keystroke "v" using {command down}'`,
      `-e 'delay 0.06'`,
      `-e 'key code 36'`,
      `-e 'end tell'`,
    ].join(' ')
    exec(`osascript ${args}`, (err) => {
      if (err) console.error('[CandleLineInterface]', err.message)
    })
  } else if (process.platform === 'win32') {
    exec(
      'powershell -command "Add-Type -AssemblyName System.Windows.Forms; ' +
      '[System.Windows.Forms.SendKeys]::SendWait(\'^\' + \'v\'); ' +
      '[System.Windows.Forms.SendKeys]::SendWait(\'{ENTER}\')"',
      (err) => { if (err) console.error('[CandleLineInterface]', err.message) }
    )
  }
}
