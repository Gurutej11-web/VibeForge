// Preset tracks
window.Presets = (() => {
  const PRESETS = {
    lofi: {
      mood: 'melancholic', genre: 'lo-fi', bpm: 75, chords: ['Cm', 'Fm', 'Gm', 'Bb'],
      scaleNotes: ['C','D','Eb','F','G','Ab','Bb'],
      kickPattern:   [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
      snarePattern:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihatPattern:  [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
      bassline:      [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],
      direction: "Dusty vinyl afternoon — sip slow, let the chords hang.",
    },
    cinematic: {
      mood: 'dreamy', genre: 'cinematic', bpm: 60, chords: ['Cm', 'Ab', 'Eb', 'Bb', 'Fm', 'Gm', 'Dm', 'Am'],
      scaleNotes: ['C','D','Eb','F','G','Ab','Bb'],
      kickPattern:   [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      snarePattern:  [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
      hihatPattern:  [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      bassline:      [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      direction: "Epic space — vast chords building toward an emotional peak.",
    },
    trap: {
      mood: 'aggressive', genre: 'hip-hop', bpm: 140, chords: ['Dm', 'Am', 'Em', 'Gm'],
      scaleNotes: ['D','E','F','G','A','Bb','C'],
      kickPattern:   [1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0],
      snarePattern:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihatPattern:  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      bassline:      [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      direction: "808s sliding through dark minor chords — relentless energy.",
    },
    jazz: {
      mood: 'happy', genre: 'jazz', bpm: 120, chords: ['Dm7', 'G7', 'Cmaj7', 'Am7', 'Fmaj7', 'Bm7b5', 'E7', 'Am'],
      scaleNotes: ['C','D','E','F','G','A','B'],
      kickPattern:   [1,0,0,1,0,0,1,0,1,0,0,0,1,0,0,0],
      snarePattern:  [0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      hihatPattern:  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      bassline:      [1,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0],
      direction: "Late-night jazz club — brushed snare, walking bass, warm chords.",
    },
    dreamy: {
      mood: 'dreamy', genre: 'electronic', bpm: 80, chords: ['Cmaj7', 'Am7', 'Fmaj7', 'Gmaj7', 'Em7', 'Dm7', 'Bm7', 'Am7'],
      scaleNotes: ['C','D','E','F','G','A','B'],
      kickPattern:   [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      snarePattern:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      hihatPattern:  [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      bassline:      [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],
      direction: "Floating between dreams — soft pads, reverb-soaked melody, no rush.",
    },
    edm: {
      mood: 'euphoric', genre: 'electronic', bpm: 128, chords: ['Am', 'F', 'C', 'G', 'Dm', 'Bb', 'Em', 'Am'],
      scaleNotes: ['A','B','C','D','E','F','G'],
      kickPattern:   [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snarePattern:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihatPattern:  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      bassline:      [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      direction: "Festival energy — massive drops, euphoric chords, unrelenting groove.",
    },
  };

  function load(name) {
    const preset = PRESETS[name];
    if (!preset) return;

    const result = {
      chords: preset.chords,
      scaleNotes: preset.scaleNotes,
      scale: `${preset.chords[0]} scale`,
      kickPattern: preset.kickPattern,
      snarePattern: preset.snarePattern,
      hihatPattern: preset.hihatPattern,
      basslinePattern: preset.bassline,
      creativeDirection: preset.direction,
      rootNote: preset.chords[0]?.replace(/m|maj|min|7|dim|aug|\d/g, '') || 'C',
      tempo: preset.bpm,
      mood: preset.mood
    };

    AIGenerator.applyTrackResult(result);

    const moodColor = AIGenerator.getMoodColor(preset.mood);
    Visualizer.setMoodColor(moodColor);

    // Update BPM display
    document.getElementById('bpm-value').textContent = preset.bpm;

    // Fill AI result display
    const bar = document.getElementById('direction-bar');
    const txt = document.getElementById('direction-text');
    if (bar && txt) { bar.classList.remove('hidden'); txt.textContent = preset.direction; }
  }

  return { load, PRESETS };
})();
