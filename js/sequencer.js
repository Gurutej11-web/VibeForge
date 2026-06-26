window.Sequencer = (() => {
  let bpm = 85;
  let steps = 16;
  let currentStep = 0;
  let playing = false;
  let intervalId = null;
  let rows = [];
  let onStepCallbacks = [];
  let swing = 0;
  let metronomeOn = false;

  const SCALES = {
    major:      [0,2,4,5,7,9,11],
    minor:      [0,2,3,5,7,8,10],
    pentatonic: [0,2,4,7,9],
    blues:      [0,3,5,6,7,10],
    dorian:     [0,2,3,5,7,9,10],
    mixolydian: [0,2,4,5,7,9,10]
  };

  const DEFAULT_ROWS = [
    { id:'kick',  label:'Kick',   type:'kick',  rowClass:'row-kick',  muted:false, vol:1.0 },
    { id:'snare', label:'Snare',  type:'snare', rowClass:'row-snare', muted:false, vol:0.8 },
    { id:'hihat', label:'Hi-Hat', type:'hihat', rowClass:'row-hihat', muted:false, vol:0.6 },
    { id:'perc',  label:'Perc',   type:'perc',  rowClass:'row-perc',  muted:false, vol:0.5 },
    { id:'bass',  label:'Bass',   type:'bass',  rowClass:'row-bass',  muted:false, vol:0.7, notes:[] },
    { id:'lead',  label:'Lead',   type:'lead',  rowClass:'row-lead',  muted:false, vol:0.5, notes:[] },
  ];

  const NOTE_FREQ_MAP = (() => {
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

  function initRows() {
    rows = DEFAULT_ROWS.map(r => ({
      ...r,
      cells: Array(steps).fill(false),
      notes: r.notes !== undefined ? Array(steps).fill(null) : undefined
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

      // Label (click to open piano roll for melodic rows)
      const label = document.createElement('div');
      label.className = 'seq-row-label';
      label.textContent = row.label;
      label.title = row.label;
      rowEl.appendChild(label);

      // Controls
      const ctrl = document.createElement('div');
      ctrl.className = 'seq-row-controls';

      const muteBtn = document.createElement('button');
      muteBtn.className = `seq-mute${row.muted ? ' muted' : ''}`;
      muteBtn.textContent = 'M';
      muteBtn.title = 'Mute';
      muteBtn.onclick = () => { rows[ri].muted = !rows[ri].muted; muteBtn.classList.toggle('muted', rows[ri].muted); };
      ctrl.appendChild(muteBtn);

      const volSlider = document.createElement('input');
      volSlider.type = 'range'; volSlider.className = 'seq-vol';
      volSlider.min = 0; volSlider.max = 1; volSlider.step = 0.05;
      volSlider.value = row.vol;
      volSlider.oninput = () => { rows[ri].vol = +volSlider.value; };
      ctrl.appendChild(volSlider);

      // Piano roll button for melodic rows
      if (row.notes !== undefined) {
        const prBtn = document.createElement('button');
        prBtn.className = 'seq-piano-btn';
        prBtn.textContent = '🎹';
        prBtn.title = 'Open Piano Roll';
        prBtn.onclick = () => PianoRoll.open(row.id, row.label);
        ctrl.appendChild(prBtn);
      }

      rowEl.appendChild(ctrl);

      // Cells
      const cellsWrap = document.createElement('div');
      cellsWrap.className = 'seq-cells';
      row.cells.forEach((on, ci) => {
        const cell = document.createElement('div');
        cell.className = `seq-cell${on ? ' on' : ''}${ci % 4 === 0 && ci > 0 ? ' beat-marker' : ''}`;
        cell.dataset.row = ri; cell.dataset.step = ci;

        let mouseDown = false;
        let setTo = null;
        cell.addEventListener('mousedown', e => {
          e.preventDefault();
          mouseDown = true;
          setTo = !rows[ri].cells[ci];
          rows[ri].cells[ci] = setTo;
          cell.classList.toggle('on', setTo);
        });
        cell.addEventListener('mouseover', () => {
          if (mouseDown && setTo !== null) {
            rows[ri].cells[ci] = setTo;
            cell.classList.toggle('on', setTo);
          }
        });
        document.addEventListener('mouseup', () => { mouseDown = false; setTo = null; }, { once: false });

        cellsWrap.appendChild(cell);
      });
      rowEl.appendChild(cellsWrap);
      container.appendChild(rowEl);
    });

    if (window.Mixer) Mixer.syncRows(rows);
  }

  function tick() {
    const swingDelay = (currentStep % 2 === 1) ? (swing / 100) * (60 / bpm / 4) * 1000 * 0.5 : 0;
    const doTick = () => {
      document.getElementById('step-num').textContent = currentStep + 1;
      document.querySelectorAll('.seq-cell.playhead').forEach(el => el.classList.remove('playhead'));
      document.querySelectorAll(`.seq-cell[data-step="${currentStep}"]`).forEach(el => el.classList.add('playhead'));

      const stepDur = 60 / bpm / 4;
      rows.forEach(row => {
        if (row.muted || !row.cells[currentStep]) return;
        if (['kick','snare','hihat','openhat','clap','tom','rim','perc'].includes(row.type)) {
          AudioEngine.playDrum(row.type);
        } else if (row.type === 'bass') {
          const noteKey = row.notes?.[currentStep];
          const freq = noteKey ? NOTE_FREQ_MAP[noteKey] : 65.41;
          AudioEngine.playBass(freq, stepDur);
        } else {
          const noteKey = row.notes?.[currentStep];
          const freq = noteKey ? NOTE_FREQ_MAP[noteKey] : 261.63;
          AudioEngine.playNote(freq, 'triangle', stepDur, 0.3 * row.vol);
        }
      });

      if (metronomeOn && currentStep % 4 === 0) AudioEngine.playMetronome(currentStep === 0);

      onStepCallbacks.forEach(cb => cb(currentStep));

      // BPM pulse on beats
      if (currentStep % 4 === 0) {
        const bpmEl = document.getElementById('bpm-value');
        if (bpmEl) { bpmEl.classList.remove('beat-pulse'); void bpmEl.offsetWidth; bpmEl.classList.add('beat-pulse'); }
      }

      currentStep = (currentStep + 1) % steps;
    };

    if (swingDelay > 0) setTimeout(doTick, swingDelay);
    else doTick();
  }

  function start() {
    if (playing) return;
    playing = true;
    AudioEngine.init(); AudioEngine.resume();
    const interval = (60 / bpm / 4) * 1000;
    intervalId = setInterval(tick, interval);
  }

  function stop() {
    playing = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    currentStep = 0;
    document.querySelectorAll('.seq-cell.playhead').forEach(el => el.classList.remove('playhead'));
    const el = document.getElementById('step-num');
    if (el) el.textContent = '1';
  }

  function setBPM(v) {
    bpm = Math.max(60, Math.min(180, +v));
    const el = document.getElementById('bpm-value');
    if (el) el.textContent = bpm;
    AudioEngine.setDelayTime && AudioEngine.setDelayTime(bpm);
    if (playing) { stop(); start(); }
  }

  function setSwing(v) { swing = +v; }
  function toggleMetronome() { metronomeOn = !metronomeOn; return metronomeOn; }

  function loadPattern(pattern) {
    if (!pattern?.rows) return;
    pattern.rows.forEach(pr => {
      const ri = rows.findIndex(r => r.id === pr.id);
      if (ri < 0) return;
      rows[ri].cells = (pr.cells || []).slice(0, steps).concat(Array(steps).fill(false)).slice(0, steps);
      if (pr.notes && rows[ri].notes !== undefined) {
        rows[ri].notes = (pr.notes || []).slice(0, steps).concat(Array(steps).fill(null)).slice(0, steps);
      }
    });
    render();
  }

  function addRow(type, label) {
    const rowClassMap = { bass:'row-bass', lead:'row-lead', pad:'row-pad', melody:'row-melody', perc:'row-perc', fx:'row-lead' };
    const hasnotes = ['bass','lead','pad','melody'].includes(type);
    rows.push({
      id: `${type}-${Date.now()}`, label, type,
      rowClass: rowClassMap[type] || 'row-lead',
      cells: Array(steps).fill(false),
      notes: hasnotes ? Array(steps).fill(null) : undefined,
      muted: false, vol: 0.6
    });
    render();
    toast(`Added "${label}" row`, 'success');
  }

  function clearAll() {
    rows.forEach(r => { r.cells.fill(false); if (r.notes) r.notes.fill(null); });
    render();
    toast('Sequencer cleared', 'info');
  }

  function randomize() {
    const drumTypes = ['kick','snare','hihat','perc'];
    rows.forEach(row => {
      if (drumTypes.includes(row.type)) {
        row.cells = row.cells.map(() => Math.random() > 0.65);
      }
    });
    render();
    toast('Pattern randomized ✦', 'info');
  }

  function onStep(cb) { onStepCallbacks.push(cb); }
  function getRows() { return rows; }
  function isPlaying() { return playing; }
  function getBPM() { return bpm; }
  function getSteps() { return steps; }
  function getCurrentStep() { return currentStep; }

  return { init: initRows, render, start, stop, setBPM, getBPM, setSwing, toggleMetronome,
           loadPattern, addRow, clearAll, randomize, onStep, getRows, isPlaying, getSteps,
           getCurrentStep, noteFreqMap: NOTE_FREQ_MAP };
})();
