window.Mixer = (() => {
  let channels = [];
  let meterInterval = null;

  function syncRows(rows) {
    channels = rows.map(r => ({ id:r.id, label:r.label, vol:r.vol, muted:r.muted, solo:false }));
    render();
  }

  function render() {
    const container = document.getElementById('mixer');
    if (!container) return;
    container.innerHTML = '';
    channels.forEach((ch, i) => {
      const strip = document.createElement('div');
      strip.className = 'ch-strip';

      strip.innerHTML = `
        <div class="ch-label" title="${ch.label}">${ch.label}</div>
        <div class="ch-meter"><div class="ch-meter-fill" id="meter-${ch.id}"></div></div>
        <input type="range" class="ch-fader" min="0" max="1" step="0.01" value="${ch.vol}" data-ch="${i}" />
        <div class="ch-btns">
          <button class="ch-btn${ch.muted?' m-active':''}" data-type="m" data-ch="${i}">M</button>
          <button class="ch-btn${ch.solo?' s-active':''}" data-type="s" data-ch="${i}">S</button>
        </div>
      `;

      strip.querySelector('.ch-fader').addEventListener('input', e => {
        channels[i].vol = +e.target.value;
        const row = Sequencer.getRows().find(r => r.id === ch.id);
        if (row) row.vol = channels[i].vol;
      });

      strip.querySelectorAll('.ch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.type === 'm') {
            channels[i].muted = !channels[i].muted;
            btn.classList.toggle('m-active', channels[i].muted);
            const row = Sequencer.getRows().find(r => r.id === ch.id);
            if (row) row.muted = channels[i].muted;
          } else {
            channels[i].solo = !channels[i].solo;
            btn.classList.toggle('s-active', channels[i].solo);
          }
        });
      });

      container.appendChild(strip);
    });
    startMeters();
  }

  function startMeters() {
    if (meterInterval) clearInterval(meterInterval);
    meterInterval = setInterval(() => {
      channels.forEach(ch => {
        const fill = document.getElementById(`meter-${ch.id}`);
        if (!fill || ch.muted) { if (fill) fill.style.height = '0%'; return; }
        fill.style.height = `${(Math.random() * 0.3 + 0.05) * ch.vol * 100}%`;
      });
    }, 100);
  }

  function onStep(step) {
    channels.forEach(ch => {
      const fill = document.getElementById(`meter-${ch.id}`);
      if (!fill || ch.muted) return;
      const row = Sequencer.getRows().find(r => r.id === ch.id);
      if (!row?.cells[step]) return;
      fill.style.height = `${(0.5 + Math.random() * 0.5) * ch.vol * 100}%`;
      setTimeout(() => { if (fill) fill.style.height = '4%'; }, 120);
    });
  }

  return { syncRows, render, onStep };
})();
