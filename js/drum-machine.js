// Drum Machine — 4x4 pad grid
window.DrumMachine = (() => {
  let kit = 'electronic';

  const PADS = [
    { label: 'Kick',     type: 'kick',    key: 'q' },
    { label: 'Snare',    type: 'snare',   key: 'w' },
    { label: 'Hi-Hat',   type: 'hihat',   key: 'e' },
    { label: 'Open Hat', type: 'openhat', key: 'r' },
    { label: 'Clap',     type: 'clap',    key: 'z' },
    { label: 'Tom',      type: 'tom',     key: 'x' },
    { label: 'Rim',      type: 'rim',     key: 'c' },
    { label: 'Perc',     type: 'perc',    key: 'v' },
    { label: 'Sub',      type: 'kick',    key: '1' },
    { label: 'Snap',     type: 'clap',    key: '2' },
    { label: 'Shaker',   type: 'hihat',   key: '3' },
    { label: 'Crash',    type: 'openhat', key: '4' },
    { label: 'Tom 2',    type: 'tom',     key: '5' },
    { label: 'Ride',     type: 'hihat',   key: '6' },
    { label: 'Cowbell',  type: 'perc',    key: '7' },
    { label: 'FX',       type: 'rim',     key: '8' },
  ];

  const KEY_TO_PAD = {};

  function render() {
    const container = document.getElementById('drum-pads');
    if (!container) return;
    container.innerHTML = '';

    PADS.forEach((pad, i) => {
      const el = document.createElement('div');
      el.className = 'drum-pad';
      el.dataset.type = pad.type;
      el.dataset.index = i;
      el.innerHTML = `<span>${pad.label}</span><span class="drum-pad-label">[${pad.key.toUpperCase()}]</span>`;

      el.addEventListener('mousedown', () => triggerPad(pad.type, el));
      container.appendChild(el);
      KEY_TO_PAD[pad.key] = { type: pad.type, el };
    });

    // Kit change
    document.getElementById('drum-kit')?.addEventListener('change', e => {
      kit = e.target.value;
    });
  }

  function triggerPad(type, el) {
    AudioEngine.init();
    AudioEngine.resume();
    AudioEngine.playDrum(type);
    el.classList.add('hit');
    setTimeout(() => el.classList.remove('hit'), 100);
  }

  function setupKeys() {
    document.addEventListener('keydown', e => {
      if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      const pad = KEY_TO_PAD[e.key.toLowerCase()];
      if (pad) triggerPad(pad.type, pad.el);
    });
  }

  function currentKit() { return kit; }

  return { render, setupKeys, currentKit };
})();
