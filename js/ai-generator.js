// Groq AI Generator
window.AIGenerator = (() => {
  function getApiKey() {
    return localStorage.getItem('vibeforge_groq_key') || '';
  }
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

  const MOOD_COLORS = {
    happy: '#F59E0B',
    melancholic: '#6366F1',
    tense: '#EF4444',
    euphoric: '#A855F7',
    dreamy: '#06B6D4',
    aggressive: '#FF4500',
  };

  let lastResult = null;

  async function generateTrack(mood, genre, bpm, description) {
    const prompt = `You are a music theory AI. Generate a starting point for a ${genre} track with a ${mood} mood at ${bpm} BPM.
${description ? `User description: "${description}"` : ''}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "chords": ["Cm", "Fm", "Gm", "Bb", "Eb", "Ab", "Dm", "Am"],
  "scale": "C minor",
  "scaleNotes": ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
  "basslinePattern": [1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0],
  "kickPattern": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
  "snarePattern": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
  "hihatPattern": [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
  "creativeDirection": "Think late-night city drive — warm chords underneath a minimal melody with space to breathe.",
  "rootNote": "C",
  "tempo": ${bpm}
}`;

    const key = getApiKey();
    if (!key) throw new Error('No Groq API key set. Enter it in the settings panel.');
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices[0].message.content.trim();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  }

  async function generateMelody(scale, scaleNotes, mood, bpm) {
    const notes = scaleNotes || ['C', 'D', 'E', 'G', 'A'];
    const prompt = `Generate an 8-note melodic phrase for a ${mood} track in ${scale} at ${bpm} BPM.
Use only these notes: ${notes.join(', ')} (can add octave numbers like C4, D4, E5).

Respond ONLY with valid JSON (no markdown):
{
  "melody": ["C4", "E4", "G4", "A4", "G4", "E4", "D4", "C4"],
  "pattern": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]
}`;

    const key = getApiKey();
    if (!key) throw new Error('No Groq API key set.');
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 200
      })
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices[0].message.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  }

  function applyTrackResult(result) {
    lastResult = result;

    // Set BPM
    Sequencer.setBPM(result.tempo || result.bpm || 85);

    // Load drum patterns into sequencer
    const patternRows = [
      { id: 'kick',  cells: (result.kickPattern || []).map(v => !!v) },
      { id: 'snare', cells: (result.snarePattern || []).map(v => !!v) },
      { id: 'hihat', cells: (result.hihatPattern || []).map(v => !!v) },
    ];

    // Bass pattern (simple root note bassline)
    const bassNotes = result.basslinePattern?.map((v, i) => {
      if (!v) return null;
      const root = result.rootNote || 'C';
      return `${root}2`;
    }) || [];
    patternRows.push({ id: 'bass', cells: (result.basslinePattern || []).map(v => !!v), notes: bassNotes });

    Sequencer.loadPattern({ rows: patternRows });

    // Load chord pads
    if (result.chords) {
      ChordPads.loadFromAI(result.chords);
    }

    // Set keyboard scale
    if (result.scaleNotes) {
      Keyboard.setScale(result.scaleNotes);
    }

    // Set mood color
    const color = MOOD_COLORS[result.mood] || MOOD_COLORS.dreamy;

    // Show direction
    if (result.creativeDirection) {
      const bar = document.getElementById('direction-bar');
      const text = document.getElementById('direction-text');
      if (bar && text) {
        bar.classList.remove('hidden');
        text.textContent = result.creativeDirection;
      }
    }

    return result;
  }

  function applyMelodyResult(result) {
    if (!result || !result.melody) return;

    // Add/update melody row in sequencer
    const rows = Sequencer.getRows();
    let melodyRow = rows.find(r => r.id === 'melody');

    if (!melodyRow) {
      Sequencer.addRow('melody', 'Melody');
      melodyRow = Sequencer.getRows().find(r => r.id === 'melody' || r.id.startsWith('melody-'));
    }

    if (melodyRow) {
      const pattern = result.pattern || Array(16).fill(0);
      const melody = result.melody || [];
      melodyRow.cells = pattern.map(v => !!v);
      melodyRow.notes = pattern.map((v, i) => v ? (melody[i] || melody[i % melody.length] || 'C4') : null);
    }

    Sequencer.render();

    const info = document.getElementById('melody-info');
    if (info && result.melody) {
      info.textContent = result.melody.join(' – ');
    }
  }

  function getMoodColor(mood) {
    return MOOD_COLORS[mood] || MOOD_COLORS.euphoric;
  }

  function getLastResult() { return lastResult; }

  return { generateTrack, generateMelody, applyTrackResult, applyMelodyResult, getMoodColor, getLastResult };
})();
