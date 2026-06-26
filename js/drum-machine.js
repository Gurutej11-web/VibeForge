window.DrumMachine = (() => {
  let kit = 'electronic';
  const PADS = [
    { label:'Kick',    type:'kick',    key:'q' },
    { label:'Snare',   type:'snare',   key:'w' },
    { label:'Hi-Hat',  type:'hihat',   key:'e' },
    { label:'Open Hat',type:'openhat', key:'r' },
    { label:'Clap',    type:'clap',    key:'z' },
    { label:'Tom',     type:'tom',     key:'x' },
    { label:'Rim',     type:'rim',     key:'c' },
    { label:'Perc',    type:'perc',    key:'v' },
    { label:'Sub',     type:'kick',    key:'1' },
    { label:'Snap',    type:'clap',    key:'2' },
    { label:'Shaker',  type:'hihat',   key:'3' },
    { label:'Crash',   type:'openhat', key:'4' },
    { label:'Tom 2',   type:'tom',     key:'5' },
    { label:'Ride',    type:'hihat',   key:'6' },
    { label:'Cowbell', type:'perc',    key:'7' },
    { label:'FX Hit',  type:'rim',     key:'8' },
  ];
  const keyToPad = {};

  function render() {
    const container = document.getElementById('drum-pads');
    if (!container) return;
    container.innerHTML = '';
    PADS.forEach((pad, i) => {
      const el = document.createElement('div');
      el.className = 'drum-pad';
      el.innerHTML = `<span>${pad.label}</span><span class="drum-pad-label">[${pad.key.toUpperCase()}]</span>`;
      el.addEventListener('mousedown', () => trigger(pad.type, el));
      el.addEventListener('touchstart', e => { e.preventDefault(); trigger(pad.type, el); });
      container.appendChild(el);
      keyToPad[pad.key] = { type: pad.type, el };
    });

    document.getElementById('drum-kit')?.addEventListener('change', e => { kit = e.target.value; });
  }

  function trigger(type, el) {
    AudioEngine.init(); AudioEngine.resume();
    AudioEngine.playDrum(type);
    el.classList.add('hit');
    setTimeout(() => el.classList.remove('hit'), 110);
  }

  function setupKeys() {
    document.addEventListener('keydown', e => {
      if (e.repeat || ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      // Skip drum keys when pressing piano keys
      const pianoKeys = new Set(['a','s','d','f','g','h','j','k','w','t','y','u','z','x']);
      if (pianoKeys.has(k)) return;
      const pad = keyToPad[k];
      if (pad) trigger(pad.type, pad.el);
    });
  }

  function currentKit() { return kit; }
  return { render, setupKeys, currentKit };
})();
