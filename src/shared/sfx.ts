// Synthesized sound effects, so no audio files are needed.
let ctx: AudioContext | null = null;

export function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  // iOS uses "interrupted" (after a call or app switch) as well as "suspended".
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * Make sound work on phones. Browsers only start audio inside a user gesture, and many
 * sounds here play after a clip loads or from a timer, so every tap (re)starts the
 * audio context and plays a silent sample. On iPhone, the "playback" audio session
 * keeps sounds audible when the ring/silent switch is on silent (Safari 16.4+).
 */
export function unlockAudio() {
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session) session.type = 'playback';
  const kick = () => {
    try {
      const c = audio();
      const src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start(0);
    } catch {
      // Audio unavailable.
    }
  };
  // Safari (desktop and iOS) only counts some of these as a gesture that may start audio; click and touchend always do.
  for (const ev of ['pointerdown', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend', 'keydown']) window.addEventListener(ev, kick, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
  });
}

/** Cartoon "boing" for a miss. */
export function boing() {
  try {
    const ctx = audio();
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(720, t + 0.18);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.9);
    lfo.frequency.value = 14; lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); lfo.start(t); o.stop(t + 1.05); lfo.stop(t + 1.05);
    const p = ctx.createOscillator(), pg = ctx.createGain();
    p.type = 'sine'; p.frequency.setValueAtTime(900, t + 1.0); p.frequency.exponentialRampToValueAtTime(300, t + 1.08);
    pg.gain.setValueAtTime(0.0001, t + 1.0); pg.gain.exponentialRampToValueAtTime(0.4, t + 1.01); pg.gain.exponentialRampToValueAtTime(0.0001, t + 1.12);
    p.connect(pg); pg.connect(ctx.destination); p.start(t + 1.0); p.stop(t + 1.15);
  } catch {
    // Audio unavailable.
  }
}

/** Applause and kids' "jee!" for a correct answer. */
export function cheer() {
  try {
    const ctx = audio();
    const t = ctx.currentTime + 0.02, sr = ctx.sampleRate;
    const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    // Applause: many short noise "claps" from ~12 kids, each at its own rhythm
    const DUR = 2.4, len = Math.floor(sr * DUR), buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let k = 0; k < 12; k++) {
        let tt = Math.random() * 0.15;
        const rate = 0.16 + Math.random() * 0.12, amp = 0.25 + Math.random() * 0.35;
        while (tt < DUR - 0.05) {
          const env = tt < 0.2 ? tt / 0.2 : Math.max(0, 1 - (tt - 1.2) / (DUR - 1.2));
          const start = Math.floor(tt * sr), clen = Math.floor(sr * (0.008 + Math.random() * 0.01));
          for (let i = 0; i < clen && start + i < len; i++) d[start + i] += (Math.random() * 2 - 1) * amp * env * Math.exp(-i / (clen * 0.25));
          tt += rate * (0.8 + Math.random() * 0.4);
        }
      }
    }
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), pk = ctx.createBiquadFilter(), ag = ctx.createGain();
    src.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 500;
    pk.type = 'peaking'; pk.frequency.value = 2200; pk.gain.value = 6; pk.Q.value = 1;
    ag.gain.value = 0.55;
    src.connect(hp); hp.connect(pk); pk.connect(ag); ag.connect(master); src.start(t);
    // Kids' "jee!" voices: rising pitch through vowel formants
    for (let v = 0; v < 6; v++) {
      const s = t + Math.random() * 0.35, f0 = 320 + Math.random() * 180, dur = 0.5 + Math.random() * 0.4;
      const o = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), g = ctx.createGain();
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 0.8, s);
      o.frequency.exponentialRampToValueAtTime(f0 * 1.35, s + dur * 0.35);
      o.frequency.exponentialRampToValueAtTime(f0 * 1.1, s + dur);
      vib.frequency.value = 6 + Math.random() * 2; vg.gain.value = f0 * 0.03; vib.connect(vg); vg.connect(o.frequency);
      const mix = ctx.createGain(); mix.gain.value = 1;
      ([[700, 0.9], [2300, 0.6], [3200, 0.3]] as const).forEach(([fq, gn]) => {
        const bp = ctx.createBiquadFilter(), fg = ctx.createGain();
        bp.type = 'bandpass'; bp.frequency.setValueAtTime(fq * 0.75, s); bp.frequency.linearRampToValueAtTime(fq, s + 0.12); bp.Q.value = 8;
        fg.gain.value = gn; o.connect(bp); bp.connect(fg); fg.connect(mix);
      });
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.22, s + 0.05);
      g.gain.setValueAtTime(0.22, s + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      mix.connect(g);
      if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan); pan.connect(master); } else g.connect(master);
      o.start(s); vib.start(s); o.stop(s + dur + 0.05); vib.stop(s + dur + 0.05);
    }
  } catch {
    // Audio unavailable.
  }
}

/** Bright rising bell arpeggio for something new appearing. */
export function chime() {
  try {
    const ctx = audio();
    const t = ctx.currentTime + 0.02;
    [1046.5, 1318.5, 1568, 2093].forEach((f, k) => {
      const s = t + k * 0.09, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      o2.type = 'sine'; o2.frequency.value = f * 2.01;
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.22, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.9);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(ctx.destination);
      o.start(s); o2.start(s); o.stop(s + 0.95); o2.stop(s + 0.95);
    });
  } catch {
    // Audio unavailable.
  }
}

/** Short brass-like fanfare for the end of the whole journey. */
export function fanfare() {
  try {
    const ctx = audio();
    const t = ctx.currentTime + 0.05;
    // [start (beats), length (beats), frequencies]; one beat = 0.16 s.
    const notes: [number, number, number[]][] = [
      [0, 1, [392]], [1, 1, [392]], [2, 1, [392]], [3, 3, [523.3]],
      [6, 1.5, [392]], [7.5, 1.5, [523.3]], [9, 7, [523.3, 659.3, 784]]
    ];
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    for (const [at, len, freqs] of notes) {
      const s = t + at * 0.16, d = len * 0.16;
      for (const f of freqs) {
        const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = f;
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(800, s); lp.frequency.linearRampToValueAtTime(2600, s + 0.06); lp.Q.value = 2;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(0.28 / freqs.length + 0.08, s + 0.03);
        g.gain.setValueAtTime(0.28 / freqs.length + 0.08, s + d * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, s + d + 0.12);
        o.connect(lp); lp.connect(g); g.connect(master);
        o.start(s); o.stop(s + d + 0.15);
      }
    }
  } catch {
    // Audio unavailable.
  }
}
