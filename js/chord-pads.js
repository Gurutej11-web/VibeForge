// Chord Pads
window.ChordPads = (() => {
  let chords = [
    { name: 'Cm', notes: [261.63, 311.13, 392.00] },
    { name: 'Fm', notes: [349.23, 415.30, 523.25] },
    { name: 'Gm', notes: [392.00, 466.16, 587.33] },
    { name: 'Bb', notes: [466.16, 587.33, 698.46] },
    { name: 'Eb', notes: [311.13, 392.00, 466.16] },
    { name: 'Ab', notes: [415.30, 523.25, 622.25] },
    { name: 'Dm', notes: [293.66, 349.23, 440.00] },
    { name: 'Am', notes: [220.00, 261.63, 329.63] },
  ];

  let heldNodes = [];

  function render() {
    const container = document.getElementById('chord-pads');
    if (!container) return;
    container.innerHTML = '';

    chords.forEach((chord, i) => {
      const pad = document.createElement('div');
      pad.className = 'chord-pad';
      pad.innerHTML = `<span class="chord-name">${chord.name}</span><span class="chord-num">${i + 1}</span>`;

      pad.addEventListener('mousedown', () => {
        AudioEngine.init();
        AudioEngine.resume();
        AudioEngine.playChord(chord.notes, 1.5);
        pad.classList.add('active');
        triggerRipple(pad);
      });

      pad.addEventListener('mouseup', () => {
        pad.classList.remove('active');
      });

      pad.addEventListener('mouseleave', () => {
        pad.classList.remove('active');
      });

      container.appendChild(pad);
    });
  }

  function triggerRipple(el) {
    el.classList.remove('ripple');
    void el.offsetWidth;
    el.classList.add('ripple');
    setTimeout(() => el.classList.remove('ripple'), 700);
  }

  function setChords(newChords) {
    // newChords: array of { name, notes (freq array) }
    chords = newChords;
    render();
  }

  function chordsFromNames(names, scale) {
    // Build chord objects from chord name strings like ['Cm', 'Fm', 'Gm', 'Bb']
    const noteMap = {
      'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13,
      'Eb': 311.13, 'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
      'G': 392.00, 'G#': 415.30, 'Ab': 415.30, 'A': 440.00, 'A#': 466.16,
      'Bb': 466.16, 'B': 493.88
    };

    function getFreq(root, semis) {
      return root * Math.pow(2, semis / 12);
    }

    return names.slice(0, 8).map(name => {
      // Parse chord name
      let root = name.replace(/m|maj|min|7|dim|aug|\d/g, '');
      const isMinor = name.includes('m') && !name.includes('maj');
      const rootFreq = noteMap[root] || 261.63;
      const third = isMinor ? 3 : 4;
      return {
        name,
        notes: [rootFreq, getFreq(rootFreq, third), getFreq(rootFreq, 7)]
      };
    });
  }

  function loadFromAI(chordNames) {
    const built = chordsFromNames(chordNames);
    setChords(built);
  }

  return { render, setChords, loadFromAI };
})();
