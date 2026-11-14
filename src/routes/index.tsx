import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ocarina of Time — Song Player" },
      { name: "description", content: "Play the songs of Ocarina of Time on a blue ocarina, right from your phone." },
      { property: "og:title", content: "Ocarina of Time — Song Player" },
      { property: "og:description", content: "Play the songs of Hyrule on the blue ocarina." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Note = "A" | "D" | "R" | "L" | "U";
const FREQ: Record<Note, number> = { A: 587.33, D: 698.46, R: 880, L: 987.77, U: 1174.66 };
// Nintendo Switch mapping: X = C-up, Y = C-left, B = C-down, A = C-right, R = A button
const SYMBOL: Record<Note, string> = { A: "L", D: "R", R: "A", L: "Y", U: "X" };
const BTN_CLS: Record<Note, string> = { A: "seq-btn-r", D: "", R: "", L: "", U: "" };

const SONGS: { name: string; notes: string; tone: string }[] = [
  { name: "Zelda's Lullaby", notes: "LURLUR", tone: "royal" },
  { name: "Epona's Song", notes: "ULRULR", tone: "royal" },
  { name: "Saria's Song", notes: "DRLDRL", tone: "forest" },
  { name: "Sun's Song", notes: "RDURDU", tone: "royal" },
  { name: "Song of Time", notes: "RADRAD", tone: "royal" },
  { name: "Song of Storms", notes: "ADUADU", tone: "royal" },
  { name: "Minuet of Forest", notes: "AULRLR", tone: "forest" },
  { name: "Bolero of Fire", notes: "DADARDRD", tone: "fire" },
  { name: "Serenade of Water", notes: "ADRRL", tone: "water" },
  { name: "Requiem of Spirit", notes: "ADARDA", tone: "spirit" },
  { name: "Nocturne of Shadow", notes: "LRRALRD", tone: "shadow" },
  { name: "Prelude of Light", notes: "URURLU", tone: "light" },
];

// Each tone gives a song its own pace and echo: forest/fire are brisk and dry,
// water/spirit/shadow linger with a deeper temple reverb.
const TONE_STYLE: Record<string, { dur: number; gap: number; wet: number }> = {
  royal: { dur: 0.5, gap: 520, wet: 0.22 },
  forest: { dur: 0.42, gap: 450, wet: 0.16 },
  fire: { dur: 0.4, gap: 430, wet: 0.14 },
  water: { dur: 0.6, gap: 640, wet: 0.3 },
  spirit: { dur: 0.62, gap: 660, wet: 0.34 },
  shadow: { dur: 0.58, gap: 620, wet: 0.3 },
  light: { dur: 0.52, gap: 540, wet: 0.26 },
};

let ctx: AudioContext | null = null;
let breathBuffer: AudioBuffer | null = null;
let reverbIn: GainNode | null = null;
// A soft "stone temple" echo: shared convolver fed by every note.
function reverbSend(c: AudioContext) {
  if (reverbIn) return reverbIn;
  const seconds = 1.4;
  const impulse = c.createBuffer(2, c.sampleRate * seconds, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const samples = impulse.getChannelData(ch);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 2.6);
    }
  }
  const convolver = c.createConvolver(); convolver.buffer = impulse;
  const wet = c.createGain(); wet.gain.value = 0.22;
  reverbIn = c.createGain();
  reverbIn.connect(convolver).connect(wet).connect(c.destination);
  return reverbIn;
}
function play(n: Note, dur = 0.45, wet = 0.22) {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const t = ctx.currentTime;
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = "lowpass"; f.frequency.value = FREQ[n] * 3.5; f.Q.value = 0.5;
  const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = FREQ[n];
  const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = FREQ[n] * 2;
  const g2 = ctx.createGain(); g2.gain.value = 0.035;
  // Air pressure settles into pitch; gentle vibrato arrives after the attack.
  for (const oscillator of [o, o2]) {
    oscillator.detune.setValueAtTime(-9, t);
    oscillator.detune.linearRampToValueAtTime(0, t + 0.065);
  }
  const lfo = ctx.createOscillator(); lfo.frequency.value = 4.8;
  const lg = ctx.createGain();
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(0, t + 0.1);
  lg.gain.linearRampToValueAtTime(5, t + dur * 0.65);
  lfo.connect(lg);
  lg.connect(o.detune); lg.connect(o2.detune);

  // A quiet filtered air layer adds the breath missing from a pure sine tone.
  if (!breathBuffer) {
    breathBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const samples = breathBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  const breath = ctx.createBufferSource(); breath.buffer = breathBuffer; breath.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "bandpass"; airFilter.frequency.value = 1700; airFilter.Q.value = 0.8;
  const airGain = ctx.createGain();
  airGain.gain.setValueAtTime(0, t);
  airGain.gain.linearRampToValueAtTime(0.026, t + 0.025);
  airGain.gain.linearRampToValueAtTime(0.009, t + 0.1);
  breath.connect(airFilter).connect(airGain).connect(g);
  o.connect(g); o2.connect(g2).connect(g); g.connect(f).connect(ctx.destination);
  const send = ctx.createGain(); send.gain.value = wet;
  g.connect(send).connect(reverbSend(ctx));
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.32, t + 0.055);
  g.gain.linearRampToValueAtTime(0.29, t + 0.13);
  g.gain.linearRampToValueAtTime(0.27, t + dur - 0.09);
  g.gain.linearRampToValueAtTime(0, t + dur);
  [o, o2, lfo, breath].forEach((x) => { x.start(t); x.stop(t + dur + 0.05); });
}

function Index() {
  const [selected, setSelected] = useState(0);
  const [playingNote, setPlayingNote] = useState<number | null>(null);
  const [tappedNote, setTappedNote] = useState<number | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);

  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
  }, []);

  const playNote = (note: Note, index: number) => {
    play(note);
    setTappedNote(index);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTappedNote(null), 450);
  };

  const playSong = async (i: number) => {
    const nextSong = SONGS[i];
    if (busy.current || !nextSong) return;
    busy.current = true; setSelected(i);
    const style = TONE_STYLE[nextSong.tone] ?? TONE_STYLE["royal"]!;
    const notes = nextSong.notes.split("") as Note[];
    for (let j = 0; j < notes.length; j++) {
      const note = notes[j];
      if (!note) continue;
      play(note, style.dur, style.wet); setPlayingNote(j);
      await new Promise((r) => setTimeout(r, style.gap));
    }
    setPlayingNote(null);
    busy.current = false;
  };

  const song = SONGS[selected];
  if (!song) return null;

  return (
    <main className="relative mx-auto flex h-dvh max-w-md flex-col items-center gap-5 overflow-hidden px-4 pb-4 pt-6">
      <svg aria-hidden="true" viewBox="0 0 22 19" className="triforce-bg">
        <path d="M11 0 16.5 9.5H5.5Z M5.5 9.5 11 19H0Z M16.5 9.5 22 19H11Z" fill="currentColor" />
      </svg>
      <header className="text-center">
        <p className="font-serif text-xs tracking-[0.4em] text-muted-foreground">THE LEGEND OF ZELDA</p>
        <h1 className="gold-text font-display text-4xl font-bold leading-tight">Ocarina of Time</h1>
      </header>

      <section className="flex w-full min-h-0 flex-1 flex-col">
        <h2 className="gold-text mb-2 text-center font-serif text-lg font-bold tracking-widest">SONGS</h2>
        <div className="song-scroll min-h-0 flex-1 overflow-y-auto"
          onScroll={(e) => { e.currentTarget.setAttribute("data-scrolled", e.currentTarget.scrollTop > 8 ? "true" : "false"); }}>
        <ul className="grid grid-cols-1 gap-2.5 px-2 pb-16">
          {SONGS.map((s, i) => (
            <li key={s.name}>
              <button onClick={() => playSong(i)}
                className={`panel w-full rounded-lg px-4 py-3.5 text-left font-body text-lg transition-all ${i === selected ? "song-selected text-gold" : "text-foreground"}`}>
                ♪ {s.name}
              </button>
            </li>
          ))}
        </ul>
        </div>
      </section>

      <section className="ocarina-display" aria-label="Ocarina button sequence">
        <svg className="ocarina-shape" viewBox="0 0 420 300" role="img" aria-label="Blue Ocarina of Time">
          <defs>
            <linearGradient id="crest-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="crest-stop-light" />
              <stop offset=".5" className="crest-stop-mid" />
              <stop offset="1" className="crest-stop-dark" />
            </linearGradient>
            <radialGradient id="ocarina-body" cx="36%" cy="28%" r="78%" gradientTransform="translate(0 .03) scale(1 .94)">
              <stop offset="0" className="ocarina-stop-light" />
              <stop offset="0.35" className="ocarina-stop-blue" />
              <stop offset="0.78" className="ocarina-stop-dark" />
              <stop offset="1" className="ocarina-stop-deep" />
            </radialGradient>
            <radialGradient id="ocarina-glaze" cx="35%" cy="29%" r="55%" gradientTransform="translate(0 .18) scale(1 .42)">
              <stop offset="0" className="ocarina-stop-glaze" />
              <stop offset="0.35" className="ocarina-stop-glaze" stopOpacity=".25" />
              <stop offset="1" className="ocarina-stop-clear" />
            </radialGradient>
            <filter id="ocarina-soften"><feGaussianBlur stdDeviation="3" /></filter>
            <filter id="ceramic-mottle" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.014 0.022" numOctaves="4" seed="7" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.7  0 0 0 0 0.98  0 0 0 0.45 -0.08" />
            </filter>
            <filter id="ceramic-speckle" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="3" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.92  0 0 0 0 1  1.6 1.6 1.6 -2.95 0" />
            </filter>
            <clipPath id="ocarina-surface"><use href="#ocarina-outline" /></clipPath>
            <linearGradient id="ocarina-collar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="ocarina-stop-silver-dark" />
              <stop offset="0.25" className="ocarina-stop-silver" />
              <stop offset="0.38" className="ocarina-stop-glint" />
              <stop offset="0.52" className="ocarina-stop-silver-dark" />
              <stop offset="0.7" className="ocarina-stop-silver" />
              <stop offset="1" className="ocarina-stop-silver-dark" />
            </linearGradient>
          </defs>
          <path id="ocarina-outline" className="ocarina-body" d="M 99 129 C 105 119 108 107 110 96 L 112 69 Q 112 61 120 58 L 137 54 Q 143 53 146 60 L 161 100 Q 166 117 175 126 C 248 126 332 145 385 171 C 413 184 414 197 394 209 C 345 238 255 260 166 268 C 103 273 53 259 31 234 C 7 207 26 170 62 149 C 76 140 87 133 99 129 Z" />
          <g clipPath="url(#ocarina-surface)">
            <use href="#ocarina-outline" className="ocarina-glaze" />
            <rect className="ocarina-mottle" x="0" y="0" width="420" height="300" filter="url(#ceramic-mottle)" />
            <rect className="ocarina-speckle" x="0" y="0" width="420" height="300" filter="url(#ceramic-speckle)" />
            <path className="ocarina-contour" d="M 30 228 C 72 283 225 283 393 208" />
            <path className="ocarina-reflection" d="M 46 241 C 108 279 253 248 369 222" />
            <path className="ocarina-highlight" d="M 44 174 C 61 155 77 148 93 144 M 121 67 Q 118 78 118 94" />
            <path className="ocarina-reflection" d="M 229 137 Q 315 150 386 183" />
          </g>
          <g transform="translate(-45 0)">
          <path className="ocarina-collar" d="M 154 100 Q 180 104 206 100 C 209 113 212 122 222 128 Q 181 143 140 128 C 148 121 151 113 154 100 Z" />
          <path className="ocarina-metal-detail" d="M 154 104 Q 180 109 207 104 M 147 127 Q 181 139 214 127" />
          <svg className="ocarina-triforce" x="163.7" y="106.2" width="34.6" height="24.2" viewBox="0 0 22 19" aria-hidden="true">
            <path d="M11 0 16.5 9.5H5.5Z M5.5 9.5 11 19H0Z M16.5 9.5 22 19H11Z" />
          </svg>
          </g>
        </svg>
        <div className="ocarina-sequence">
          {(song.notes.split("") as Note[]).map((n, i) => (
            <Button key={i} type="button" variant="ghost" size="icon"
              aria-label={`Play ${SYMBOL[n]} note ${i + 1}`}
              onClick={() => playNote(n, i)}
              data-on={playingNote === i || tappedNote === i}
              className={`seq-btn ${BTN_CLS[n]}`}>
              {SYMBOL[n]}
            </Button>
          ))}
        </div>
      </section>
    </main>
  );
}
