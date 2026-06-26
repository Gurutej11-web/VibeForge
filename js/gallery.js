// Gallery page
const TRACKS = [
  { id: 'lofi', title: 'Midnight Rain', mood: 'melancholic', genre: 'lo-fi', bpm: 75, preset: 'lofi', direction: 'Dusty vinyl afternoon — sip slow, let the chords hang.', moodColor: '#6366F1' },
  { id: 'cinematic', title: 'Starfall', mood: 'dreamy', genre: 'cinematic', bpm: 60, preset: 'cinematic', direction: 'Epic space — vast chords building toward an emotional peak.', moodColor: '#06B6D4' },
  { id: 'trap', title: 'Dark Energy', mood: 'aggressive', genre: 'hip-hop', bpm: 140, preset: 'trap', direction: '808s sliding through dark minor chords — relentless energy.', moodColor: '#FF4500' },
  { id: 'jazz', title: 'Blue Hours', mood: 'happy', genre: 'jazz', bpm: 120, preset: 'jazz', direction: 'Late-night jazz club — brushed snare, walking bass, warm chords.', moodColor: '#F59E0B' },
  { id: 'dreamy', title: 'Cloud Nine', mood: 'dreamy', genre: 'electronic', bpm: 80, preset: 'dreamy', direction: 'Floating between dreams — soft pads, reverb-soaked melody, no rush.', moodColor: '#06B6D4' },
  { id: 'edm', title: 'Euphoria', mood: 'euphoric', genre: 'electronic', bpm: 128, preset: 'edm', direction: 'Festival energy — massive drops, euphoric chords, unrelenting groove.', moodColor: '#A855F7' },
];

const MOOD_BG = {
  melancholic: 'rgba(99,102,241,0.15)',
  dreamy: 'rgba(6,182,212,0.15)',
  aggressive: 'rgba(255,69,0,0.15)',
  happy: 'rgba(245,158,11,0.15)',
  euphoric: 'rgba(168,85,247,0.15)',
  tense: 'rgba(239,68,68,0.15)',
};

function drawWaveform(canvas, color) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 320;
  const H = canvas.height = 80 * window.devicePixelRatio || 80;
  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();

  const points = 80;
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * W;
    const amp = (Math.sin(i * 0.3) * 0.4 + Math.sin(i * 0.7) * 0.3 + Math.sin(i * 1.3) * 0.2 + Math.random() * 0.1) * H * 0.35;
    const y = H / 2 + amp;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fill
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function renderTracks(filter = 'all') {
  const grid = document.getElementById('tracks-grid');
  grid.innerHTML = '';

  const filtered = filter === 'all' ? TRACKS : TRACKS.filter(t => t.genre === filter);

  filtered.forEach((track, i) => {
    const card = document.createElement('div');
    card.className = 'track-card';
    card.dataset.genre = track.genre;
    card.style.animationDelay = `${i * 60}ms`;

    card.innerHTML = `
      <div class="track-waveform">
        <canvas id="wv-${track.id}"></canvas>
      </div>
      <div class="track-body">
        <div class="track-meta">
          <span class="track-mood" style="background:${MOOD_BG[track.mood]};color:${track.moodColor}">${track.mood}</span>
          <span class="track-genre">${track.genre}</span>
          <span class="track-bpm">${track.bpm} BPM</span>
        </div>
        <div class="track-title">${track.title}</div>
        <div class="track-direction">"${track.direction}"</div>
        <div class="track-actions">
          <button class="btn-play-preview" data-id="${track.id}">▶ Preview</button>
          <a class="btn-remix" href="studio.html?preset=${track.preset}">↗ Remix</a>
        </div>
      </div>
    `;

    grid.appendChild(card);

    // Draw static waveform
    requestAnimationFrame(() => {
      const canvas = document.getElementById(`wv-${track.id}`);
      if (canvas) drawWaveform(canvas, track.moodColor);
    });
  });

  // Preview buttons — play tones
  document.querySelectorAll('.btn-play-preview').forEach(btn => {
    btn.addEventListener('click', () => {
      const isPlaying = btn.classList.contains('playing');
      document.querySelectorAll('.btn-play-preview.playing').forEach(b => {
        b.classList.remove('playing');
        b.textContent = '▶ Preview';
      });
      if (!isPlaying) {
        btn.classList.add('playing');
        btn.textContent = '⏸ Playing';
        // Simple audio preview using Web Audio
        playPreview(btn.dataset.id);
        setTimeout(() => {
          btn.classList.remove('playing');
          btn.textContent = '▶ Preview';
        }, 4000);
      }
    });
  });
}

let previewCtx = null;
function playPreview(id) {
  const track = TRACKS.find(t => t.id === id);
  if (!track) return;

  if (!previewCtx) previewCtx = new (window.AudioContext || window.webkitAudioContext)();

  const gain = previewCtx.createGain();
  gain.gain.value = 0.3;
  gain.connect(previewCtx.destination);

  const chordMap = {
    lofi: [[261.63, 311.13, 392.00]],
    cinematic: [[261.63, 329.63, 392.00]],
    trap: [[293.66, 349.23, 440.00]],
    jazz: [[293.66, 369.99, 440.00, 554.37]],
    dreamy: [[261.63, 329.63, 392.00, 493.88]],
    edm: [[220.00, 261.63, 329.63]],
  };

  const chords = chordMap[id] || chordMap.lofi;
  chords[0].forEach(freq => {
    const osc = previewCtx.createOscillator();
    const g = previewCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.15, previewCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, previewCtx.currentTime + 3.5);
    osc.connect(g);
    g.connect(gain);
    osc.start();
    osc.stop(previewCtx.currentTime + 3.5);
  });
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTracks(btn.dataset.filter);
  });
});

// Background canvas
const canvas = document.getElementById('bg-canvas');
const ctx2d = canvas.getContext('2d');
let W, H, bgParticles = [];

function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

class BGParticle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W; this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
    this.r = Math.random() * 1.5 + 0.3;
    this.alpha = Math.random() * 0.4 + 0.05;
    const colors = ['#A855F7', '#06B6D4', '#EC4899'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    ctx2d.beginPath(); ctx2d.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx2d.fillStyle = this.color; ctx2d.globalAlpha = this.alpha; ctx2d.fill();
  }
}

resize();
window.addEventListener('resize', resize);
for (let i = 0; i < 80; i++) bgParticles.push(new BGParticle());

function bgLoop() {
  ctx2d.clearRect(0, 0, W, H);
  bgParticles.forEach(p => { p.update(); p.draw(); });
  ctx2d.globalAlpha = 1;
  requestAnimationFrame(bgLoop);
}
bgLoop();

// Initial render
renderTracks();
