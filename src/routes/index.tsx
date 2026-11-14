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
function play(n: Note, dur = 0.45) {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
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
            <linearGradient id="ocarina-collar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="ocarina-stop-silver-dark" />
              <stop offset="0.45" className="ocarina-stop-silver" />
              <stop offset="1" className="ocarina-stop-silver-dark" />
            </linearGradient>
          </defs>
          <path className="ocarina-body" d="M 146 127 C 151 116 154 106 155 96 L 159 76 C 161 58 166 53 180 53 C 194 53 199 59 201 76 L 205 101 Q 206 115 217 126 C 275 127 341 145 375 168 C 391 179 401 190 395 202 C 380 230 307 252 233 263 C 157 276 84 265 43 240 C 17 224 13 203 25 181 C 46 150 91 133 146 127 Z" />
          <path className="ocarina-collar" d="M 154 100 Q 180 104 206 100 C 208 113 210 122 219 128 Q 181 143 142 128 C 150 121 152 113 154 100 Z" />
          <path className="ocarina-highlight" d="M 48 174 C 78 146 113 143 139 140 M 173 69 Q 170 80 170 92" />
          <path className="ocarina-contour" d="M 53 235 C 127 267 267 255 349 224" />
          <g className="ocarina-triforce" transform="translate(181 117) scale(0.6)">
            <path d="M 0 -23 L -12 -2 L 12 -2 Z M -12 -2 L -24 19 L 0 19 Z M 12 -2 L 0 19 L 24 19 Z" />
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
