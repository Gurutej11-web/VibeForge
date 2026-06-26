window.ChordPads = (() => {
  let chords = [
    { name:'Cm', notes:[261.63,311.13,392.00] },
    { name:'Fm', notes:[349.23,415.30,523.25] },
    { name:'Gm', notes:[392.00,466.16,587.33] },
    { name:'Bb', notes:[466.16,587.33,698.46] },
    { name:'Eb', notes:[311.13,392.00,466.16] },
    { name:'Ab', notes:[415.30,523.25,622.25] },
    { name:'Dm', notes:[293.66,349.23,440.00] },
    { name:'Am', notes:[220.00,261.63,329.63] },
  ];

  function render() {
    const container = document.getElementById('chord-pads');
    if (!container) return;
    container.innerHTML = '';
    chords.forEach((chord, i) => {
      const pad = document.createElement('div');
      pad.className = 'chord-pad';
      pad.innerHTML = `<span class="chord-pad-name">${chord.name}</span><span class="chord-pad-num">${i + 1}</span>`;

      pad.addEventListener('mousedown', e => {
        AudioEngine.init(); AudioEngine.resume();
        AudioEngine.playChord(chord.notes, 1.8);
        pad.classList.add('active');
        addRipple(pad, e);
        if (window.Arpeggiator) Arpeggiator.setChord(chord.notes);
      });
      pad.addEventListener('mouseup', () => pad.classList.remove('active'));
      pad.addEventListener('mouseleave', () => pad.classList.remove('active'));
      pad.addEventListener('touchstart', e => { e.preventDefault(); pad.dispatchEvent(new MouseEvent('mousedown')); });
      pad.addEventListener('touchend', () => pad.dispatchEvent(new MouseEvent('mouseup')));
      container.appendChild(pad);
    });
  }

  function addRipple(el, e) {
    const rect = el.getBoundingClientRect();
    const x = (e?.clientX || rect.left + rect.width/2) - rect.left;
    const y = (e?.clientY || rect.top + rect.height/2) - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'chord-ripple';
    ripple.style.cssText = `left:${x}px;top:${y}px;`;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  }

  function chordsFromNames(names) {
    const noteMap = {
      'C':261.63,'C#':277.18,'Db':277.18,'D':293.66,'D#':311.13,'Eb':311.13,
      'E':329.63,'F':349.23,'F#':369.99,'Gb':369.99,'G':392.00,'G#':415.30,
      'Ab':415.30,'A':440.00,'A#':466.16,'Bb':466.16,'B':493.88
    };
    return names.slice(0, 8).map(name => {
      const rootStr = name.replace(/m7?|maj7?|min7?|7|dim|aug|\d/g, '');
      const isMinor = /m(?!aj)/i.test(name.slice(1));
      const rootFreq = noteMap[rootStr] || 261.63;
      const third = isMinor ? 3 : 4;
      const fifth = 7;
      return {
        name,
        notes: [rootFreq, rootFreq * Math.pow(2, third/12), rootFreq * Math.pow(2, fifth/12)]
      };
    });
  }

  function loadFromAI(chordNames) {
    chords = chordsFromNames(chordNames);
    render();
  }

  return { render, loadFromAI };
})();
