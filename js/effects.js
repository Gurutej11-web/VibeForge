window.Effects = (() => {
  function init() {
    const setup = (checkId, sliderId, valId, handler) => {
      const check = document.getElementById(checkId);
      const slider = document.getElementById(sliderId);
      const val = document.getElementById(valId);
      const update = () => {
        const enabled = check?.checked;
        const amount = +(slider?.value || 0) / 100;
        if (val) val.textContent = `${slider?.value || 0}%`;
        handler(enabled, amount);
      };
      check?.addEventListener('change', update);
      slider?.addEventListener('input', update);
      update();
    };

    setup('fx-reverb', 'fx-reverb-amt', 'fx-reverb-val', (on, amt) => {
      AudioEngine.setReverbAmount(on ? amt * 0.85 : 0);
    });
    setup('fx-delay', 'fx-delay-amt', 'fx-delay-val', (on, amt) => {
      AudioEngine.setDelayAmount(on ? amt * 0.5 : 0);
    });
    setup('fx-dist', 'fx-dist-amt', 'fx-dist-val', (on, amt) => {
      AudioEngine.setDistAmount(on ? amt : 0);
    });
    setup('fx-compressor', 'fx-comp-amt', 'fx-comp-val', (on, amt) => {
      AudioEngine.setCompressor && AudioEngine.setCompressor(on, amt);
    });

    document.getElementById('master-vol')?.addEventListener('input', e => {
      AudioEngine.setMasterVolume(+e.target.value / 100);
    });
  }
  return { init };
})();
