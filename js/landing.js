// VibeForge Landing Page JS

// ===== CUSTOM CURSOR =====
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top = mouseY + 'px';
});

function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a, button, [data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
});

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== MOBILE MENU =====
const mobileToggle = document.getElementById('nav-mobile-toggle');
const mobileMenu = document.getElementById('mobile-menu');
mobileToggle?.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  mobileToggle.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
});
document.querySelectorAll('.mobile-menu a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    mobileToggle.textContent = '☰';
  });
});

// ===== TYPING ANIMATION =====
const phrases = ['No Experience Needed.', 'Your Vision. Your Sound.', 'AI Composes. You Create.', 'From Mood to Music.'];
let pIdx = 0, cIdx = 0, deleting = false;
const typingEl = document.getElementById('typing-text');

function typeLoop() {
  if (!typingEl) return;
  const current = phrases[pIdx];
  if (!deleting) {
    typingEl.textContent = current.slice(0, cIdx + 1);
    cIdx++;
    if (cIdx === current.length) { deleting = true; setTimeout(typeLoop, 2200); return; }
  } else {
    typingEl.textContent = current.slice(0, cIdx - 1);
    cIdx--;
    if (cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; }
  }
  setTimeout(typeLoop, deleting ? 40 : 80);
}
setTimeout(typeLoop, 1500);

// ===== BACKGROUND CANVAS =====
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

class Particle {
  constructor() { this.reset(true); }
  reset(init = false) {
    this.x = Math.random() * W;
    this.y = init ? Math.random() * H : H + 10;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = -(Math.random() * 0.4 + 0.1);
    this.r = Math.random() * 1.5 + 0.3;
    this.alpha = Math.random() * 0.5 + 0.05;
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.015 + Math.random() * 0.02;
    const colors = ['#A855F7','#06B6D4','#EC4899','#6366F1','#F59E0B'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.pulse += this.pulseSpeed;
    if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset();
  }
  draw() {
    const a = this.alpha * (0.6 + 0.4 * Math.sin(this.pulse));
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawConnections() {
  ctx.globalAlpha = 1;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 120) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(168,85,247,${0.06 * (1 - d / 120)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function bgLoop() {
  ctx.clearRect(0, 0, W, H);
  drawConnections();
  particles.forEach(p => { p.update(); p.draw(); });
  ctx.globalAlpha = 1;
  requestAnimationFrame(bgLoop);
}

resize();
window.addEventListener('resize', resize);
particles = Array.from({ length: 100 }, () => new Particle());
bgLoop();

// ===== FEATURE VISUALIZER MINI PREVIEW =====
const featureCanvas = document.getElementById('feature-viz-canvas');
if (featureCanvas) {
  const fctx = featureCanvas.getContext('2d');
  let ft = 0;
  function drawFeatureViz() {
    featureCanvas.width = featureCanvas.offsetWidth;
    featureCanvas.height = featureCanvas.offsetHeight;
    const W2 = featureCanvas.width, H2 = featureCanvas.height;
    fctx.clearRect(0, 0, W2, H2);
    const bars = 40;
    for (let i = 0; i < bars; i++) {
      const h = (Math.sin(i * 0.4 + ft) * 0.3 + Math.sin(i * 0.8 + ft * 1.3) * 0.3 + 0.4) * H2 * 0.85;
      const x = (i / bars) * W2;
      const bw = W2 / bars - 1;
      const g = fctx.createLinearGradient(0, H2 - h, 0, H2);
      g.addColorStop(0, '#A855F7');
      g.addColorStop(1, '#06B6D4');
      fctx.fillStyle = g;
      fctx.globalAlpha = 0.7;
      fctx.fillRect(x, H2 - h, bw, h);
    }
    fctx.globalAlpha = 1;
    ft += 0.04;
    requestAnimationFrame(drawFeatureViz);
  }
  drawFeatureViz();
}

// ===== MOCK SEQUENCER ANIMATION =====
let mockStep = 0;
const mockCells = document.querySelectorAll('.mock-step');
setInterval(() => {
  mockCells.forEach((c, i) => c.classList.toggle('playhead', i === mockStep));
  mockStep = (mockStep + 1) % mockCells.length;
}, 300);

// Animate mock viz bars
const mockVizBars = document.querySelectorAll('.mock-viz-bar');
setInterval(() => {
  mockVizBars.forEach(bar => {
    bar.style.height = (Math.random() * 70 + 20) + '%';
  });
}, 200);

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      const idx = Array.from(document.querySelectorAll('[data-animate]')).indexOf(e.target);
      setTimeout(() => e.target.classList.add('visible'), idx % 4 * 80);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

// ===== DEMO AUDIO =====
document.getElementById('hero-play-demo')?.addEventListener('click', function() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    // Play a demo chord
    const freqs = [261.63, 329.63, 392.00, 493.88];
    freqs.forEach((f, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, ac.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.12, ac.currentTime + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2.5);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(ac.currentTime + i * 0.05);
      osc.stop(ac.currentTime + 2.5);
    });
    this.textContent = '🔊 Playing...';
    setTimeout(() => this.innerHTML = '<span>▶</span> Hear Demo', 2500);
  } catch(e) {
    window.location.href = 'studio.html';
  }
});

// ===== HERO PARALLAX =====
const heroPreview = document.getElementById('hero-preview');
document.addEventListener('mousemove', e => {
  if (!heroPreview) return;
  const rx = (e.clientX / window.innerWidth - 0.5) * 8;
  const ry = (e.clientY / window.innerHeight - 0.5) * 4;
  heroPreview.style.transform = `perspective(1200px) rotateY(${-5 + rx * 0.3}deg) rotateX(${2 + ry * 0.2}deg)`;
});

// ===== TOAST UTILITY =====
window.toast = function(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✓', error: '✕', info: '✦', warning: '⚠' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'fadeOutToast 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
};
