window.Visualizer = (() => {
  let canvas, ctx, analyser, bufLen, dataArr;
  let mode = 'particles';
  let moodColor = '#A855F7';
  let moodColorRGB = '168,85,247';
  let animId;
  let t = 0;

  const MOOD_COLORS = {
    happy:'#F59E0B', melancholic:'#6366F1', tense:'#EF4444',
    euphoric:'#A855F7', dreamy:'#06B6D4', aggressive:'#FF4500'
  };

  // PARTICLE SYSTEM
  const particles = [];
  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = canvas ? Math.random() * canvas.width : 0;
      this.y = canvas ? (init ? Math.random() * canvas.height : canvas.height + 10) : 0;
      this.cx = canvas ? canvas.width / 2 : 0;
      this.cy = canvas ? canvas.height / 2 : 0;
      this.angle = Math.random() * Math.PI * 2;
      this.orbitR = 80 + Math.random() * 200;
      this.orbitSpeed = (Math.random() - 0.5) * 0.004;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.baseSize = Math.random() * 2.5 + 0.5;
      this.size = this.baseSize;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.02 + Math.random() * 0.03;
    }
    update(bass) {
      this.pulse += this.pulseSpeed;
      this.angle += this.orbitSpeed * (1 + bass * 6);
      const pull = bass * 100;
      const tx = this.cx + Math.cos(this.angle) * (this.orbitR + pull);
      const ty = this.cy + Math.sin(this.angle) * (this.orbitR + pull);
      this.x += (tx - this.x) * 0.018 + this.vx * (1 + bass * 2);
      this.y += (ty - this.y) * 0.018 + this.vy * (1 + bass * 2);
      this.size = this.baseSize * (1 + bass * 5);
      if (this.x < -20 || this.x > canvas.width + 20 || this.y < -20 || this.y > canvas.height + 20) this.reset(false);
    }
    draw(bass) {
      const a = this.alpha * (0.6 + 0.4 * Math.sin(this.pulse));
      ctx.globalAlpha = a;
      ctx.fillStyle = moodColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      if (bass > 0.3) {
        ctx.globalAlpha = a * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < 220; i++) particles.push(new Particle());
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles.forEach(p => { p.cx = canvas.width/2; p.cy = canvas.height/2; });
  }

  function getFreqData() {
    if (!analyser) return { freqData: null, bass: 0.02, treble: 0 };
    const freqData = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(freqData);
    let bassSum = 0, trebleSum = 0;
    for (let i = 0; i < 12; i++) bassSum += freqData[i];
    for (let i = bufLen - 30; i < bufLen; i++) trebleSum += freqData[i];
    return { freqData, bass: bassSum / (12 * 255), treble: trebleSum / (30 * 255) };
  }

  function drawParticles(bass) {
    ctx.fillStyle = `rgba(8,8,14,0.12)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center glow
    const grd = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, 350 + bass * 250);
    grd.addColorStop(0, `rgba(${moodColorRGB},${0.04 + bass * 0.08})`);
    grd.addColorStop(1, 'transparent');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => { p.update(bass); p.draw(bass); });

    // Connecting lines
    ctx.globalAlpha = 1;
    for (let i = 0; i < Math.min(particles.length, 80); i++) {
      for (let j = i + 1; j < Math.min(particles.length, 80); j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${moodColorRGB},${0.06 * (1 - d/80)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawWaveform() {
    ctx.fillStyle = 'rgba(8,8,14,0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!analyser) return;

    const timeDom = new Uint8Array(bufLen);
    analyser.getByteTimeDomainData(timeDom);

    // Main line
    ctx.beginPath();
    ctx.strokeStyle = moodColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = moodColor;
    ctx.shadowBlur = 14;
    const sliceW = canvas.width / bufLen;
    for (let i = 0; i < bufLen; i++) {
      const v = timeDom[i] / 128.0;
      const x = i * sliceW;
      const y = v * canvas.height / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Mirror
    ctx.beginPath();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (let i = 0; i < bufLen; i++) {
      const v = timeDom[i] / 128.0;
      const x = i * sliceW;
      const y = canvas.height - v * canvas.height / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function drawBars(freqData) {
    ctx.fillStyle = 'rgba(8,8,14,0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!freqData) return;

    const count = 72;
    const bw = canvas.width / count;
    const cx = canvas.width / 2;
    const cy = canvas.height;

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(i * bufLen / count);
      const val = freqData[idx] / 255.0;
      const h = val * canvas.height * 0.75;
      const x = i * bw;

      // Gradient bar
      const g = ctx.createLinearGradient(0, cy - h, 0, cy);
      g.addColorStop(0, `rgba(${moodColorRGB},0.9)`);
      g.addColorStop(0.5, `rgba(${moodColorRGB},0.5)`);
      g.addColorStop(1, `rgba(${moodColorRGB},0.1)`);
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.75 + val * 0.25;
      ctx.fillRect(x, cy - h, bw - 1.5, h);

      // Reflection
      ctx.globalAlpha = 0.12;
      ctx.fillRect(x, cy, bw - 1.5, h * 0.25);

      // Peak dot
      if (val > 0.7) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, cy - h - 2, bw - 1.5, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    const { freqData, bass } = getFreqData();

    if (mode === 'particles') drawParticles(bass);
    else if (mode === 'waveform') drawWaveform();
    else if (mode === 'bars') drawBars(freqData);
    else drawParticles(bass);

    t += 0.01;
    animId = requestAnimationFrame(loop);
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  }

  function setMoodColor(hex, name) {
    moodColor = hex;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    moodColorRGB = `${r},${g},${b}`;
  }

  function connectAnalyser() {
    try {
      analyser = AudioEngine.getAnalyser();
      if (analyser) { bufLen = analyser.frequencyBinCount; dataArr = new Uint8Array(bufLen); }
    } catch(e) {}
  }

  function init() {
    canvas = document.getElementById('visualizer-canvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    initParticles();

    document.querySelectorAll('.viz-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    setTimeout(connectAnalyser, 800);
    loop();
  }

  return { init, setMode, setMoodColor, connectAnalyser, MOOD_COLORS };
})();
