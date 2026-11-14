import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

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
const BTN_CLS: Record<Note, string> = { A: "seq-r seq-btn-r", D: "seq-b", R: "seq-a", L: "seq-y", U: "seq-x" };

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
function play(n: Note, dur = 0.45) {
  ctx ??= new AudioContext();
  const t = ctx.currentTime;
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = "lowpass"; f.frequency.value = 2200;
  const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = FREQ[n];
  const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = FREQ[n] * 2;
  const g2 = ctx.createGain(); g2.gain.value = 0.08;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5;
  const lg = ctx.createGain(); lg.gain.value = 3;
  lfo.connect(lg).connect(o.frequency);
  o.connect(g); o2.connect(g2).connect(g); g.connect(f).connect(ctx.destination);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.04);
  g.gain.setValueAtTime(0.3, t + dur - 0.08);
  g.gain.linearRampToValueAtTime(0, t + dur);
  [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + dur + 0.05); });
}

function Index() {
  const [selected, setSelected] = useState(0);
  const [playingNote, setPlayingNote] = useState<number | null>(null);
  const busy = useRef(false);

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
    <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 pb-10 pt-6">
      <header className="text-center">
        <p className="font-serif text-xs tracking-[0.4em] text-muted-foreground">THE LEGEND OF ZELDA</p>
        <h1 className="gold-text font-display text-4xl font-bold leading-tight">Ocarina of Time</h1>
      </header>

      <section className="ocarina-display" aria-label="Ocarina button sequence">
        <svg className="ocarina-shape" viewBox="0 0 420 300" role="img" aria-label="Blue Ocarina of Time">
          <defs>
            <linearGradient id="ocarina-body" x1="0" y1="0" x2="0.65" y2="1">
              <stop offset="0" className="ocarina-stop-light" />
              <stop offset="0.5" className="ocarina-stop-blue" />
              <stop offset="1" className="ocarina-stop-dark" />
            </linearGradient>
          </defs>
          <path className="ocarina-body" d="M 24 183 C 51 170 73 143 110 122 C 156 96 216 88 262 105 C 272 108 278 106 282 96 L 304 39 Q 307 29 316 31 L 345 42 Q 354 45 350 56 L 332 117 C 330 125 335 130 345 136 C 382 157 397 192 382 223 C 365 261 308 279 250 276 C 171 273 114 248 67 218 C 49 207 32 200 24 194 Q 16 189 24 183 Z" />
          <path className="ocarina-rim" d="M 305 39 L 349 55 M 302 48 L 346 64" />
          <path className="ocarina-highlight" d="M 64 173 C 107 130 172 104 228 115 M 291 98 L 313 47" />
          <path className="ocarina-contour" d="M 85 223 C 169 268 282 288 351 245" />
          <g className="ocarina-triforce" transform="translate(307 134) rotate(18)">
            <path d="M 0 -23 L -12 -2 L 12 -2 Z M -12 -2 L -24 19 L 0 19 Z M 12 -2 L 0 19 L 24 19 Z" />
          </g>
          <ellipse className="ocarina-hole" cx="124" cy="141" rx="10" ry="7" transform="rotate(-24 124 141)" />
          <ellipse className="ocarina-hole" cx="164" cy="126" rx="10" ry="7" transform="rotate(-12 164 126)" />
          <ellipse className="ocarina-hole" cx="207" cy="126" rx="10" ry="7" />
          <ellipse className="ocarina-hole" cx="248" cy="140" rx="10" ry="7" transform="rotate(18 248 140)" />
        </svg>
        <div className="ocarina-sequence">
          {(song.notes.split("") as Note[]).map((n, i) => (
            <span key={i} data-on={playingNote === i} className={`seq-btn ${BTN_CLS[n]}`}>
              {SYMBOL[n]}
            </span>
          ))}
        </div>
      </section>

      <section className="w-full">
        <h2 className="gold-text mb-2 text-center font-serif text-lg font-bold tracking-widest">SONGS</h2>
        <ul className="grid grid-cols-2 gap-2">
          {SONGS.map((s, i) => (
            <li key={s.name}>
              <button onClick={() => playSong(i)}
                className={`panel w-full rounded-lg px-3 py-2 text-left font-serif text-sm transition-colors ${i === selected ? "text-gold" : "text-foreground"}`}>
                ♪ {s.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
