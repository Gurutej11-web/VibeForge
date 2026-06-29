/* VibeForge Landing Page JS */

// ===== CUSTOM CURSOR =====
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
if (cursorDot && cursorRing) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursorDot.style.left = mx + 'px'; cursorDot.style.top = my + 'px';
  });
  const animCursor = () => {
    rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
    cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  };
  animCursor();
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
  });
}

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 30), { passive: true });

// ===== MOBILE MENU =====
document.getElementById('nav-mobile-toggle')?.addEventListener('click', () =>
  document.getElementById('mobile-menu')?.classList.toggle('open'));

// ===== TYPING ANIMATION =====
const phrases = ['No Experience Needed.', 'Make It in Minutes.', 'Export Real Audio.', 'Sound Like a Pro.', 'Start Right Now.'];
let phraseIdx = 0, charIdx = 0, deleting = false;
const typingEl = document.getElementById('typing-text');
function typeStep() {
  if (!typingEl) return;
  const cur = phrases[phraseIdx];
  typingEl.textContent = deleting ? cur.slice(0, charIdx--) : cur.slice(0, charIdx++);
  let delay = deleting ? 38 : 68;
  if (!deleting && charIdx > cur.length) { delay = 2400; deleting = true; }
  if (deleting && charIdx < 0) { deleting = false; charIdx = 0; phraseIdx = (phraseIdx + 1) % phrases.length; delay = 350; }
  setTimeout(typeStep, delay);
}
setTimeout(typeStep, 900);

// ===== BG PARTICLE CANVAS =====
const bgCanvas = document.getElementById('bg-canvas');
if (bgCanvas) {
  const bgCtx = bgCanvas.getContext('2d');
  const resize = () => { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });
  const pts = Array.from({ length: 75 }, () => ({
    x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height,
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
    r: Math.random() * 1.5 + 0.3, a: Math.random() * 0.3 + 0.05
  }));
  const COLS = ['168,85,247','6,182,212','16,185,129'];
  (function drawBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    pts.forEach((p, i) => {
      p.x = (p.x + p.vx + bgCanvas.width) % bgCanvas.width;
      p.y = (p.y + p.vy + bgCanvas.height) % bgCanvas.height;
      bgCtx.globalAlpha = p.a;
      bgCtx.fillStyle = `rgb(${COLS[i % COLS.length]})`;
      bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2); bgCtx.fill();
    });
    for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++) {
      const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y, d = Math.hypot(dx,dy);
      if (d < 110) { bgCtx.globalAlpha = 0.035*(1-d/110); bgCtx.strokeStyle='#A855F7'; bgCtx.lineWidth=0.5; bgCtx.beginPath(); bgCtx.moveTo(pts[i].x,pts[i].y); bgCtx.lineTo(pts[j].x,pts[j].y); bgCtx.stroke(); }
    }
    bgCtx.globalAlpha = 1;
    requestAnimationFrame(drawBg);
  })();
}

// ===== ANIMATED MOCK SEQUENCER =====
const MOCK_BPM = 75;
const mockStepMs = (60 / MOCK_BPM / 4) * 1000;
const mockPats = {
  kick:  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
  snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
  hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  bass:  [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0]
};
const chordBeats = [0, 4, 8, 12];
let mockStep = 0;

setInterval(() => {
  // Advance playhead
  document.querySelectorAll('.mc.playhead,.mc.playhead-off').forEach(el => el.classList.remove('playhead','playhead-off'));
  document.querySelectorAll(`.mc[data-beat="${mockStep}"]`).forEach(el =>
    el.classList.add(el.classList.contains('on') ? 'playhead' : 'playhead-off'));
  setTimeout(() => document.querySelectorAll('.mc.playhead-off').forEach(el => el.classList.remove('playhead-off')), mockStepMs * 0.65);

  // Flash chord pad on beats
  if (chordBeats.includes(mockStep)) {
    const idx = chordBeats.indexOf(mockStep);
    const el = document.getElementById(`mock-chord-${idx}`);
    el?.classList.add('flash');
    setTimeout(() => el?.classList.remove('flash'), 280);
  }
  // BPM pulse
  if (mockStep % 4 === 0) {
    const b = document.getElementById('mock-bpm-num');
    if (b) { b.style.color = '#06B6D4'; setTimeout(() => { b.style.color = ''; }, 120); }
  }
  mockStep = (mockStep + 1) % 16;
}, mockStepMs);

// ===== LIVE DEMO AUDIO =====
let demoCtx = null, demoPlaying = false, demoTimer = null, demoStep = 0;

function playDemoStep() {
  if (!demoCtx || !demoPlaying) return;
  const master = demoCtx._master;
  const t = demoCtx.currentTime + 0.01;
  const bpmS = 60 / MOCK_BPM / 4;
  const s = demoStep % 16;

  if (mockPats.kick[s]) {
    const o = demoCtx.createOscillator(), g = demoCtx.createGain();
    o.frequency.setValueAtTime(58, t); o.frequency.exponentialRampToValueAtTime(26, t+0.18);
    g.gain.setValueAtTime(0.85, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.45);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+0.46);
  }
  if (mockPats.snare[s]) {
    const buf = demoCtx.createBuffer(1, demoCtx.sampleRate*0.13, demoCtx.sampleRate);
    const d = buf.getChannelData(0); for (let i=0;i<buf.length;i++) d[i]=Math.random()*2-1;
    const n=demoCtx.createBufferSource(), f=demoCtx.createBiquadFilter(), g=demoCtx.createGain();
    n.buffer=buf; f.type='bandpass'; f.frequency.value=1600;
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.13);
    n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+0.14);
  }
  if (mockPats.hihat[s]) {
    const buf=demoCtx.createBuffer(1,demoCtx.sampleRate*0.04,demoCtx.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<buf.length;i++) d[i]=Math.random()*2-1;
    const n=demoCtx.createBufferSource(), f=demoCtx.createBiquadFilter(), g=demoCtx.createGain();
    n.buffer=buf; f.type='highpass'; f.frequency.value=9000;
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.045);
    n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+0.05);
  }
  if (mockPats.bass[s]) {
    const notes=[65.41,65.41,43.65,65.41,87.31,65.41,43.65,65.41];
    const o=demoCtx.createOscillator(), fi=demoCtx.createBiquadFilter(), g=demoCtx.createGain();
    o.type='sawtooth'; o.frequency.value=notes[(s>>1)%notes.length];
    fi.type='lowpass'; fi.frequency.value=360;
    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t+bpmS*0.85);
    o.connect(fi); fi.connect(g); g.connect(master); o.start(t); o.stop(t+bpmS);
  }
  if (s%8===0) {
    const chords=[[130.81,155.56,196],[174.61,207.65,261.63],[196,233.08,293.66],[233.08,277.18,349.23]];
    chords[(s>>3)%chords.length].forEach(freq=>{
      const o=demoCtx.createOscillator(), g=demoCtx.createGain();
      o.type='triangle'; o.frequency.value=freq;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.11,t+0.06);
      g.gain.exponentialRampToValueAtTime(0.001,t+bpmS*7.5);
      o.connect(g); g.connect(master); o.start(t); o.stop(t+bpmS*8);
    });
  }
  demoStep++;
  demoTimer = setTimeout(playDemoStep, bpmS * 1000);
}

document.getElementById('hero-play-demo')?.addEventListener('click', function() {
  if (!demoPlaying) {
    demoCtx = new (window.AudioContext || window.webkitAudioContext)();
    demoCtx._master = demoCtx.createGain(); demoCtx._master.gain.value = 0.5;
    // Reverb
    const rev=demoCtx.createConvolver(), rg=demoCtx.createGain(); rg.gain.value=0.25;
    const ir=demoCtx.createBuffer(2,demoCtx.sampleRate*1.5,demoCtx.sampleRate);
    for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<ir.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/ir.length,3);}
    rev.buffer=ir; demoCtx._master.connect(rev); rev.connect(rg); rg.connect(demoCtx.destination);
    demoCtx._master.connect(demoCtx.destination);
    demoPlaying = true; demoStep = 0;
    document.getElementById('demo-icon').textContent = '⏸';
    document.getElementById('demo-label').textContent = 'Stop Demo';
    this.style.borderColor = 'var(--accent-purple)';
    playDemoStep();
  } else {
    demoPlaying = false; clearTimeout(demoTimer);
    demoCtx?.close(); demoCtx = null;
    document.getElementById('demo-icon').textContent = '▶';
    document.getElementById('demo-label').textContent = 'Hear Live Demo';
    this.style.borderColor = '';
  }
});

// ===== SCROLL ANIMATIONS =====
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 90); io.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('[data-animate]').forEach(el => io.observe(el));

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = document.querySelector(a.getAttribute('href'));
  if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
}));
