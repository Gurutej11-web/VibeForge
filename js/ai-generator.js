window.AIGenerator = (() => {
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  let lastResult = null;

  function getKey() { return localStorage.getItem('vibeforge_groq_key') || ''; }

  async function groqCall(prompt, maxTokens = 600) {
    const key = getKey();
    if (!key) throw new Error('No Groq API key. Enter it in the Generate panel.');
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75, max_tokens: maxTokens
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const text = data.choices[0].message.content.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    return JSON.parse(match[0]);
  }

  async function generateTrack(mood, genre, bpm, description) {
    const prompt = `You are a music theory AI for a web music studio. Generate a ${genre} track with ${mood} mood at ${bpm} BPM.${description ? ` User says: "${description}"` : ''}

Return ONLY valid JSON (no markdown, no explanation):
{"chords":["Cm","Fm","Gm","Bb","Eb","Ab","Dm","Am"],"scale":"C minor","scaleNotes":["C","D","Eb","F","G","Ab","Bb"],"basslinePattern":[1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0],"kickPattern":[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],"snarePattern":[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],"hihatPattern":[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],"creativeDirection":"Think late-night city drive — warm chords underneath a minimal melody with space to breathe.","rootNote":"C","tempo":${bpm}}`;
    return groqCall(prompt, 500);
  }

  async function generateMelody(scale, scaleNotes, mood, bpm) {
    const notes = (scaleNotes || ['C','D','E','G','A']).join(', ');
    const prompt = `Generate an 8-note melody for a ${mood} track in ${scale} at ${bpm} BPM. Use notes: ${notes} with octaves like C4, D4.

Return ONLY valid JSON:
{"melody":["C4","E4","G4","A4","G4","E4","D4","C4"],"pattern":[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]}`;
    return groqCall(prompt, 200);
  }

  function applyTrackResult(result) {
    lastResult = result;
    Sequencer.setBPM(result.tempo || 85);

    const patRows = [
      { id:'kick',  cells: (result.kickPattern  ||[]).map(Boolean) },
      { id:'snare', cells: (result.snarePattern ||[]).map(Boolean) },
      { id:'hihat', cells: (result.hihatPattern ||[]).map(Boolean) },
      { id:'bass',  cells: (result.basslinePattern||[]).map(Boolean),
        notes: (result.basslinePattern||[]).map(v => v ? `${result.rootNote||'C'}2` : null) },
    ];
    Sequencer.loadPattern({ rows: patRows });

    if (result.chords?.length) ChordPads.loadFromAI(result.chords);
    if (result.scaleNotes?.length) Keyboard.setScale(null, null);

    if (result.creativeDirection) {
      const bar = document.getElementById('direction-bar');
      const txt = document.getElementById('direction-text');
      if (bar && txt) { bar.classList.remove('hidden'); txt.textContent = result.creativeDirection; }
    }
    return result;
  }

  function applyMelodyResult(result) {
    if (!result?.melody) return;
    const rows = Sequencer.getRows();
    let melRow = rows.find(r => r.id === 'melody' || r.id.startsWith('melody-'));
    if (!melRow) {
      Sequencer.addRow('melody', 'Melody');
      melRow = Sequencer.getRows().find(r => r.id.startsWith('melody'));
    }
    if (melRow) {
      const pat = result.pattern || Array(16).fill(0);
      const mel = result.melody || [];
      melRow.cells = pat.map(Boolean);
      melRow.notes = pat.map((v,i) => v ? (mel[i] || mel[i % mel.length] || 'C4') : null);
    }
    Sequencer.render();
    const info = document.getElementById('melody-info');
    if (info) info.textContent = result.melody?.join(' – ') || 'Generated';
  }

  function getLastResult() { return lastResult; }

  return { generateTrack, generateMelody, applyTrackResult, applyMelodyResult, getLastResult };
})();
