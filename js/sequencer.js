// Step Sequencer Engine
window.Sequencer = (() => {
  let bpm = 85;
  let steps = 16;
  let currentStep = 0;
  let playing = false;
  let intervalId = null;
  let rows = [];
  let onStepCallbacks = [];
  let octave = 4;

  const NOTE_FREQS = {
    C: 261.63, D: 293.66, E: 329.63, F: 349.23,
    G: 392.00, A: 440.00, B: 493.88
  };

  function noteToFreq(note, oct) {
    const base = NOTE_FREQS[note] || 261.63;
    return base * Math.pow(2, oct - 4);
  }

  const DEFAULT_ROWS = [
    { id: 'kick',  label: 'Kick',  type: 'kick',  cells: [], muted: false, vol: 1.0, rowClass: 'row-kick' },
    { id: 'snare', label: 'Snare', type: 'snare', cells: [], muted: false, vol: 0.8, rowClass: 'row-snare' },
    { id: 'hihat', label: 'Hi-Hat',type: 'hihat', cells: [], muted: false, vol: 0.6, rowClass: 'row-hihat' },
    { id: 'perc',  label: 'Perc',  type: 'perc',  cells: [], muted: false, vol: 0.5, rowClass: 'row-perc' },
    { id: 'bass',  label: 'Bass',  type: 'bass',  cells: [], muted: false, vol: 0.7, rowClass: 'row-bass', notes: [] },
    { id: 'lead',  label: 'Lead',  type: 'lead',  cells: [], muted: false, vol: 0.5, rowClass: 'row-lead', notes: [] },
  ];

  function initRows() {
    rows = DEFAULT_ROWS.map(r => ({
      ...r,
      cells: Array(steps).fill(false),
      notes: r.notes ? Array(steps).fill(null) : undefined
    }));
  }

  function render() {
    const container = document.getElementById('sequencer');
    if (!container) return;
    container.innerHTML = '';

    rows.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.className = `seq-row ${row.rowClass}`;
      rowEl.dataset.rowId = row.id;

      // Label
      const label = document.createElement('div');
      label.className = 'seq-row-label';
      label.textContent = row.label;
      rowEl.appendChild(label);

      // Controls
      const controls = document.createElement('div');
      controls.className = 'seq-row-controls';

      const muteBtn = document.createElement('button');
      muteBtn.className = `seq-mute${row.muted ? ' muted' : ''}`;
      muteBtn.textContent = row.muted ? 'M' : 'M';
      muteBtn.title = 'Mute';
      muteBtn.onclick = () => { rows[ri].muted = !rows[ri].muted; muteBtn.classList.toggle('muted'); };
      controls.appendChild(muteBtn);

      const volSlider = document.createElement('input');
      volSlider.type = 'range';
      volSlider.className = 'seq-vol';
      volSlider.min = 0; volSlider.max = 1; volSlider.step = 0.05;
      volSlider.value = row.vol;
      volSlider.oninput = () => { rows[ri].vol = +volSlider.value; };
      controls.appendChild(volSlider);

      rowEl.appendChild(controls);

      // Cells
      const cells = document.createElement('div');
      cells.className = 'seq-cells';

      row.cells.forEach((on, ci) => {
        const cell = document.createElement('div');
        cell.className = `seq-cell${on ? ' on' : ''}${ci % 4 === 0 && ci > 0 ? ' beat-4' : ''}`;
        cell.dataset.row = ri;
        cell.dataset.step = ci;
        cell.onclick = () => {
          rows[ri].cells[ci] = !rows[ri].cells[ci];
          cell.classList.toggle('on', rows[ri].cells[ci]);
        };
        cells.appendChild(cell);
      });

      rowEl.appendChild(cells);
      container.appendChild(rowEl);
    });

    updateMixerFromRows();
  }

  function tick() {
    const stepEl = document.getElementById('step-num');
    if (stepEl) stepEl.textContent = currentStep + 1;

    // Clear previous playhead
    document.querySelectorAll('.seq-cell.playhead').forEach(el => el.classList.remove('playhead'));

    // Highlight current step
    document.querySelectorAll(`.seq-cell[data-step="${currentStep}"]`).forEach(el => {
      el.classList.add('playhead');
    });

    // Fire sounds
    const stepDuration = 60 / bpm / 4; // 16th note duration

    rows.forEach(row => {
      if (row.muted || !row.cells[currentStep]) return;

      if (['kick', 'snare', 'hihat', 'openhat', 'clap', 'tom', 'rim', 'perc'].includes(row.type)) {
        AudioEngine.playDrum(row.type);
      } else if (row.type === 'bass') {
        const note = row.notes && row.notes[currentStep];
        const freq = note ? noteFreqMap[note] : 65.41;
        AudioEngine.playBass(freq, stepDuration);
      } else if (['lead', 'pad', 'melody'].includes(row.type)) {
        const note = row.notes && row.notes[currentStep];
        const freq = note ? noteFreqMap[note] : 261.63;
        AudioEngine.playNote(freq, 'triangle', stepDuration, 0.3 * row.vol);
      }
    });

    onStepCallbacks.forEach(cb => cb(currentStep));
    currentStep = (currentStep + 1) % steps;
  }

  // Full chromatic freq map (octave 3-6)
  const noteFreqMap = (() => {
    const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const map = {};
    for (let oct = 1; oct <= 7; oct++) {
      notes.forEach((n, i) => {
        const midi = (oct + 1) * 12 + i;
        map[`${n}${oct}`] = 440 * Math.pow(2, (midi - 69) / 12);
      });
    }
    return map;
  })();

  function start() {
    if (playing) return;
    playing = true;
    AudioEngine.init();
    AudioEngine.resume();
    const interval = (60 / bpm / 4) * 1000;
    intervalId = setInterval(tick, interval);
  }

  function stop() {
    playing = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    currentStep = 0;
    document.querySelectorAll('.seq-cell.playhead').forEach(el => el.classList.remove('playhead'));
    const stepEl = document.getElementById('step-num');
    if (stepEl) stepEl.textContent = '1';
  }

  function setBPM(v) {
    bpm = Math.max(60, Math.min(180, v));
    document.getElementById('bpm-value').textContent = bpm;
    AudioEngine.setDelayTime(bpm);
    if (playing) { stop(); start(); }
  }

  function getBPM() { return bpm; }

  function loadPattern(pattern) {
    // pattern: { rows: [{ id, cells: bool[], notes: [] }] }
    if (!pattern || !pattern.rows) return;
    pattern.rows.forEach(pr => {
      const ri = rows.findIndex(r => r.id === pr.id);
      if (ri >= 0) {
        rows[ri].cells = pr.cells.slice(0, steps);
        if (pr.notes) rows[ri].notes = pr.notes.slice(0, steps);
      }
    });
    render();
  }

  function addRow(type, label) {
    const rowClass = {
      bass: 'row-bass', lead: 'row-lead', pad: 'row-pad', melody: 'row-melody', perc: 'row-perc'
    }[type] || 'row-lead';
    rows.push({
      id: `${type}-${Date.now()}`, label, type, rowClass,
      cells: Array(steps).fill(false),
      notes: Array(steps).fill(null),
      muted: false, vol: 0.6
    });
    render();
  }

  function onStep(cb) { onStepCallbacks.push(cb); }

  function updateMixerFromRows() {
    if (window.Mixer) Mixer.syncRows(rows);
  }

  function getRows() { return rows; }
  function isPlaying() { return playing; }

  return { init: initRows, render, start, stop, setBPM, getBPM, loadPattern, addRow, onStep, getRows, isPlaying, noteFreqMap };
})();
