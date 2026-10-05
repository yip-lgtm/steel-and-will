let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number) {
  const audio = ac();
  if (!audio) return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  hit() {
    tone(180, 0.08, "square", 0.04);
  },
  boom() {
    tone(70, 0.28, "sawtooth", 0.06);
    tone(140, 0.12, "triangle", 0.03);
  },
  ui() {
    tone(520, 0.04, "sine", 0.03);
  },
};
