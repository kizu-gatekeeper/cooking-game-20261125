// Tiny synthesized sound effects: no audio files, everything is generated
// with the Web Audio API so the game stays fully offline.
let audioCtx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function blip(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const c = ctx();
  if (!c) return;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function sfxPickup() { blip(520, 0.09, 'sine', 0.12); }
export function sfxChop() { blip(180, 0.06, 'square', 0.10); blip(120, 0.05, 'square', 0.08, 0.05); }
export function sfxSizzle() { blip(1400, 0.12, 'sawtooth', 0.04); blip(1900, 0.10, 'sawtooth', 0.03, 0.06); }
export function sfxPlated() { blip(660, 0.08, 'sine', 0.12); blip(880, 0.12, 'sine', 0.12, 0.08); }
export function sfxServe() {
  blip(523, 0.10, 'sine', 0.14);
  blip(659, 0.10, 'sine', 0.14, 0.09);
  blip(784, 0.16, 'sine', 0.14, 0.18);
}
export function sfxWrong() { blip(220, 0.18, 'sawtooth', 0.10); blip(160, 0.22, 'sawtooth', 0.10, 0.10); }
export function sfxBell() { blip(1568, 0.25, 'sine', 0.10); blip(2093, 0.3, 'sine', 0.07, 0.05); }
export function sfxLost() { blip(330, 0.15, 'triangle', 0.10); blip(247, 0.25, 'triangle', 0.10, 0.14); }
