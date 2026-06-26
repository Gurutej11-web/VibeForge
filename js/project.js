window.Project = (() => {
  const STORAGE_KEY = 'vibeforge_projects';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  }

  function save(name) {
    const rows = Sequencer.getRows().map(r => ({
      id: r.id, label: r.label, type: r.type, rowClass: r.rowClass,
      cells: [...r.cells], notes: r.notes ? [...r.notes] : undefined,
      muted: r.muted, vol: r.vol
    }));
    const project = {
      id: Date.now(),
      name: name || 'Untitled Track',
      bpm: Sequencer.getBPM(),
      rows,
      savedAt: new Date().toLocaleDateString()
    };
    const all = getAll();
    const existingIdx = all.findIndex(p => p.name === name);
    if (existingIdx >= 0) all[existingIdx] = project;
    else all.unshift(project);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 10)));
    toast('Project saved ✓', 'success');
    renderList();
  }

  function load(id) {
    const all = getAll();
    const project = all.find(p => p.id === id);
    if (!project) return;
    Sequencer.setBPM(project.bpm);
    Sequencer.loadPattern({ rows: project.rows });
    document.getElementById('project-name').value = project.name;
    toast(`Loaded "${project.name}"`, 'success');
  }

  function remove(id) {
    const all = getAll().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    renderList();
  }

  function renderList() {
    const container = document.getElementById('saved-projects');
    if (!container) return;
    const all = getAll();
    if (!all.length) { container.innerHTML = '<div style="padding:0.5rem 0.75rem;font-size:0.72rem;color:var(--text-muted)">No saved projects</div>'; return; }
    container.innerHTML = all.map(p => `
      <div class="saved-project-item" data-id="${p.id}">
        <span class="saved-project-name">${p.name}</span>
        <div style="display:flex;gap:0.4rem;align-items:center">
          <span class="saved-project-date">${p.savedAt}</span>
          <button class="action-btn-sm" onclick="Project.load(${p.id})">Load</button>
          <button class="action-btn-sm" onclick="event.stopPropagation();Project.remove(${p.id})" style="color:var(--accent-red)">✕</button>
        </div>
      </div>
    `).join('');
  }

  function init() {
    document.getElementById('btn-project-save')?.addEventListener('click', () => {
      const name = document.getElementById('project-name')?.value || 'Untitled Track';
      save(name);
    });
    document.getElementById('btn-project-load')?.addEventListener('click', () => {
      const all = getAll();
      if (!all.length) { toast('No saved projects', 'warning'); return; }
      toast('Select a project below', 'info');
    });
    document.getElementById('btn-project-new')?.addEventListener('click', () => {
      Sequencer.init();
      Sequencer.render();
      document.getElementById('project-name').value = 'Untitled Track';
      toast('New project created', 'success');
    });
    document.getElementById('btn-project-share')?.addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard?.writeText(url).then(() => toast('Studio link copied!', 'success')).catch(() => toast('Share: ' + url, 'info', 5000));
    });
    renderList();
  }

  return { init, save, load, remove, renderList };
})();
