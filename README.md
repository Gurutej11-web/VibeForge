# ⚡ VibeForge — AI-Powered Music Creation Studio

A full music production experience in the browser. Describe a mood, pick a genre and BPM — Groq AI generates your chord progression and bassline. Then layer sounds with a step sequencer, playable keyboard, drum machine, and chord pads. Everything visualizes in real time as an audio-reactive particle field.

**[→ Open Studio](studio.html) · [→ Gallery](gallery.html)**

---

## Features

| Feature | Details |
|---|---|
| 🤖 AI Track Starter | Groq generates chords, bassline, scale & creative direction from mood + genre + BPM |
| 🎛️ Step Sequencer | 16-step multi-row grid (kick, snare, hi-hat, bass, lead + custom rows) |
| 🎹 Playable Keyboard | 2-octave keyboard, mouse or QWERTY keys, scale highlighting |
| 🥁 Drum Machine | 4×4 pad grid, 4 kit types (Acoustic / Electronic / Lo-Fi / Trap) |
| 🎼 Chord Pads | 8 pads pre-loaded from AI progression, ripple animation on tap |
| 🎚️ Mixer | Channel strips with faders, mute/solo, live level meters |
| 🔊 Effects Rack | Reverb · Delay (BPM-sync'd) · Distortion |
| ✨ AI Melody Generator | Second AI call generates an 8–16 note melodic phrase in the current scale |
| 🌀 Visualizer | Particle Field · Waveform · Frequency Bars — all audio-reactive at 60fps |
| ⬇️ Export | Record & download your track as a WebM audio file |
| 🎵 Presets | 6 built-in tracks: Lo-Fi · Cinematic · Trap · Jazz · Dreamy · EDM |

---

## Keyboard Shortcuts

| Keys | Action |
|---|---|
| `Space` | Play / Stop |
| `A S D F G H J K` | White keys (C–C) |
| `W E T Y U` | Black keys (C#–A#) |
| `Q W E R` | Drum pads row 1 (Kick, Snare, Hi-Hat, Open Hat) |
| `Z X C V` | Drum pads row 2 |
| `1 2 3 4 5 6 7 8` | Drum pads rows 3–4 |

---

## Setup

This is a zero-install browser app — open `index.html` directly or serve the folder:

```bash
python3 -m http.server 3456
# then open http://localhost:3456
```

### Groq API Key

1. Get a free key at [console.groq.com](https://console.groq.com)
2. Enter it in the **Generate Track** modal when you open the studio (it's saved to localStorage)
3. Or: copy `config.example.js` → `config.js` and paste your key there

---

## Tech Stack

- **Sound**: Web Audio API (OscillatorNode, WaveShaperNode, ConvolverNode, DelayNode, AnalyserNode)
- **Sequencer**: `setInterval`-based tick engine at 16th-note resolution
- **Visualizer**: Canvas + `requestAnimationFrame` at 60fps
- **AI**: Groq API (`llama-3.3-70b-versatile`) for chord progressions and melodies
- **Export**: MediaRecorder API → WebM Blob → anchor download
- **Zero dependencies**: no frameworks, no build step, pure HTML/CSS/JS
