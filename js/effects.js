// Effects Rack
window.Effects = (() => {
  function init() {
    const reverbToggle = document.getElementById('fx-reverb');
    const reverbAmt = document.getElementById('fx-reverb-amt');
    const reverbVal = document.getElementById('fx-reverb-val');

    const delayToggle = document.getElementById('fx-delay');
    const delayAmt = document.getElementById('fx-delay-amt');
    const delayVal = document.getElementById('fx-delay-val');

    const distToggle = document.getElementById('fx-dist');
    const distAmt = document.getElementById('fx-dist-amt');
    const distVal = document.getElementById('fx-dist-val');

    function updateReverb() {
      const enabled = reverbToggle.checked;
      const amt = +reverbAmt.value / 100;
      AudioEngine.setReverbAmount(enabled ? amt * 0.8 : 0);
      reverbVal.textContent = `${reverbAmt.value}%`;
    }

    function updateDelay() {
      const enabled = delayToggle.checked;
      const amt = +delayAmt.value / 100;
      AudioEngine.setDelayAmount(enabled ? amt * 0.5 : 0);
      delayVal.textContent = `${delayAmt.value}%`;
    }

    function updateDist() {
      const enabled = distToggle.checked;
      const amt = +distAmt.value / 100;
      AudioEngine.setDistAmount(enabled ? amt : 0);
      distVal.textContent = `${distAmt.value}%`;
    }

    reverbToggle?.addEventListener('change', updateReverb);
    reverbAmt?.addEventListener('input', updateReverb);
    delayToggle?.addEventListener('change', updateDelay);
    delayAmt?.addEventListener('input', updateDelay);
    distToggle?.addEventListener('change', updateDist);
    distAmt?.addEventListener('input', updateDist);

    // Master controls
    document.getElementById('master-vol')?.addEventListener('input', e => {
      AudioEngine.setMasterVolume(+e.target.value / 100);
    });

    document.getElementById('master-reverb')?.addEventListener('input', e => {
      const amt = +e.target.value / 100;
      AudioEngine.setReverbAmount(amt * 0.8);
      // sync reverb slider too
      if (reverbAmt) reverbAmt.value = e.target.value;
      if (reverbVal) reverbVal.textContent = `${e.target.value}%`;
    });
  }

  return { init };
})();
