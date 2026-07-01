# 🎛️ DJ Mixer — v1.0.0 "Drop the Needle"

**A full two-deck DJ console that runs entirely in your browser.** No installs, no logins, no plugins — just open the page and mix. YouTube, audio URLs, your own files, or built-in beat loops. Real waveforms, real beatmatching, and a library that remembers everything you play.

👉 **Live:** https://sudockin.github.io/dj-mixer/

---

## ✨ What's inside

### 🎚️ Two decks, four ways to load
Drop in a **YouTube** link, a direct **audio URL**, a **local file**, or the built-in **demo loops** — each deck handles all four, with graceful error handling for embeds, bot checks, timeouts, and CORS.

### 🌊 Real waveforms + BPM
Uploaded and CORS-friendly tracks render a live **waveform** with automatic **BPM detection** and a **tap-tempo** fallback. Normalized into a practical 80–180 DJ range.

### 🧲 Beatmatching that actually holds
Hit **SYNC** and the follower deck locks to the master's tempo *and* phase — then a continuous **phase-lock** keeps it there. Verified to hold within a few milliseconds for minutes, not seconds. Plus a **beat grid** on the waveform, a **drift meter** by the crossfader, and **nudge** controls for hands-on alignment.

### 🎧 Real mixing controls
- **Cue** — set & jump, with a marker on the waveform
- **Loops** — 1 / 2 / 4 / 8 bars, beat-perfect and sync-safe
- **Quantize** — snap cues & loops to the beat
- **Crossfader curves** — Smooth (equal-power), Linear, or Cut
- **Pitch / tempo** fader, per-deck volume, keyboard shortcuts

### 📚 Music Library (it remembers)
Every track you load is **saved automatically** — title, artist, source, duration, BPM, date, and play count. Browse **Recently Loaded**, **Favorites ❤️**, and date-grouped **History**, **search** instantly, and reload to either deck in one click. **Drag & drop** files or links straight onto a deck. Everything persists across refreshes.

### 📱 Mobile-ready
A dedicated landscape layout keeps both decks and the crossfader on screen, with touch-friendly controls, safe-area support for notches, and a friendly rotate prompt in portrait.

---

## ⌨️ Keyboard shortcuts
`Q`/`W` nudge Deck A · `O`/`P` nudge Deck B · `Z`/`M` jump to cue · `G` quantize · `?` shortcuts panel

---

## 🔭 On the horizon
Queue & auto-advance · Collections/crates · 3-band EQ + VU meters · session save/load · smart BPM/key crates · and a mix-history timeline so you can replay your own sets.

*Built for the browser. Made to mix.* 🎶

---

<sub>v1.0.0 · runs 100% client-side · no account required</sub>
