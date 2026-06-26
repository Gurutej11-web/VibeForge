// Mixer — channel strips
window.Mixer = (() => {
  let channels = [];
  let meterIntervalId = null;

  function syncRows(rows) {
    channels = rows.map(r => ({ id: r.id, label: r.label, vol: r.vol, muted: r.muted, solo: false }));
    render();
  }

  function render() {
    const container = document.getElementById('mixer');
    if (!container) return;
    container.innerHTML = '';

    channels.forEach((ch, i) => {
      const strip = document.createElement('div');
      strip.className = 'channel-strip';
      strip.dataset.ch = i;

      const label = document.createElement('div');
      label.className = 'ch-label';
      label.textContent = ch.label;
      strip.appendChild(label);

      const meter = document.createElement('div');
      meter.className = 'ch-meter';
      const fill = document.createElement('div');
      fill.className = 'ch-meter-fill';
      fill.id = `meter-${ch.id}`;
      meter.appendChild(fill);
      strip.appendChild(meter);

      const faderWrap = document.createElement('div');
      faderWrap.className = 'ch-fader-wrap';

      const fader = document.createElement('input');
      fader.type = 'range';
      fader.className = 'ch-fader';
      fader.min = 0; fader.max = 1; fader.step = 0.01;
      fader.value = ch.vol;
      fader.oninput = () => {
        channels[i].vol = +fader.value;
        const row = Sequencer.getRows().find(r => r.id === ch.id);
        if (row) row.vol = +fader.value;
      };
      faderWrap.appendChild(fader);
      strip.appendChild(faderWrap);

      const btns = document.createElement('div');
      btns.className = 'ch-buttons';

      const muteBtn = document.createElement('button');
      muteBtn.className = `ch-mute${ch.muted ? ' active' : ''}`;
      muteBtn.textContent = 'M';
      muteBtn.onclick = () => {
        channels[i].muted = !channels[i].muted;
        muteBtn.classList.toggle('active', channels[i].muted);
        const row = Sequencer.getRows().find(r => r.id === ch.id);
        if (row) row.muted = channels[i].muted;
      };
      btns.appendChild(muteBtn);

      const soloBtn = document.createElement('button');
      soloBtn.className = `ch-solo${ch.solo ? ' active' : ''}`;
      soloBtn.textContent = 'S';
      soloBtn.onclick = () => {
        channels[i].solo = !channels[i].solo;
        soloBtn.classList.toggle('active', channels[i].solo);
      };
      btns.appendChild(soloBtn);

      strip.appendChild(btns);
      container.appendChild(strip);
    });

    startMeters();
  }

  function startMeters() {
    if (meterIntervalId) clearInterval(meterIntervalId);
    meterIntervalId = setInterval(() => {
      channels.forEach(ch => {
        const fill = document.getElementById(`meter-${ch.id}`);
        if (!fill) return;
        // Simulate level based on mute state and vol
        const level = ch.muted ? 0 : (Math.random() * 0.4 + 0.1) * ch.vol;
        fill.style.height = `${level * 100}%`;
      });
    }, 80);
  }

  // Bounce meters with sequencer step
  function onStep(step) {
    channels.forEach(ch => {
      const fill = document.getElementById(`meter-${ch.id}`);
      if (!fill || ch.muted) return;
      const row = Sequencer.getRows().find(r => r.id === ch.id);
      if (!row) return;
      const active = row.cells[step];
      if (active) {
        fill.style.height = `${(0.5 + Math.random() * 0.5) * ch.vol * 100}%`;
        setTimeout(() => { if (fill) fill.style.height = '5%'; }, 150);
      }
    });
  }

  return { syncRows, render, onStep };
})();
