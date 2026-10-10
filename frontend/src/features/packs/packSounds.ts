import type { RarityKey } from "../../design/rarity";

// Sons synthétisés avec Web Audio : aucun fichier à héberger, aucune licence.

const STORAGE_KEY = "reelverse:sound-muted";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    // stockage indisponible : le choix vaut pour la session seulement
  }
}

const MASTER = 0.18;

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  duration: number,
  opts: { type?: OscillatorType; gain?: number; slideTo?: number } = {},
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, start);
  if (opts.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(opts.slideTo, start + duration);
  }
  const peak = (opts.gain ?? 1) * MASTER;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function whoosh(c: AudioContext, start: number) {
  const len = Math.floor(c.sampleRate * 0.18);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(600, start);
  filter.frequency.exponentialRampToValueAtTime(2400, start + 0.16);
  const gain = c.createGain();
  gain.gain.value = MASTER * 0.5;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(start);
}

// Notes en Hz (gamme de do majeur)
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.5;

/** Son joué quand une carte est révélée, de plus en plus riche avec la rareté. */
export function playReveal(rarity: RarityKey) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.01;

  whoosh(c, t);

  switch (rarity) {
    case "common":
      tone(c, 330, t + 0.05, 0.14, { type: "triangle" });
      break;
    case "uncommon":
      tone(c, 392, t + 0.05, 0.14, { type: "triangle" });
      tone(c, 494, t + 0.13, 0.16, { type: "triangle" });
      break;
    case "rare":
      tone(c, C5, t + 0.05, 0.14, { type: "triangle" });
      tone(c, E5, t + 0.13, 0.14, { type: "triangle" });
      tone(c, G5, t + 0.21, 0.22, { type: "triangle" });
      break;
    case "epic":
      [C5, E5, G5, C6].forEach((f, i) =>
        tone(c, f, t + 0.05 + i * 0.09, 0.24, { type: "triangle", gain: 1.1 }),
      );
      tone(c, 130.8, t + 0.05, 0.5, { type: "sine", gain: 0.9 });
      break;
    case "legendary":
      playLegendary();
      break;
  }
}

/** Fanfare réservée aux cartes légendaires. */
export function playLegendary() {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.01;

  // Impact grave
  tone(c, 110, t, 0.9, { type: "sine", gain: 1.6, slideTo: 55 });
  // Arpège ascendant
  [C5, E5, G5, C6, E6].forEach((f, i) =>
    tone(c, f, t + 0.1 + i * 0.1, 0.5, { type: "triangle", gain: 1.1 }),
  );
  // Accord final + scintillement
  [C5, E5, G5, C6].forEach((f) =>
    tone(c, f, t + 0.65, 1.1, { type: "sine", gain: 0.9 }),
  );
  [C6 * 2, E6 * 2, G5 * 4].forEach((f, i) =>
    tone(c, f, t + 0.7 + i * 0.12, 0.45, { type: "sine", gain: 0.35 }),
  );
}
