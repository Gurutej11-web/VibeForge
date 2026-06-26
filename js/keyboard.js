// Playable Keyboard
window.Keyboard = (() => {
  let octave = 4;
  let scale = ['C', 'D', 'E', 'G', 'A']; // default pentatonic
  let recordMode = false;
  let activeKeys = new Set();

  const WHITE_NOTES = ['C','D','E','F','G','A','B'];
  const BLACK_NOTES = { 'C#': 1, 'D#': 2, 'F#': 4, 'G#': 5, 'A#': 6 }; // after white key index

  const KEY_MAP = {
    'a': 'C', 'w': 'C#', 's': 'D', 'e': 'D#', 'd': 'E',
    'f': 'F', 't': 'F#', 'g': 'G', 'y': 'G#', 'h': 'A',
    'u': 'A#', 'j': 'B', 'k': 'C+1'
  };

  const NOTE_FREQS = {
    C: 261.63, 'C#': 277.18, D: 293.66, 'D#': 311.13, E: 329.63,
    F: 349.23, 'F#': 369.99, G: 392.00, 'G#': 415.30, A: 440.00,
    'A#': 466.16, B: 493.88
  };

  function noteFreq(note, oct) {
    const base = NOTE_FREQS[note] || 261.63;
    return base * Math.pow(2, oct - 4);
  }

  function render() {
    const container = document.getElementById('keyboard');
    if (!container) return;
    container.innerHTML = '';

    const octaves = 2;
    for (let o = 0; o < octaves; o++) {
      const oct = octave + o;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;position:relative;flex:1;';

      WHITE_NOTES.forEach((note, wi) => {
        const key = document.createElement('div');
        const inScale = scale.includes(note);
        key.className = `white-key${inScale ? ' in-scale' : ''}`;
        key.dataset.note = note;
        key.dataset.oct = oct;

        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = wi === 0 ? `${note}${oct}` : '';
        key.appendChild(label);

        key.addEventListener('mousedown', e => { e.preventDefault(); triggerNote(note, oct, key); });
        key.addEventListener('mouseup', () => releaseNote(key));
        key.addEventListener('mouseleave', () => releaseNote(key));

        wrap.appendChild(key);

        // Black key after this white key?
        const sharpNote = `${note}#`;
        if (WHITE_NOTES[wi + 1] && !['E', 'B'].includes(note)) {
          const bkey = document.createElement('div');
          bkey.className = `black-key${scale.includes(sharpNote) ? ' in-scale' : ''}`;
          bkey.dataset.note = sharpNote;
          bkey.dataset.oct = oct;
          // Position relative to white key
          bkey.style.cssText = `left:calc(${(wi + 1) * (100 / WHITE_NOTES.length)}% - 8px);`;
          bkey.addEventListener('mousedown', e => { e.preventDefault(); triggerNote(sharpNote, oct, bkey); });
          bkey.addEventListener('mouseup', () => releaseNote(bkey));
          bkey.addEventListener('mouseleave', () => releaseNote(bkey));
          wrap.appendChild(bkey);
        }
      });

      container.appendChild(wrap);
    }
  }

  function triggerNote(note, oct, el) {
    AudioEngine.init();
    AudioEngine.resume();
    const freq = noteFreq(note, oct);
    AudioEngine.playNote(freq, 'triangle', 0.8, 0.4);
    el.classList.add('pressed');

    if (recordMode && Sequencer.isPlaying()) {
      recordToSequencer(note, oct);
    }
  }

  function releaseNote(el) {
    el.classList.remove('pressed');
  }

  function recordToSequencer(note, oct) {
    const rows = Sequencer.getRows();
    let leadRow = rows.find(r => r.id === 'lead');
    if (leadRow) {
      const step = (Sequencer.currentStep || 0);
      leadRow.cells[step] = true;
      if (leadRow.notes) leadRow.notes[step] = `${note}${oct}`;
    }
  }

  function setScale(notes) {
    scale = notes;
    render();
  }

  function setOctave(o) {
    octave = Math.max(2, Math.min(6, o));
    document.getElementById('octave-display').textContent = `Oct ${octave}`;
    render();
  }

  function setupKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      const noteStr = KEY_MAP[e.key.toLowerCase()];
      if (!noteStr) return;
      let note = noteStr, oct = octave;
      if (noteStr === 'C+1') { note = 'C'; oct = octave + 1; }
      if (activeKeys.has(noteStr)) return;
      activeKeys.add(noteStr);

      const freq = noteFreq(note, oct);
      AudioEngine.init();
      AudioEngine.resume();
      AudioEngine.playNote(freq, 'triangle', 0.8, 0.4);

      // Highlight key
      const keyEl = document.querySelector(`[data-note="${note}"][data-oct="${oct}"]`);
      if (keyEl) keyEl.classList.add('pressed');
    });

    document.addEventListener('keyup', e => {
      const noteStr = KEY_MAP[e.key.toLowerCase()];
      if (!noteStr) return;
      activeKeys.delete(noteStr);
      let note = noteStr, oct = octave;
      if (noteStr === 'C+1') { note = 'C'; oct = octave + 1; }
      const keyEl = document.querySelector(`[data-note="${note}"][data-oct="${oct}"]`);
      if (keyEl) keyEl.classList.remove('pressed');
    });

    document.getElementById('oct-up')?.addEventListener('click', () => setOctave(octave + 1));
    document.getElementById('oct-down')?.addEventListener('click', () => setOctave(octave - 1));
    document.getElementById('kb-record-mode')?.addEventListener('change', e => {
      recordMode = e.target.checked;
    });
  }

  return { render, setScale, setOctave, setupKeyboard };
})();
