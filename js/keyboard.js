window.Keyboard = (() => {
  let octave = 4;
  let activeScale = 'minor';
  let recordMode = false;
  let heldKeys = new Set();

  const SCALE_INTERVALS = {
    major:      [0,2,4,5,7,9,11],
    minor:      [0,2,3,5,7,8,10],
    pentatonic: [0,2,4,7,9],
    blues:      [0,3,5,6,7,10],
    dorian:     [0,2,3,5,7,9,10],
    mixolydian: [0,2,4,5,7,9,10]
  };

  const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const WHITE_NOTES = ['C','D','E','F','G','A','B'];
  const WHITE_TO_SEMITONE = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const BLACK_POSITIONS = {C:0,D:1,F:3,G:4,A:5};

  const KEY_MAP = {
    'a':'C','w':'C#','s':'D','e':'D#','d':'E','f':'F','t':'F#',
    'g':'G','y':'G#','h':'A','u':'A#','j':'B','k':'C+1'
  };

  function noteFreq(semitone, oct) {
    return 261.63 * Math.pow(2, (semitone - 0 + (oct - 4) * 12) / 12);
  }

  function isInScale(semitone) {
    const intervals = SCALE_INTERVALS[activeScale] || SCALE_INTERVALS.minor;
    return intervals.includes(semitone % 12);
  }

  function render() {
    const container = document.getElementById('keyboard');
    if (!container) return;
    container.innerHTML = '';

    for (let o = 0; o < 2; o++) {
      const oct = octave + o;
      const group = document.createElement('div');
      group.className = 'octave-group';
      group.style.cssText = 'display:flex;position:relative;flex:1;';

      WHITE_NOTES.forEach((note, wi) => {
        const semi = WHITE_TO_SEMITONE[note];
        const inScale = isInScale(semi);
        const key = document.createElement('div');
        key.className = `white-key${inScale ? ' in-scale' : ''}`;
        key.dataset.note = note; key.dataset.oct = oct;

        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = wi === 0 ? `${note}${oct}` : '';
        key.appendChild(label);

        key.addEventListener('mousedown', e => { e.preventDefault(); triggerNote(note, oct, key, semi); });
        key.addEventListener('mouseup', () => key.classList.remove('pressed'));
        key.addEventListener('mouseleave', () => key.classList.remove('pressed'));
        key.addEventListener('touchstart', e => { e.preventDefault(); triggerNote(note, oct, key, semi); });
        key.addEventListener('touchend', () => key.classList.remove('pressed'));
        group.appendChild(key);

        // Add black key
        if (!['E','B'].includes(note)) {
          const sharpNote = note + '#';
          const sharpSemi = semi + 1;
          const sharpInScale = isInScale(sharpSemi);
          const bkey = document.createElement('div');
          bkey.className = `black-key${sharpInScale ? ' in-scale' : ''}`;
          bkey.dataset.note = sharpNote; bkey.dataset.oct = oct;

          const keyW = 100 / WHITE_NOTES.length;
          bkey.style.left = `calc(${(wi + 1) * keyW}% - ${keyW * 0.35}%)`;

          bkey.addEventListener('mousedown', e => { e.preventDefault(); triggerNote(sharpNote, oct, bkey, sharpSemi); });
          bkey.addEventListener('mouseup', () => bkey.classList.remove('pressed'));
          bkey.addEventListener('mouseleave', () => bkey.classList.remove('pressed'));
          group.appendChild(bkey);
        }
      });
      container.appendChild(group);
    }
  }

  function triggerNote(note, oct, el, semi) {
    AudioEngine.init(); AudioEngine.resume();
    const freq = noteFreq(semi !== undefined ? semi : 0, oct);
    AudioEngine.playNote(freq, 'triangle', 0.8, 0.4);
    el.classList.add('pressed');
    if (recordMode && Sequencer.isPlaying()) {
      const step = Sequencer.getCurrentStep();
      const rows = Sequencer.getRows();
      const lead = rows.find(r => r.id === 'lead');
      if (lead) { lead.cells[step] = true; if (lead.notes) lead.notes[step] = `${note}${oct}`; }
    }
    Arpeggiator?.setChord && arpNoteFreqs([freq]);
  }

  function arpNoteFreqs(freqs) { /* called when holding a chord pad */ }

  function setScale(scaleName, rootNote) {
    activeScale = scaleName || 'minor';
    render();
  }

  function setOctave(o) {
    octave = Math.max(2, Math.min(6, o));
    document.getElementById('octave-display').textContent = `Oct ${octave}`;
    render();
  }

  function setupKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.repeat || ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();

      // Octave shortcuts
      if (k === 'z') { setOctave(octave - 1); return; }
      if (k === 'x') { setOctave(octave + 1); return; }

      const noteStr = KEY_MAP[k];
      if (!noteStr || heldKeys.has(k)) return;
      heldKeys.add(k);

      let note = noteStr, oct = octave;
      if (noteStr === 'C+1') { note = 'C'; oct = octave + 1; }

      const semi = CHROMATIC.indexOf(note);
      const freq = noteFreq(semi, oct);
      AudioEngine.init(); AudioEngine.resume();
      AudioEngine.playNote(freq, 'triangle', 0.8, 0.4);
      const keyEl = document.querySelector(`[data-note="${note}"][data-oct="${oct}"]`);
      if (keyEl) keyEl.classList.add('pressed');
    });

    document.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      heldKeys.delete(k);
      const noteStr = KEY_MAP[k];
      if (!noteStr) return;
      let note = noteStr, oct = octave;
      if (noteStr === 'C+1') { note = 'C'; oct = octave + 1; }
      document.querySelector(`[data-note="${note}"][data-oct="${oct}"]`)?.classList.remove('pressed');
    });

    document.getElementById('oct-up')?.addEventListener('click', () => setOctave(octave + 1));
    document.getElementById('oct-down')?.addEventListener('click', () => setOctave(octave - 1));
    document.getElementById('kb-record-mode')?.addEventListener('change', e => { recordMode = e.target.checked; });
    document.getElementById('scale-select')?.addEventListener('change', e => setScale(e.target.value));
  }

  return { render, setScale, setOctave, setupKeyboard };
})();
