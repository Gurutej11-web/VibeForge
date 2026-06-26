// Audio-Reactive Visualizer
window.Visualizer = (() => {
  let canvas, ctx, analyser, dataArray, bufferLength;
  let mode = 'particles';
  let animId = null;
  let moodColor = '#A855F7';

  // Particle system
  const particles = [];
  const PARTICLE_COUNT = 200;

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
      this.r = Math.random() * 3 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.baseR = this.r;
      this.angle = Math.random() * Math.PI * 2;
      this.angleSpeed = (Math.random() - 0.5) * 0.02;
      this.orbitR = 50 + Math.random() * 150;
      this.cx = canvas.width / 2;
      this.cy = canvas.height / 2;
      this.orbitSpeed = (Math.random() - 0.5) * 0.005;
    }
    update(bassLevel) {
      this.angle += this.orbitSpeed * (1 + bassLevel * 5);
      const pull = bassLevel * 80;
      const tx = this.cx + Math.cos(this.angle) * (this.orbitR + pull);
      const ty = this.cy + Math.sin(this.angle) * (this.orbitR + pull);
      this.x += (tx - this.x) * 0.02;
      this.y += (ty - this.y) * 0.02;
      this.x += this.vx * (1 + bassLevel * 3);
      this.y += this.vy * (1 + bassLevel * 3);
      this.r = this.baseR * (1 + bassLevel * 4);
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = moodColor;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
    }
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles.forEach(p => { p.cx = canvas.width / 2; p.cy = canvas.height / 2; });
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.viz-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  }

  function setMoodColor(color) {
    moodColor = color;
  }

  function drawParticles(bassLevel, trebleLevel) {
    ctx.fillStyle = 'rgba(10,10,15,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center glow
    const grd = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, 300 + bassLevel * 200);
    grd.addColorStop(0, moodColor + '15');
    grd.addColorStop(1, 'transparent');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => { p.update(bassLevel); p.draw(); });
    ctx.globalAlpha = 1;
  }

  function drawWaveform() {
    ctx.fillStyle = 'rgba(10,10,15,0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!analyser) return;
    const timeData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeData);

    ctx.strokeStyle = moodColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = moodColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();

    const sliceW = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = timeData[i] / 128.0;
      const y = (v * canvas.height) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceW;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function drawBars(freqData) {
    ctx.fillStyle = 'rgba(10,10,15,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!analyser) return;
    const barCount = 80;
    const barW = canvas.width / barCount;

    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor(i * bufferLength / barCount);
      const val = freqData[idx] / 255.0;
      const barH = val * canvas.height * 0.8;
      const hue = (i / barCount) * 60;

      const alpha = 0.6 + val * 0.4;
      ctx.fillStyle = moodColor;
      ctx.globalAlpha = alpha;

      // Mirror bars
      ctx.fillRect(i * barW, canvas.height - barH, barW - 1, barH);
      ctx.fillRect(i * barW, 0, barW - 1, barH * 0.3);
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!analyser) {
      animId = requestAnimationFrame(loop);
      // Idle animation without audio
      ctx.fillStyle = 'rgba(10,10,15,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (mode === 'particles') {
        particles.forEach(p => { p.update(0.02); p.draw(); });
        ctx.globalAlpha = 1;
      }
      animId = requestAnimationFrame(loop);
      return;
    }

    const freqData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqData);

    // Compute bass (low freq avg)
    let bassSum = 0;
    for (let i = 0; i < 10; i++) bassSum += freqData[i];
    const bassLevel = bassSum / (10 * 255);

    let trebleSum = 0;
    for (let i = bufferLength - 20; i < bufferLength; i++) trebleSum += freqData[i];
    const trebleLevel = trebleSum / (20 * 255);

    if (mode === 'particles') drawParticles(bassLevel, trebleLevel);
    else if (mode === 'waveform') drawWaveform();
    else if (mode === 'bars') drawBars(freqData);

    animId = requestAnimationFrame(loop);
  }

  function init() {
    canvas = document.getElementById('visualizer-canvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    initParticles();

    // Connect analyser after audio engine is ready
    setTimeout(() => {
      try {
        analyser = AudioEngine.getAnalyser();
        if (analyser) {
          bufferLength = analyser.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);
        }
      } catch(e) {}
    }, 500);

    // Setup viz mode buttons
    document.querySelectorAll('.viz-btn').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    loop();
  }

  function connectAnalyser() {
    analyser = AudioEngine.getAnalyser();
    if (analyser) {
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }
  }

  return { init, setMode, setMoodColor, connectAnalyser };
})();
