// VibeForge Audio Engine — Web Audio API
window.AudioEngine = (() => {
  let ctx = null;
  let masterGain, analyser, reverbNode, delayNode, distNode, reverbGain, delayGain, distGain, compressor;
  let mediaRecorder = null, recordedChunks = [], recordingStream = null;
  let destination;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    destination = ctx.createMediaStreamDestination();

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;

    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;

    // Reverb
    reverbNode = ctx.createConvolver();
    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.0;
    buildImpulse(2, 3);

    // Delay
    delayNode = ctx.createDelay(2.0);
    delayNode.delayTime.value = 0.3;
    delayGain = ctx.createGain();
    delayGain.gain.value = 0.0;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.4;
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayGain);

    // Distortion
    distNode = ctx.createWaveShaper();
    distGain = ctx.createGain();
    distGain.gain.value = 0.0;
    makeDistortion(0);
    distNode.connect(distGain);

    // Compressor
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Chain: masterGain → compressor → reverb/delay/dist → analyser → output
    masterGain.connect(compressor);
    compressor.connect(analyser);
    compressor.connect(reverbNode);
    reverbNode.connect(reverbGain);
    compressor.connect(delayNode);
    compressor.connect(distNode);
    reverbGain.connect(analyser);
    delayGain.connect(analyser);
    distGain.connect(analyser);
    analyser.connect(ctx.destination);
    analyser.connect(destination);
  }

  function buildImpulse(duration, decay) {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const d = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    reverbNode.buffer = impulse;
  }

  function makeDistortion(amount) {
    const k = amount * 400;
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = k ? ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x)) : x;
    }
    distNode.curve = curve;
  }

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  // Play a synth note (oscillator)
  function playNote(freq, type = 'triangle', duration = 0.5, gainVal = 0.4, when = 0) {
    resume();
    const t = when || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  // Play a chord
  function playChord(freqs, duration = 1.0) {
    freqs.forEach(f => playNote(f, 'triangle', duration, 0.2));
  }

  // Synth drum sounds using oscillators + noise
  function playDrum(type, when = 0) {
    resume();
    const t = when || ctx.currentTime;
    const kit = window.DrumMachine ? window.DrumMachine.currentKit() : 'electronic';

    switch (type) {
      case 'kick': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(kit === 'trap' ? 80 : 60, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(t); osc.stop(t + 0.5);
        break;
      }
      case 'snare': {
        const bufLen = ctx.sampleRate * 0.2;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = kit === 'lofi' ? 800 : 2000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
        noise.start(t); noise.stop(t + 0.2);
        break;
      }
      case 'hihat': {
        const bufLen = ctx.sampleRate * 0.05;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
        noise.start(t); noise.stop(t + 0.08);
        break;
      }
      case 'openhat': {
        const bufLen = ctx.sampleRate * 0.3;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
        noise.start(t); noise.stop(t + 0.3);
        break;
      }
      case 'clap': {
        const bufLen = ctx.sampleRate * 0.1;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
        noise.start(t); noise.stop(t + 0.1);
        break;
      }
      case 'tom': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(t); osc.stop(t + 0.3);
        break;
      }
      case 'rim': {
        const bufLen = ctx.sampleRate * 0.05;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
        noise.start(t); noise.stop(t + 0.05);
        break;
      }
      case 'perc': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(t); osc.stop(t + 0.2);
        break;
      }
      default: break;
    }
  }

  // Bass note
  function playBass(freq, duration = 0.25, when = 0) {
    resume();
    const t = when || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(filter); filter.connect(gain); gain.connect(masterGain);
    osc.start(t); osc.stop(t + duration + 0.01);
  }

  // Effects setters
  function setReverbAmount(v) { if (reverbGain) reverbGain.gain.value = v; }
  function setDelayAmount(v) { if (delayGain) delayGain.gain.value = v; }
  function setDistAmount(v) {
    if (distGain && distNode) {
      distGain.gain.value = v * 0.5;
      makeDistortion(v);
    }
  }
  function setMasterVolume(v) { if (masterGain) masterGain.gain.value = v; }
  function setDelayTime(bpm) { if (delayNode) delayNode.delayTime.value = 60 / bpm / 2; }
  function setCompressor(enabled, amount) {
    if (!compressor) return;
    compressor.threshold.value = enabled ? -24 - amount * 20 : 0;
    compressor.ratio.value = enabled ? 4 + amount * 12 : 1;
  }

  function playMetronome(isDownbeat, when = 0) {
    resume();
    const t = when || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = isDownbeat ? 1800 : 1200;
    gain.gain.setValueAtTime(isDownbeat ? 0.3 : 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.06);
  }

  // Recording
  function startRecording() {
    resume();
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(destination.stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.start();
  }

  function stopRecording(filename) {
    return new Promise(resolve => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'VibeForge-Track.webm';
        a.click();
        resolve();
      };
      mediaRecorder.stop();
    });
  }

  return {
    init, resume, playNote, playChord, playDrum, playBass,
    setReverbAmount, setDelayAmount, setDistAmount, setMasterVolume, setDelayTime,
    startRecording, stopRecording,
    setCompressor, playMetronome,
    getAnalyser: () => analyser,
    getCtx: () => ctx
  };
})();
