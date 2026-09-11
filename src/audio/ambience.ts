/* Tiny synthesized ambience — no audio files, no autoplay.
   Starts only after first user gesture. Respects mute + reduced motion. */

let ctx: AudioContext | null = null;
let windNodes: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setMuted(m: boolean) {
  muted = m;
  if (windNodes) windNodes.gain.gain.value = m ? 0 : 0.035;
}

/* finale: garden goes quiet when the firefly is home */
export function duckWind() {
  if (!windNodes) return;
  try {
    windNodes.gain.gain.linearRampToValueAtTime(0.008, (ctx?.currentTime ?? 0) + 2.5);
  } catch { /* silent */ }
}

export function restoreWind() {
  if (!windNodes || muted) return;
  try {
    windNodes.gain.gain.linearRampToValueAtTime(0.035, (ctx?.currentTime ?? 0) + 1.5);
  } catch { /* silent */ }
}

export function startWind() {
  const ac = ensureCtx();
  if (!ac || windNodes || muted) return;
  try {
    const len = ac.sampleRate * 3;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ac.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 0.4;
    const gain = ac.createGain();
    gain.gain.value = 0.0;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start();
    gain.gain.linearRampToValueAtTime(0.035, ac.currentTime + 4);
    // slow breathing of wind
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.frequency.value = 0.07; lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();
    windNodes = { src, filter, gain };
  } catch { /* silent */ }
}

function tone(freq: number, t0: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const ac = ensureCtx();
  if (!ac || muted) return;
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, ac.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol, ac.currentTime + t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(ac.currentTime + t0);
    o.stop(ac.currentTime + t0 + dur + 0.05);
  } catch { /* silent */ }
}

export const sfx = {
  unlock() { ensureCtx(); startWind(); },
  plant() {
    tone(196, 0, 0.35, 0.06, 'triangle');
    tone(294, 0.08, 0.4, 0.045, 'sine');
  },
  sprout() { tone(523, 0, 0.5, 0.04); tone(784, 0.12, 0.6, 0.03); },
  water() {
    for (let i = 0; i < 5; i++) tone(900 + Math.random() * 900, i * 0.09, 0.18, 0.018, 'sine');
  },
  touch() { tone(660, 0, 0.25, 0.03); },
  firefly() { tone(880, 0, 0.7, 0.035); tone(1174, 0.15, 0.8, 0.028); },
  bouquet() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.16, 0.9, 0.035));
  },
};
