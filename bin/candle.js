#!/usr/bin/env node
'use strict'

const { spawn } = require('child_process')
const path = require('path')

let electron
try {
  electron = require('electron')
} catch {
  console.error('Electron not found. Run: npm install inside the cli/ directory.')
  process.exit(1)
}

const child = spawn(electron, [path.join(__dirname, '..')], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
})

child.on('error', (err) => {
  console.error('Failed to start the shrine:', err.message)
})

child.unref()
