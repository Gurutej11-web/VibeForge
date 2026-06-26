window.Presets = (() => {
  const PRESETS = {
    lofi: {
      mood:'melancholic', genre:'lo-fi', bpm:75,
      chords:['Cm','Fm','Gm','Bb'], scaleNotes:['C','D','Eb','F','G','Ab','Bb'],
      kickPattern:   [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
      snarePattern:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihatPattern:  [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
      basslinePattern:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],
      creativeDirection:'Dusty vinyl afternoon — sip slow, let the chords hang in the air.',
      rootNote:'C'
    },
    cinematic: {
      mood:'dreamy', genre:'cinematic', bpm:60,
      chords:['Cm','Ab','Eb','Bb','Fm','Gm','Dm','Am'],
      scaleNotes:['C','D','Eb','F','G','Ab','Bb'],
      kickPattern:   [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      snarePattern:  [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
      hihatPattern:  [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      basslinePattern:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      creativeDirection:'Epic space — vast chords building toward an emotional, cinematic peak.',
      rootNote:'C'
    },
    trap: {
      mood:'aggressive', genre:'hip-hop', bpm:140,
      chords:['Dm','Am','Em','Gm'], scaleNotes:['D','E','F','G','A','Bb','C'],
      kickPattern:   [1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0],
      snarePattern:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihatPattern:  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      basslinePattern:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      creativeDirection:'808s sliding through dark minor chords — relentless, claustrophobic energy.',
      rootNote:'D'
    },
    jazz: {
      mood:'happy', genre:'jazz', bpm:120,
      chords:['Dm7','G7','Cmaj7','Am7','Fmaj7','Bm7','E7','Am'],
      scaleNotes:['C','D','E','F','G','A','B'],
      kickPattern:   [1,0,0,1,0,0,1,0,1,0,0,0,1,0,0,0],
      snarePattern:  [0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      hihatPattern:  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      basslinePattern:[1,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0],
      creativeDirection:'Late-night jazz club — brushed snare, walking bass, and warm extended chords.',
      rootNote:'C'
    },
    dreamy: {
      mood:'dreamy', genre:'electronic', bpm:80,
      chords:['Cmaj7','Am7','Fmaj7','Gmaj7','Em7','Dm7','Bm7','Am7'],
      scaleNotes:['C','D','E','F','G','A','B'],
      kickPattern:   [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      snarePattern:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      hihatPattern:  [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      basslinePattern:[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],
      creativeDirection:'Floating between dreams — reverb-soaked pads, no rush, infinite space.',
      rootNote:'C'
    },
    edm: {
      mood:'euphoric', genre:'electronic', bpm:128,
      chords:['Am','F','C','G','Dm','Bb','Em','Am'],
      scaleNotes:['A','B','C','D','E','F','G'],
      kickPattern:   [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snarePattern:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihatPattern:  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      basslinePattern:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      creativeDirection:'Festival energy — massive drops, euphoric chords, an unrelenting groove.',
      rootNote:'A'
    },
  };

  function load(name) {
    const p = PRESETS[name];
    if (!p) return;
    AIGenerator.applyTrackResult({ ...p, tempo: p.bpm });
    const moodColors = Visualizer.MOOD_COLORS || {};
    const color = moodColors[p.mood] || '#A855F7';
    Visualizer.setMoodColor(color);
    document.getElementById('bpm-value').textContent = p.bpm;
    toast(`Loaded: ${name} preset ✦`, 'success');
  }

  return { load, PRESETS };
})();
