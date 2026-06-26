window.PianoRoll = (() => {
  const NOTES = ['B','A#','A','G#','G','F#','F','E','D#','D','C#','C'];
  const OCTAVES = [5,4,3];
  let currentRowId = null;
  let steps = 16;

  function open(rowId, rowLabel) {
    currentRowId = rowId;
    document.getElementById('piano-roll-row-name').textContent = rowLabel;
    renderKeys();
    renderGrid();
    document.getElementById('piano-roll-modal').classList.remove('hidden');
  }

  function close() {
    document.getElementById('piano-roll-modal').classList.add('hidden');
  }

  function renderKeys() {
    const container = document.getElementById('pr-keys');
    container.innerHTML = '';
    OCTAVES.forEach(oct => {
      NOTES.forEach(note => {
        const isBlack = note.includes('#');
        const isC = note === 'C';
        const div = document.createElement('div');
        div.className = `pr-key${isBlack ? ' black' : ''}${isC ? ' c-note' : ''}`;
        div.textContent = isC ? `C${oct}` : '';
        container.appendChild(div);
      });
    });
  }

  function renderGrid() {
    const grid = document.getElementById('pr-grid');
    const row = Sequencer.getRows().find(r => r.id === currentRowId || r.id.startsWith(currentRowId));
    const totalNotes = OCTAVES.length * NOTES.length;
    steps = Sequencer.getSteps ? Sequencer.getSteps() : 16;

    grid.style.gridTemplateColumns = `repeat(${steps}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${totalNotes}, 24px)`;
    grid.innerHTML = '';

    for (let ni = 0; ni < totalNotes; ni++) {
      for (let si = 0; si < steps; si++) {
        const cell = document.createElement('div');
        cell.className = 'pr-cell';
        cell.dataset.note = ni;
        cell.dataset.step = si;

        // Check if this cell is active from sequencer row
        if (row) {
          const noteKey = getNoteKey(ni);
          if (row.cells[si] && row.notes && row.notes[si] === noteKey) {
            cell.classList.add('on');
          }
        }

        cell.addEventListener('click', () => {
          cell.classList.toggle('on');
          syncToSequencer();
        });
        grid.appendChild(cell);
      }
    }
  }

  function getNoteKey(noteIndex) {
    const octIdx = Math.floor(noteIndex / NOTES.length);
    const noteIdx = noteIndex % NOTES.length;
    return `${NOTES[noteIdx]}${OCTAVES[octIdx]}`;
  }

  function syncToSequencer() {
    const row = Sequencer.getRows().find(r => r.id === currentRowId || r.id.startsWith(currentRowId));
    if (!row) return;
    const grid = document.getElementById('pr-grid');
    const cells = grid.querySelectorAll('.pr-cell');

    // Reset
    row.cells.fill(false);
    if (row.notes) row.notes.fill(null);

    cells.forEach(cell => {
      if (cell.classList.contains('on')) {
        const si = +cell.dataset.step;
        const ni = +cell.dataset.note;
        row.cells[si] = true;
        if (row.notes) row.notes[si] = getNoteKey(ni);
      }
    });
    Sequencer.render();
  }

  function clear() {
    document.querySelectorAll('.pr-cell.on').forEach(c => c.classList.remove('on'));
    syncToSequencer();
  }

  function randomize() {
    const cells = document.querySelectorAll('.pr-cell');
    cells.forEach(c => c.classList.remove('on'));
    // Pick random cells per step
    for (let si = 0; si < steps; si++) {
      if (Math.random() > 0.6) {
        const noteCells = [...cells].filter(c => +c.dataset.step === si);
        if (noteCells.length) {
          const pick = noteCells[Math.floor(Math.random() * noteCells.length)];
          pick.classList.add('on');
        }
      }
    }
    syncToSequencer();
  }

  function init() {
    document.getElementById('pr-save')?.addEventListener('click', () => { syncToSequencer(); close(); toast('Piano roll saved', 'success'); });
    document.getElementById('pr-clear')?.addEventListener('click', clear);
    document.getElementById('pr-randomize')?.addEventListener('click', randomize);
    document.getElementById('piano-roll-modal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('piano-roll-modal')) close();
    });
  }

  return { init, open, close };
})();
