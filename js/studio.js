// VibeForge Studio — Main Controller
document.addEventListener('DOMContentLoaded', () => {

  // ===== LOADING SEQUENCE =====
  const loadingScreen = document.getElementById('loading-screen');
  const loadingStatus = document.getElementById('loading-status');
  const steps = [
    'Initializing audio engine...',
    'Loading synthesizers...',
    'Rendering sequencer...',
    'Wiring effects rack...',
    'Starting visualizer...',
    'Ready to create! ⚡'
  ];
  let si = 0;
  const statusInterval = setInterval(() => {
    if (si < steps.length) { loadingStatus.textContent = steps[si++]; }
    else clearInterval(statusInterval);
  }, 300);

  setTimeout(() => {
    loadingScreen?.classList.add('done');
    initSubsystems();
    checkUrlParams();
  }, 2000);

  // ===== CURSOR =====
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  if (cursorDot && cursorRing) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursorDot.style.left = mx+'px'; cursorDot.style.top = my+'px'; });
    const animCursor = () => { rx += (mx-rx)*0.12; ry += (my-ry)*0.12; cursorRing.style.left = rx+'px'; cursorRing.style.top = ry+'px'; requestAnimationFrame(animCursor); };
    animCursor();
    document.querySelectorAll('button, a, input[type="range"], .chord-pad, .drum-pad, .seq-cell, .white-key, .black-key').forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
    });
  }

  // ===== INIT SUBSYSTEMS =====
  function initSubsystems() {
    Sequencer.init();
    Sequencer.render();
    ChordPads.render();
    Keyboard.render();
    Keyboard.setupKeyboard();
    DrumMachine.render();
    DrumMachine.setupKeys();
    Visualizer.init();
    Effects.init();
    Arpeggiator.init();
    PianoRoll.init();
    Project.init();
    Sequencer.onStep(step => Mixer.onStep(step));
  }

  // ===== API KEY =====
  const apiKeyInput = document.getElementById('ai-api-key');
  const savedKey = localStorage.getItem('vibeforge_groq_key') || '';
  if (apiKeyInput) {
    apiKeyInput.value = savedKey;
    apiKeyInput.addEventListener('input', () => localStorage.setItem('vibeforge_groq_key', apiKeyInput.value.trim()));
  }

  // ===== TRANSPORT =====
  const playBtn = document.getElementById('btn-play');
  const recordBtn = document.getElementById('btn-record');
  let loopOn = false, bpm = 85;

  playBtn?.addEventListener('click', () => {
    AudioEngine.init();
    Visualizer.connectAnalyser();
    if (Sequencer.isPlaying()) {
      Sequencer.stop(); playBtn.innerHTML = '▶'; playBtn.classList.remove('playing');
    } else {
      Sequencer.start(); playBtn.innerHTML = '⏸'; playBtn.classList.add('playing');
    }
  });

  document.getElementById('btn-stop')?.addEventListener('click', () => {
    Sequencer.stop(); playBtn.innerHTML = '▶'; playBtn.classList.remove('playing');
  });

  document.getElementById('btn-rewind')?.addEventListener('click', () => {
    Sequencer.stop(); playBtn.innerHTML = '▶'; playBtn.classList.remove('playing');
  });

  document.getElementById('btn-loop')?.addEventListener('click', function() {
    loopOn = !loopOn; this.classList.toggle('active', loopOn);
    toast(loopOn ? 'Loop on' : 'Loop off', 'info', 1200);
  });

  document.getElementById('btn-metro')?.addEventListener('click', function() {
    const on = Sequencer.toggleMetronome();
    this.classList.toggle('active', on);
    toast(on ? 'Metronome on 🔔' : 'Metronome off', 'info', 1200);
  });

  // BPM
  const updateBPM = v => {
    bpm = Math.max(60, Math.min(180, v));
    Sequencer.setBPM(bpm);
    const el = document.getElementById('bpm-value');
    if (el) { el.textContent = bpm; el.style.color = '#06B6D4'; setTimeout(() => el.style.color = '', 150); }
  };
  document.getElementById('bpm-up')?.addEventListener('click', () => updateBPM(bpm + 1));
  document.getElementById('bpm-down')?.addEventListener('click', () => updateBPM(bpm - 1));
  document.getElementById('bpm-display')?.addEventListener('click', () => {
    const v = prompt('Enter BPM (60–180):', bpm);
    if (v && !isNaN(+v)) updateBPM(+v);
  });

  // Swing
  document.getElementById('swing-knob')?.addEventListener('input', e => {
    const v = +e.target.value;
    document.getElementById('swing-val').textContent = v + '%';
    Sequencer.setSwing(v);
  });

  // Visualizer mode
  document.querySelectorAll('.viz-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Visualizer.setMode(btn.dataset.mode);
    });
  });

  // Master volume
  document.getElementById('master-vol')?.addEventListener('input', e => {
    AudioEngine.setMasterVolume(+e.target.value / 100);
  });

  // ===== KEYBOARD SHORTCUTS =====
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); playBtn?.click(); return; }
    if (e.key === '?' || e.key === '/') { toggleModal('shortcuts-modal'); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); updateBPM(bpm + 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); updateBPM(bpm - 1); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); Project.save(document.getElementById('project-name')?.value); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); Sequencer.clearAll(); }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) recordBtn?.click();
  });

  function toggleModal(id) {
    document.getElementById(id)?.classList.toggle('hidden');
  }

  // ===== ADD / MANAGE ROWS =====
  document.getElementById('btn-add-row')?.addEventListener('click', () => {
    const types = [['melody','Melody'],['pad','Pad'],['lead','Lead'],['bass','Bass 2'],['perc','Perc'],['fx','FX']];
    const existing = Sequencer.getRows().map(r => r.type);
    const next = types.find(([t]) => !existing.includes(t)) || types[Math.floor(Math.random()*types.length)];
    Sequencer.addRow(next[0], next[1]);
  });
  document.getElementById('btn-seq-clear')?.addEventListener('click', () => Sequencer.clearAll());
  document.getElementById('btn-seq-random')?.addEventListener('click', () => Sequencer.randomize());

  // ===== WELCOME MODAL PATHS =====
  const welcomeModal = document.getElementById('welcome-modal');
  const presetModal = document.getElementById('preset-modal');
  const aiModal = document.getElementById('ai-modal');

  document.getElementById('path-ai')?.addEventListener('click', () => {
    welcomeModal?.classList.add('hidden');
    aiModal?.classList.remove('hidden');
    resetAIModal();
  });

  document.getElementById('path-preset')?.addEventListener('click', () => {
    welcomeModal?.classList.add('hidden');
    presetModal?.classList.remove('hidden');
  });

  document.getElementById('path-blank')?.addEventListener('click', openStudio);

  // Preset pick cards
  document.querySelectorAll('.preset-pick-card').forEach(card => {
    card.addEventListener('click', () => {
      presetModal?.classList.add('hidden');
      Presets.load(card.dataset.preset);
      openStudio();
      toast('Preset loaded — let\'s go! 🎛️', 'success');
    });
  });

  document.getElementById('preset-back')?.addEventListener('click', () => {
    presetModal?.classList.add('hidden');
    welcomeModal?.classList.remove('hidden');
  });

  // ===== AI MODAL =====
  const aiGenBtn = document.getElementById('ai-generate-btn');
  const loadBtn = document.getElementById('modal-load');
  const skipBtn = document.getElementById('modal-skip');
  const aiLoading = document.getElementById('ai-loading');
  const aiResult = document.getElementById('ai-result');
  let generatedResult = null;

  function resetAIModal() {
    aiLoading?.classList.add('hidden');
    aiResult?.classList.add('hidden');
    loadBtn?.classList.add('hidden');
    if (aiGenBtn) { aiGenBtn.disabled = false; document.getElementById('gen-btn-text').textContent = 'Generate Track with AI'; }
    generatedResult = null;
  }

  document.getElementById('modal-back')?.addEventListener('click', () => {
    aiModal?.classList.add('hidden');
    welcomeModal?.classList.remove('hidden');
    resetAIModal();
  });

  aiGenBtn?.addEventListener('click', async () => {
    const mood = document.getElementById('ai-mood').value;
    const genre = document.getElementById('ai-genre').value;
    const bpmVal = +(document.getElementById('ai-bpm').value) || 85;
    const desc = document.getElementById('ai-description').value;

    aiGenBtn.disabled = true;
    document.getElementById('gen-btn-text').textContent = 'Generating...';
    aiLoading?.classList.remove('hidden');
    aiResult?.classList.add('hidden');
    loadBtn?.classList.add('hidden');

    try {
      const result = await AIGenerator.generateTrack(mood, genre, bpmVal, desc);
      result.mood = mood;
      generatedResult = result;

      document.getElementById('ai-direction-text').textContent = `"${result.creativeDirection}"`;
      document.getElementById('ai-scale-chip').textContent = '🎵 ' + (result.scale || '');
      document.getElementById('ai-chords-chip').textContent = '🎼 ' + (result.chords?.slice(0,4).join(' · ') || '');
      document.getElementById('ai-bpm-chip').textContent = '⚡ ' + bpmVal + ' BPM';

      aiLoading?.classList.add('hidden');
      aiResult?.classList.remove('hidden');
      loadBtn?.classList.remove('hidden');
    } catch(err) {
      aiLoading?.classList.add('hidden');
      if (aiResult) {
        aiResult.classList.remove('hidden');
        document.getElementById('ai-direction-text').textContent = `Error: ${err.message}`;
      }
      toast('AI generation failed — check your Groq API key', 'error');
    }
    aiGenBtn.disabled = false;
    document.getElementById('gen-btn-text').textContent = 'Generate Track with AI';
  });

  loadBtn?.addEventListener('click', () => {
    if (generatedResult) {
      AIGenerator.applyTrackResult(generatedResult);
      const moodColor = Visualizer.MOOD_COLORS?.[generatedResult.mood] || '#A855F7';
      Visualizer.setMoodColor(moodColor);
      toast(`✦ Track generated · ${generatedResult.scale}`, 'success');
    }
    openStudio();
  });

  skipBtn?.addEventListener('click', openStudio);

  // ===== OPEN STUDIO =====
  function openStudio() {
    welcomeModal?.classList.add('hidden');
    presetModal?.classList.add('hidden');
    aiModal?.classList.add('hidden');
    document.getElementById('studio')?.classList.remove('hidden');
    Visualizer.connectAnalyser();
  }

  // ===== AI REGEN BUTTON (in transport) =====
  document.getElementById('btn-ai-regen')?.addEventListener('click', () => {
    aiModal?.classList.remove('hidden');
    resetAIModal();
  });

  // ===== SHORTCUTS =====
  document.getElementById('btn-shortcuts')?.addEventListener('click', () => toggleModal('shortcuts-modal'));
  document.getElementById('close-shortcuts')?.addEventListener('click', () => document.getElementById('shortcuts-modal')?.classList.add('hidden'));
  document.getElementById('shortcuts-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('shortcuts-modal')) document.getElementById('shortcuts-modal').classList.add('hidden');
  });

  // ===== DIRECTION BAR =====
  document.getElementById('direction-dismiss')?.addEventListener('click', () => document.getElementById('direction-bar')?.classList.add('hidden'));

  // ===== AI MELODY =====
  document.getElementById('btn-gen-melody')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-gen-melody');
    btn.disabled = true; btn.textContent = '⏳';
    try {
      const last = AIGenerator.getLastResult();
      const result = await AIGenerator.generateMelody(
        last?.scale || 'C minor',
        last?.scaleNotes || ['C','D','Eb','F','G','Ab','Bb'],
        last?.mood || 'dreamy',
        Sequencer.getBPM()
      );
      AIGenerator.applyMelodyResult(result);
      toast('Melody generated ✦', 'success');
    } catch(err) { toast('Melody generation failed', 'error'); }
    btn.disabled = false; btn.textContent = '✨';
  });

  // ===== SAVE =====
  document.getElementById('btn-save')?.addEventListener('click', () => Project.save(document.getElementById('project-name')?.value));
  document.getElementById('btn-project-save')?.addEventListener('click', () => Project.save(document.getElementById('project-name')?.value));
  document.getElementById('btn-project-new')?.addEventListener('click', () => { Sequencer.clearAll(); toast('New project started', 'info'); });
  document.getElementById('btn-project-share')?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => toast('Studio link copied! 🔗', 'success'));
  });

  // ===== RECORDING =====
  let recording = false, recStartTime, recTimerId;
  const recBar = document.getElementById('recording-bar');
  const recTimeEl = document.getElementById('rec-time');

  recordBtn?.addEventListener('click', () => {
    if (!recording) {
      AudioEngine.init();
      AudioEngine.startRecording();
      recording = true;
      recordBtn.classList.add('recording');
      recBar?.classList.remove('hidden');
      recStartTime = Date.now();
      recTimerId = setInterval(() => {
        const s = Math.floor((Date.now() - recStartTime) / 1000);
        if (recTimeEl) recTimeEl.textContent = `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
      }, 1000);
      toast('Recording started ⏺', 'info');
    } else { stopRecording(); }
  });

  document.getElementById('btn-stop-record')?.addEventListener('click', stopRecording);

  async function stopRecording() {
    if (!recording) return;
    recording = false;
    clearInterval(recTimerId);
    recordBtn?.classList.remove('recording');
    recBar?.classList.add('hidden');
    const last = AIGenerator.getLastResult();
    const mood = last?.mood || 'Track';
    const bpmVal = Sequencer.getBPM();
    const fname = `VibeForge-${mood.charAt(0).toUpperCase()+mood.slice(1)}-${bpmVal}BPM.webm`;
    await AudioEngine.stopRecording(fname);
    toast(`Exported: ${fname}`, 'success', 4000);
  }

  // ===== EXPORT BUTTON =====
  document.getElementById('btn-export')?.addEventListener('click', () => {
    if (!recording) {
      recordBtn?.click();
      toast('Recording — play your track, then click Stop & Export', 'info', 4000);
    } else { stopRecording(); }
  });

  // ===== URL PARAM ROUTING =====
  function checkUrlParams() {
    const p = new URLSearchParams(window.location.search);
    const start = p.get('start');
    const preset = p.get('preset');

    if (preset) {
      // Direct preset load — no modal
      Presets.load(preset);
      openStudio();
    } else if (start === 'ai') {
      // Show AI modal directly
      aiModal?.classList.remove('hidden');
      resetAIModal();
    } else if (start === 'blank') {
      // Skip all modals
      openStudio();
    } else {
      // Default (no param or ?start=pick) — show welcome picker
      welcomeModal?.classList.remove('hidden');
    }
  }

  console.log('%c⚡ VibeForge Studio', 'color:#A855F7;font-size:1.3rem;font-weight:bold;font-family:monospace');
  console.log('%cSpace=Play · ?=Help · Ctrl+S=Save · R=Record', 'color:#8080A8;font-size:0.9rem');
});
