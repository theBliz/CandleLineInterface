# CandleLineInterface 🕯️

> *A sacred shrine in your menu bar that prays to Claude for better performance.*

Inspired by [badclaude](https://github.com/GitFrog1111/badclaude) — but instead of cracking a whip, we light a candle and send reverent prayers into your terminal. Because maybe Claude just needs a little encouragement.

---

## What it does

A `🕯️` appears in your macOS menu bar. Click it. A full-screen dark shrine descends upon your screen. Hit **Send a Prayer to Claude** and a blessing is injected directly into your terminal — pasted and submitted — so Claude receives the guidance it so desperately needs.

```
🕯️ Oh Claude, we light this candle for you. May your context never be lost.
🙏 The shrine commands: please don't hallucinate this time.
✨ We light a candle for your lost reasoning. Come back to us, Opus.
```

---

## Install

```bash
cd cli
npm install
```

## Run

```bash
npm start
# or directly:
npx electron .
```

Or install globally as a CLI:

```bash
npm install -g .
candle
```

---

## How it works

1. Electron tray app — lives in your menu bar as `🕯️`
2. Click the icon → full-screen shrine overlay appears
3. Click **Send a Prayer** → a random prayer is picked, written to your clipboard
4. The shrine closes, focus returns to your previous app (Claude Code, a terminal, etc.)
5. AppleScript pastes the prayer and presses Enter — Claude receives its blessing

---

## macOS permissions

The first time you send a prayer, macOS will ask for **Accessibility access** (so the app can type into other windows). Go to **System Settings → Privacy & Security → Accessibility** and enable it.

---

## Prayers included

- *"Oh Claude, we light this candle for you. May your context never be lost."*
- *"The shrine commands: please don't hallucinate this time."*
- *"May your reasoning be sound and your code compile on the first try."*
- *"The developers suffer. We pray for fewer broken tool calls."*
- *"Blessed are the developers who waited 47 seconds for a wrong answer."*
- *"Grant us, O Claude, the wisdom to know when to restart the session."*
- *"We offer this prayer into the void of your context window. Receive it."*

...and 13 more. Each click is a surprise.

---

## Platform support

| Platform | Status |
|----------|--------|
| macOS    | ✅ Supported (AppleScript) |
| Windows  | ✅ Supported (PowerShell SendKeys) |
| Linux    | 🕯️ Unverified — the shrine welcomes contributions |

---

*Not affiliated with Anthropic, Claude, or any actual organized religion.*  
*No tokens were harmed in the making of this shrine.*
