window.Arpeggiator = (() => {
  let mode = 'off';
  let rate = 8;
  let noteIndex = 0;
  let direction = 1;
  let baseChord = [];
  let intervalId = null;

  function setMode(m) {
    mode = m;
    if (m === 'off') stop();
    else if (baseChord.length) start();
  }

  function setRate(r) { rate = +r; if (intervalId) { stop(); start(); } }

  function setChord(freqs) { baseChord = [...freqs]; noteIndex = 0; }

  function start() {
    if (!baseChord.length || mode === 'off') return;
    stop();
    const bpm = Sequencer.getBPM();
    const interval = (60 / bpm) * (4 / rate) * 1000;
    intervalId = setInterval(() => {
      if (!baseChord.length || mode === 'off') return;
      AudioEngine.init(); AudioEngine.resume();
      const freq = baseChord[noteIndex % baseChord.length];
      AudioEngine.playNote(freq, 'triangle', interval / 1000 * 0.9, 0.3);
      advance();
    }, interval);
  }

  function advance() {
    if (mode === 'up') {
      noteIndex = (noteIndex + 1) % baseChord.length;
    } else if (mode === 'down') {
      noteIndex = (noteIndex - 1 + baseChord.length) % baseChord.length;
    } else if (mode === 'updown') {
      noteIndex += direction;
      if (noteIndex >= baseChord.length - 1) direction = -1;
      if (noteIndex <= 0) direction = 1;
    } else if (mode === 'random') {
      noteIndex = Math.floor(Math.random() * baseChord.length);
    }
  }

  function stop() {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  }

  function init() {
    document.getElementById('arp-mode')?.addEventListener('change', e => setMode(e.target.value));
    document.getElementById('arp-rate')?.addEventListener('change', e => setRate(e.target.value));
  }

  return { init, setMode, setRate, setChord, start, stop };
})();
