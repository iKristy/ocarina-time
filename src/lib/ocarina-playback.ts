export type Note = "A" | "D" | "R" | "L" | "U";
const FREQ: Record<Note, number> = { A: 587.33, D: 698.46, R: 880, L: 987.77, U: 1174.66 };
export const SONGS = [
  { name: "Zelda's Lullaby", notes: "LURLUR", beats: [2, 1, 3, 2, 1, 3], bpm: 160 },
  { name: "Epona's Song", notes: "ULRULR", beats: [1, 1, 4, 1, 1, 4], bpm: 190 },
  { name: "Saria's Song", notes: "DRLDRL", beats: [1, 1, 2, 1, 1, 2], bpm: 250 },
  { name: "Sun's Song", notes: "RDURDU", beats: [1, 1, 3, 1, 1, 3], bpm: 240 },
  { name: "Song of Time", notes: "RADRAD", beats: [2, 3, 1, 2, 3, 1], bpm: 180 },
  { name: "Song of Storms", notes: "ADUADU", beats: [1, 1, 4, 1, 1, 4], bpm: 260 },
  { name: "Minuet of Forest", notes: "AULRLR", beats: [1, 3, 1, 1, 1, 3], bpm: 170 },
  { name: "Bolero of Fire", notes: "DADARDRD", beats: [1, 1, 1, 1, 1, 1, 1, 3], bpm: 220 },
  { name: "Serenade of Water", notes: "ADRRL", beats: [1, 1, 2, 1, 4], bpm: 170 },
  { name: "Requiem of Spirit", notes: "ADARDA", beats: [2, 1, 3, 2, 1, 3], bpm: 170 },
  { name: "Nocturne of Shadow", notes: "LRRALRD", beats: [1, 1, 2, 2, 1, 1, 4], bpm: 170 },
  { name: "Prelude of Light", notes: "URURLU", beats: [1, 1, 2, 1, 1, 3], bpm: 170 },
];

export function songTiming(song: typeof SONGS[number]) {
  let offset = 0.1;
  return (song.notes.split("") as Note[]).map((note, i) => {
    const beat = (song.beats[i] ?? 1) * 60 / song.bpm;
    const event = { note, offset, duration: Math.max(0.14, beat - 0.04), beat };
    offset += beat;
    return event;
  });
}

// Browser-only resources are created lazily, after a user gesture.
export function createOcarinaPlayer() {
  let ctx: AudioContext | null = null;
  let bus: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  function ensureAudio() {
    if (!ctx) {
      ctx = new AudioContext({ latencyHint: "interactive" });
      bus = ctx.createGain(); bus.gain.value = 0.5;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3;
      comp.attack.value = 0.005; comp.release.value = 0.2;
      const verb = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 2.6);
      const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = Math.floor(ctx.sampleRate * 0.018); i < len; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
        }
      }
      verb.buffer = impulse;
      const wet = ctx.createGain(); wet.gain.value = 0.3;
      bus.connect(comp); bus.connect(verb); verb.connect(wet); wet.connect(comp);
      comp.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state !== "running") void ctx.resume().catch(() => {});
    return ctx;
  }
  function play(note: Note, duration = 0.45, when?: number) {
    const ac = ensureAudio();
    const t = Math.max(when ?? ac.currentTime, ac.currentTime);
    const f = FREQ[note];
    const out = ac.createGain();
    if (bus) out.connect(bus);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(1, t + 0.03);
    out.gain.setTargetAtTime(0.78, t + 0.03, 0.12);
    const tone = ac.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 4200;
    tone.connect(out);
    const lfo = ac.createOscillator(); lfo.frequency.value = 5.3;
    const depth = ac.createGain();
    depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(f * 0.0055, t + 0.45);
    lfo.connect(depth);
    const partial = (type: OscillatorType, mult: number, amp: number) => {
      const osc = ac.createOscillator(); osc.type = type;
      osc.frequency.setValueAtTime(f * mult * 0.982, t);
      osc.frequency.exponentialRampToValueAtTime(f * mult, t + 0.07);
      depth.connect(osc.frequency);
      const gain = ac.createGain(); gain.gain.value = amp;
      osc.connect(gain); gain.connect(tone);
      return osc;
    };
    const oscs = [partial("sine", 1, 0.5), partial("triangle", 1, 0.14), partial("sine", 2, 0.05), partial("sine", 3, 0.015)];
    const air = ac.createBufferSource(); air.buffer = noise; air.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 0.9;
    const ag = ac.createGain();
    ag.gain.setValueAtTime(0.0001, t); ag.gain.linearRampToValueAtTime(0.2, t + 0.012);
    ag.gain.exponentialRampToValueAtTime(0.025, t + 0.14);
    air.connect(bp); bp.connect(ag); ag.connect(out);
    const sources = [...oscs, lfo, air];
    sources.forEach(source => { source.start(t); source.stop(t + duration + 0.5); });
    out.gain.setTargetAtTime(0, t + duration, 0.06);
    let stopped = false;
    return { stop() {
      if (stopped) return;
      stopped = true;
      out.gain.cancelScheduledValues(ac.currentTime);
      out.gain.setValueAtTime(0, ac.currentTime);
      sources.forEach(source => { try { source.stop(ac.currentTime); } catch { /* Already ended. */ } });
      out.disconnect();
    } };
  }
  return { play, now: () => ensureAudio().currentTime, close: () => { if (ctx) void ctx.close(); } };
}