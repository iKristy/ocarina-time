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
const FREQ: Record<Note, number> = { A: 293.66, D: 349.23, R: 440, L: 493.88, U: 587.33 };
// Nintendo Switch mapping: X = C-up, Y = C-left, B = C-down, A = C-right, R = A button
const SYMBOL: Record<Note, string> = { A: "R", D: "B", R: "A", L: "Y", U: "X" };
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

let ctx: AudioContext | null = null;
let breathBuffer: AudioBuffer | null = null;
function play(n: Note, dur = 0.45) {
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
    const notes = nextSong.notes.split("") as Note[];
    for (let j = 0; j < notes.length; j++) {
      const note = notes[j];
      if (!note) continue;
      play(note, 0.5); setPlayingNote(j);
      await new Promise((r) => setTimeout(r, 520));
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
                className={`panel w-full rounded-lg px-4 py-3.5 text-left font-serif text-base transition-all ${i === selected ? "song-selected text-gold" : "text-foreground"}`}>
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
          <path id="ocarina-outline" className="ocarina-body" d="M 121 127 C 126 116 129 106 130 96 L 132 69 Q 132 61 140 58 L 157 54 Q 163 53 166 60 L 181 100 Q 185 116 192 126 C 252 138 328 159 387 183 C 413 193 415 204 393 213 C 325 237 234 258 151 265 C 89 270 43 255 28 228 C 10 194 29 161 66 143 C 82 135 101 130 121 127 Z" />
          <g clipPath="url(#ocarina-surface)">
            <use href="#ocarina-outline" className="ocarina-glaze" />
            <path className="ocarina-contour" d="M 28 220 C 53 276 179 283 393 211" />
            <path className="ocarina-reflection" d="M 44 236 C 101 274 239 247 367 220" />
            <path className="ocarina-highlight" d="M 43 169 C 65 147 92 140 114 139 M 141 67 Q 138 78 138 94" />
            <path className="ocarina-glint" d="M 48 164 Q 75 143 107 141 M 140 66 L 138 85" />
            <path className="ocarina-reflection" d="M 215 144 Q 302 164 383 195" />
          </g>
          <g transform="translate(-25 0)">
          <path className="ocarina-collar" d="M 154 100 Q 180 104 206 100 C 208 113 210 122 219 128 Q 181 143 142 128 C 150 121 152 113 154 100 Z" />
          <path className="ocarina-metal-detail" d="M 154 104 Q 180 109 207 104 M 147 127 Q 181 139 214 127 M 149 120 Q 153 122 153 117 C 151 110 159 109 162 114 Q 165 119 170 115 M 152 108 Q 156 113 160 110 Q 164 107 167 109 M 157 121 Q 162 117 167 120 M 211 117 Q 206 120 207 114 C 209 108 202 108 198 113 Q 194 119 190 116 M 208 106 Q 204 112 201 109 M 203 120 Q 199 123 194 121" />
          <svg className="ocarina-triforce" x="166.6" y="103.2" width="28.8" height="25.2" viewBox="0 0 22 19" aria-hidden="true">
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
