import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import ocarina from "@/assets/ocarina.png";

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
    if (busy.current) return;
    busy.current = true; setSelected(i);
    const notes = SONGS[i]!.notes.split("") as Note[];
    for (let j = 0; j < notes.length; j++) {
      play(notes[j]!, 0.5); setPlayingNote(j);
      await new Promise((r) => setTimeout(r, 520));
    }
    setPlayingNote(null);
    busy.current = false;
  };

  const song = SONGS[selected]!;

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 pb-10 pt-6">
      <header className="text-center">
        <p className="font-serif text-xs tracking-[0.4em] text-muted-foreground">THE LEGEND OF ZELDA</p>
        <h1 className="gold-text font-display text-4xl font-bold leading-tight">Ocarina of Time</h1>
      </header>

      <img src={ocarina} alt="The blue Ocarina of Time" width={1024} height={768} className="floaty w-60 drop-shadow-2xl" />

      <section className="panel w-full rounded-lg p-4 text-center">
        <div className="font-serif text-sm text-gold">{song.name}</div>
        <div className="mt-2 flex min-h-10 flex-wrap items-center justify-center gap-2">
          {(song.notes.split("") as Note[]).map((n, i) => (
            <span key={i} data-on={playingNote === i} className={`seq-btn ${BTN_CLS[n]}`}>
              {SYMBOL[n]}
            </span>
          ))}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">Pick a song below to hear it</div>
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
