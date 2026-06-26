// Studio — main controller
document.addEventListener('DOMContentLoaded', () => {

  // Init all subsystems
  Sequencer.init();
  Sequencer.render();
  ChordPads.render();
  Keyboard.render();
  Keyboard.setupKeyboard();
  DrumMachine.render();
  DrumMachine.setupKeys();
  Visualizer.init();
  Effects.init();

  // Sequencer step → mixer meters
  Sequencer.onStep(step => {
    Mixer.onStep(step);
  });

  // BPM controls
  let bpm = 85;
  document.getElementById('bpm-up')?.addEventListener('click', () => {
    bpm = Math.min(180, bpm + 1);
    Sequencer.setBPM(bpm);
  });
  document.getElementById('bpm-down')?.addEventListener('click', () => {
    bpm = Math.max(60, bpm - 1);
    Sequencer.setBPM(bpm);
  });

  // Play / Stop
  const playBtn = document.getElementById('btn-play');
  const stopBtn = document.getElementById('btn-stop');

  playBtn?.addEventListener('click', () => {
    AudioEngine.init();
    Visualizer.connectAnalyser();
    if (Sequencer.isPlaying()) {
      Sequencer.stop();
      playBtn.textContent = '▶';
      playBtn.classList.remove('playing');
    } else {
      Sequencer.start();
      playBtn.textContent = '⏸';
      playBtn.classList.add('playing');
    }
  });

  stopBtn?.addEventListener('click', () => {
    Sequencer.stop();
    if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    stopRecordingIfActive();
  });

  // Space bar to play/stop
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      playBtn?.click();
    }
  });

  // Add sequencer row
  document.getElementById('btn-add-row')?.addEventListener('click', () => {
    const types = ['bass', 'lead', 'pad', 'perc'];
    const labels = ['Bass', 'Lead', 'Pad', 'Perc'];
    const idx = Math.floor(Math.random() * types.length);
    Sequencer.addRow(types[idx], labels[idx]);
  });

  // Step count change
  document.getElementById('seq-steps')?.addEventListener('change', e => {
    // Reinit with new step count — for now just a note
  });

  // Recording
  let recording = false;
  let recStartTime = null;
  let recTimerId = null;

  const recordBtn = document.getElementById('btn-record');
  const recordingBar = document.getElementById('recording-bar');
  const recTimeEl = document.getElementById('rec-time');

  recordBtn?.addEventListener('click', () => {
    if (!recording) {
      AudioEngine.init();
      AudioEngine.startRecording();
      recording = true;
      recordBtn.classList.add('recording');
      recordingBar?.classList.remove('hidden');
      recStartTime = Date.now();
      recTimerId = setInterval(() => {
        const secs = Math.floor((Date.now() - recStartTime) / 1000);
        if (recTimeEl) recTimeEl.textContent = `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
      }, 1000);
    }
  });

  document.getElementById('btn-stop-record')?.addEventListener('click', stopRecordingIfActive);

  async function stopRecordingIfActive() {
    if (!recording) return;
    recording = false;
    if (recTimerId) clearInterval(recTimerId);
    recordBtn?.classList.remove('recording');
    recordingBar?.classList.add('hidden');

    const aiResult = AIGenerator.getLastResult();
    const mood = aiResult?.mood || 'Track';
    const bpmVal = Sequencer.getBPM();
    const filename = `VibeForge-${mood.charAt(0).toUpperCase()+mood.slice(1)}-${bpmVal}BPM.webm`;
    await AudioEngine.stopRecording(filename);
  }

  // Export button
  document.getElementById('btn-export')?.addEventListener('click', () => {
    if (!recording) {
      recordBtn?.click(); // start recording
      // Auto-stop after playing a bit
      setTimeout(() => {
        if (recording) stopRecordingIfActive();
      }, 8000);
    } else {
      stopRecordingIfActive();
    }
  });

  // AI re-generate button
  document.getElementById('btn-ai-regen')?.addEventListener('click', () => {
    document.getElementById('ai-modal')?.classList.remove('hidden');
  });

  // AI Melody generator
  document.getElementById('btn-gen-melody')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-gen-melody');
    const info = document.getElementById('melody-info');
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';
    if (info) info.textContent = 'Asking Groq for melody...';
    try {
      const last = AIGenerator.getLastResult();
      const scale = last?.scale || 'C minor';
      const scaleNotes = last?.scaleNotes || ['C','D','Eb','F','G','Ab','Bb'];
      const mood = last?.mood || 'dreamy';
      const bpmVal = Sequencer.getBPM();
      const result = await AIGenerator.generateMelody(scale, scaleNotes, mood, bpmVal);
      AIGenerator.applyMelodyResult(result);
    } catch(err) {
      if (info) info.textContent = 'Failed — check connection.';
      console.error('Melody gen error:', err);
    }
    btn.disabled = false;
    btn.textContent = '✨ Generate Melody';
  });

  // --- AI MODAL LOGIC ---
  const modal = document.getElementById('ai-modal');
  const generateBtn = document.getElementById('ai-generate-btn');
  const loadBtn = document.getElementById('modal-load');
  const skipBtn = document.getElementById('modal-skip');
  const loadingEl = document.getElementById('ai-loading');
  const resultEl = document.getElementById('ai-result');

  let generatedResult = null;

  generateBtn?.addEventListener('click', async () => {
    const mood = document.getElementById('ai-mood').value;
    const genre = document.getElementById('ai-genre').value;
    const bpmVal = +document.getElementById('ai-bpm').value;
    const desc = document.getElementById('ai-description').value;

    generateBtn.disabled = true;
    loadingEl?.classList.remove('hidden');
    resultEl?.classList.add('hidden');

    try {
      const result = await AIGenerator.generateTrack(mood, genre, bpmVal, desc);
      result.mood = mood;
      generatedResult = result;

      document.querySelector('.ai-direction').textContent = `"${result.creativeDirection}"`;
      document.getElementById('ai-scale-chip').textContent = result.scale;
      document.getElementById('ai-chords-chip').textContent = result.chords?.slice(0,4).join(' – ');

      loadingEl?.classList.add('hidden');
      resultEl?.classList.remove('hidden');
      loadBtn?.classList.remove('hidden');

      Visualizer.setMoodColor(AIGenerator.getMoodColor(mood));
    } catch(err) {
      loadingEl?.classList.add('hidden');
      const dir = document.querySelector('.ai-direction');
      if (dir) dir.textContent = `Error: ${err.message}. Check your API key or connection.`;
      resultEl?.classList.remove('hidden');
      console.error('AI gen error:', err);
    }
    generateBtn.disabled = false;
  });

  loadBtn?.addEventListener('click', () => {
    if (generatedResult) {
      AIGenerator.applyTrackResult(generatedResult);
    }
    openStudio();
  });

  skipBtn?.addEventListener('click', openStudio);

  function openStudio() {
    modal?.classList.add('hidden');
    document.getElementById('studio')?.classList.remove('hidden');
    Visualizer.connectAnalyser();
  }

  // API key — load saved, save on change
  const apiKeyInput = document.getElementById('ai-api-key');
  const savedKey = localStorage.getItem('vibeforge_groq_key') || '';
  if (apiKeyInput) {
    apiKeyInput.value = savedKey;
    apiKeyInput.addEventListener('input', () => {
      localStorage.setItem('vibeforge_groq_key', apiKeyInput.value.trim());
    });
  }

  // Check URL params
  const params = new URLSearchParams(window.location.search);

  if (params.get('preset')) {
    Presets.load(params.get('preset'));
    openStudio();
  } else if (params.get('autoGenerate') === 'true') {
    // Show modal, auto-fill mood
    modal?.classList.remove('hidden');
  } else {
    // Show modal by default
    modal?.classList.remove('hidden');
  }

  // Keyboard shortcut hints in console
  console.log('%cVibeForge Studio 🎵', 'color:#A855F7;font-size:1.2rem;font-weight:bold');
  console.log('Space: Play/Stop | A-K: White keys | W,E,T,Y,U: Black keys | Q-8: Drum pads');
});
