import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw } from "lucide-react";
import { AVAILABLE_NOTES, SCARECROW_LENGTH, readScarecrow, saveScarecrow, resetScarecrow } from "@/lib/scarecrow-song";
import { createOcarinaPlayer, SONGS, songTiming, type Note } from "@/lib/ocarina-playback";

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

// Nintendo Switch button labels for the original five ocarina notes.
const SYMBOL: Record<Note, string> = { A: "L", D: "R", R: "A", L: "Y", U: "X" };
const BTN_CLS: Record<Note, string> = { A: "seq-btn-r", D: "seq-btn-r", R: "", L: "", U: "" };

function Index() {
  const [selected, setSelected] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingNote, setPlayingNote] = useState<number | null>(null);
  const [tappedNote, setTappedNote] = useState<number | null>(null);
  const [scarecrow, setScarecrow] = useState<Note[] | null>(null);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<Note[]>([]);
  useEffect(() => { setScarecrow(readScarecrow()); }, []);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const player = useRef<ReturnType<typeof createOcarinaPlayer> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const voices = useRef<{ stop(): void }[]>([]);
  const getPlayer = () => {
    player.current ??= createOcarinaPlayer();
    return player.current;
  };
  const stopPlayback = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    voices.current.forEach(voice => voice.stop());
    voices.current = [];
    setPlayingNote(null);
    setIsPlaying(false);
  };

  useEffect(() => () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    timers.current.forEach(clearTimeout);
    voices.current.forEach(voice => voice.stop());
    player.current?.close();
  }, []);

  const playNote = (note: Note, index: number) => {
    stopPlayback();
    getPlayer().play(note);
    setTappedNote(index);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTappedNote(null), 450);
    if (recording) {
      const next = [...draft, note];
      setDraft(next);
      if (next.length === SCARECROW_LENGTH && saveScarecrow(next)) {
        setScarecrow(next);
        setRecording(false);
        setTappedNote(null);
      }
    }
  };

  const playSong = (i: number) => {
    const nextSong = i === SONGS.length && scarecrow
      ? { name: "Scarecrow's Song", notes: scarecrow.join(""), beats: scarecrow.map(() => 1), bpm: 120 }
      : SONGS[i];
    if (!nextSong) return;
    stopPlayback();
    if (tapTimer.current) clearTimeout(tapTimer.current);
    setTappedNote(null);
    setRecording(false);
    setDraft([]);
    setSelected(i);
    const audio = getPlayer();
    const start = audio.now();
    const timing = songTiming(nextSong);
    setIsPlaying(true);
    timing.forEach(({ note, offset, duration }, index) => {
      voices.current.push(audio.play(note, duration, start + offset));
      timers.current.push(setTimeout(() => setPlayingNote(index), offset * 1000));
      timers.current.push(setTimeout(() => setPlayingNote(null), (offset + duration) * 1000));
    });
    const last = timing.at(-1);
    if (last) timers.current.push(setTimeout(() => {
      setPlayingNote(null);
      setIsPlaying(false);
      voices.current = [];
    }, (last.offset + last.beat) * 1000 + 120));
  };

  const beginRecording = () => {
    stopPlayback();
    if (tapTimer.current) clearTimeout(tapTimer.current);
    setTappedNote(null);
    setSelected(SONGS.length);
    setDraft([]);
    setRecording(true);
  };
  const song = selected === SONGS.length
    ? { notes: scarecrow?.join("") ?? "" }
    : SONGS[selected];
  if (!song) return null;

  return (
    <main className="relative mx-auto flex h-dvh max-w-md flex-col items-center gap-5 overflow-hidden px-4 pb-4 pt-6">
      <svg aria-hidden="true" viewBox="0 0 22 19" className="triforce-bg">
        <path d="M11 0 16.5 9.5H5.5Z M5.5 9.5 11 19H0Z M16.5 9.5 22 19H11Z" fill="currentColor" />
      </svg>
      <header className="text-center">
        <p className="font-serif text-xs tracking-[0.4em] text-muted-foreground">THE LEGEND OF ZELDA</p>
        <h1 className="gold-text font-serif text-4xl font-bold leading-tight"><span className="font-display">O</span>carina <span className="title-of">of</span> <span className="font-display">T</span>ime</h1>
      </header>

      <section className="flex w-full min-h-0 flex-1 flex-col">
        <h2 className="songbook-heading mb-2 text-center font-serif text-lg font-bold"><span className="gold-text">SONGBOOK</span></h2>
        <div className="song-scroll min-h-0 flex-1 overflow-y-auto"
          onScroll={(e) => { e.currentTarget.setAttribute("data-scrolled", e.currentTarget.scrollTop > 8 ? "true" : "false"); }}>
        <ul className="grid grid-cols-1 gap-2.5 px-2 pb-16">
          {SONGS.map((s, i) => (
            <li key={s.name}>
              <Button variant="ghost" onClick={() => playSong(i)}
                data-playing={i === selected && isPlaying}
                className={`panel song-item flex h-auto w-full items-center justify-start gap-3 whitespace-normal rounded-lg px-4 py-3.5 text-left font-body text-lg font-normal ${i === selected ? "song-selected text-gold" : "text-foreground"}`}>
                <span aria-hidden="true" className="song-selected-frame" />
                <span aria-hidden="true" className="song-sheen-layer" />
                <span aria-hidden="true" data-playing={i === selected && isPlaying} className="song-note-icon inline-flex w-5 shrink-0 justify-center text-2xl leading-none">♪</span>
                <span>{s.name}</span>
              </Button>
            </li>
          ))}
          <li className="scarecrow-row">
            <Button variant="ghost" onClick={() => scarecrow ? playSong(SONGS.length) : beginRecording()}
              data-playing={selected === SONGS.length && isPlaying}
              className={`panel song-item flex h-auto w-full items-center justify-start gap-3 whitespace-normal rounded-lg px-4 py-3.5 text-left font-body text-lg font-normal ${selected === SONGS.length ? "song-selected text-gold" : "text-foreground"} ${scarecrow ? "scarecrow-saved" : ""}`}>
              <span aria-hidden="true" className="song-selected-frame" />
              <span aria-hidden="true" className="song-sheen-layer" />
              <span aria-hidden="true" data-playing={selected === SONGS.length && isPlaying} className="song-note-icon inline-flex w-5 shrink-0 justify-center text-2xl leading-none">♪</span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block">Scarecrow’s Song</span>
                <span className="scarecrow-status" data-state={recording ? "recording" : scarecrow ? "saved" : "empty"} role="status" aria-live="polite" aria-atomic="true">
                  {recording ? <><span className="scarecrow-recording-dot" aria-hidden="true" />Recording <span className="scarecrow-count">{draft.length}/{SCARECROW_LENGTH}</span></>
                    : scarecrow ? <><Check aria-hidden="true" />Saved</> : "Empty"}
                </span>
              </span>
            </Button>
            {scarecrow && <Button variant="ghost" size="icon" className="scarecrow-reset" title="Reset Scarecrow’s Song" aria-label="Reset Scarecrow’s Song"
              onClick={() => { resetScarecrow(); setScarecrow(null); beginRecording(); }}><RotateCcw /></Button>}
          </li>
        </ul>
        </div>
      </section>

      <section className="ocarina-display" data-recording={recording} aria-label="Ocarina button sequence">
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
            <filter id="ocarina-soften" filterUnits="userSpaceOnUse" x="-20" y="-20" width="460" height="340"><feGaussianBlur stdDeviation="3" /></filter>
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
          <path className="ocarina-collar" d="M 154 100 Q 180 104 206 100 C 211 117 215 122 220 126 Q 220 127 218 128 Q 181 142 146 130 Q 144 130 144 129 C 150 119 153 107 154 100 Z" />
          <path className="ocarina-metal-detail" d="M 154 104 Q 180 109 207 104 M 147 127 Q 181 139 214 127" />
          <svg className="ocarina-triforce" x="163.7" y="106.2" width="34.6" height="24.2" viewBox="0 0 22 19" aria-hidden="true">
            <path d="M11 0 16.5 9.5H5.5Z M5.5 9.5 11 19H0Z M16.5 9.5 22 19H11Z" />
          </svg>
          </g>
        </svg>
        <div className="ocarina-sequence">
          {(recording ? AVAILABLE_NOTES : song.notes.split("") as Note[]).map((n, i) => (
            <Button key={i} type="button" variant="ghost" size="icon"
              aria-label={`Play ${SYMBOL[n]} note ${i + 1}`}
              onClick={() => playNote(n, i)}
              data-on={playingNote === i || tappedNote === i}
              className={`seq-btn ${BTN_CLS[n]}`}>
              {SYMBOL[n]}
            </Button>
          ))}
        </div>
        {recording && <div className="scarecrow-progress" role="status" aria-label={`${draft.length} of 8 notes recorded`}>
          {Array.from({ length: SCARECROW_LENGTH }, (_, i) => <span key={i} data-filled={i < draft.length} aria-hidden="true" />)}
        </div>}
      </section>
    </main>
  );
}
