<div align="center">

# 🎛️ DJ Mixer

### Two decks. Real beatmatching. Zero installs. It's all in your browser.

[![DJ Mixer — a two-deck browser DJ console](hero.png)](https://sudockin.github.io/dj-mixer/)

**[▶ &nbsp;TRY IT LIVE &nbsp;→ &nbsp;sudockin.github.io/dj-mixer](https://sudockin.github.io/dj-mixer/)**

![no build](https://img.shields.io/badge/build-none-2fd483?style=flat-square)
![vanilla JS](https://img.shields.io/badge/stack-vanilla%20JS-57a5ff?style=flat-square)
![runs client-side](https://img.shields.io/badge/backend-none%20·%20100%25%20client--side-ff7a3d?style=flat-square)
![GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-eceae3?style=flat-square)

</div>

---

Paste a **YouTube link**, an **audio URL**, drop in an **MP3/WAV**, or hit a **built-in beat loop** — then mix. Two decks, a crossfader, live waveforms, automatic BPM, and beatmatching that actually *holds*. No account, no download, no plugin. Just open the page.

## ✨ What it does

🎚️ **Two decks, four sources** — YouTube · audio URL · local file · generated beat loops
🌊 **Live waveforms + BPM** — automatic detection, tap-tempo fallback
🤖 **Beatmatching that holds** — SYNC with continuous phase-lock + **Auto-sync**; beat grid, drift meter, nudge
🎧 **Real mixing controls** — cue, 1/2/4/8-bar loops, quantize, smooth/linear/cut crossfader curves, pitch
📚 **A library with a memory** — auto-saves everything you play; search, favorites, history, drag & drop
📋 **Queue** — queue next, reorder, auto-advance
🔎 **Discover** — Discogs-powered "more like this" crate-digging → send picks straight to a deck
📱 **Mobile-ready** — landscape console, touch controls, safe-area aware

## 🚀 Try it

**→ [sudockin.github.io/dj-mixer](https://sudockin.github.io/dj-mixer/)**

Tip: hit **Demo Track** on both decks, press play on each, flip **Auto-sync** on — and ride the crossfader. That's a clean transition in under a minute.

## ⌨️ Shortcuts

`Q`/`W` nudge Deck A · `O`/`P` nudge Deck B · `Z`/`M` jump to cue · `G` quantize · `?` all shortcuts

## 🛠️ Under the hood

- **Single self-contained `index.html`** — no build step, no framework, no backend
- [WaveSurfer.js](https://wavesurfer.xyz/) for waveforms · Web Audio API for BPM + generated loops · YouTube IFrame API
- Continuous **phase-lock** keeps synced decks within a few ms for minutes
- Library / queue persist in `localStorage`; Discover calls the Discogs API client-side

## 🎵 Credits

Demo loops generated in-browser. Fallback tracks: **Kevin MacLeod** (CC-BY). Crate-digging data: **Discogs**.

<div align="center">

*Built for the browser. Made to mix.* 🎶

</div>
