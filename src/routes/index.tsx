import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { OcarinaShape } from "@/components/ocarina-shape";
import { GlowSettings } from "@/components/glow-settings";
import { readGlowPreset, readCustomGlow, DEFAULT_CUSTOM_GLOW, customGlowTokens, type CustomGlow, type GlowPreset } from "@/lib/glow-presets";
import { RotateCcw } from "lucide-react";
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
  const [glowPreset, setGlowPreset] = useState<GlowPreset>("mist");
  const [customGlow, setCustomGlow] = useState<CustomGlow>(DEFAULT_CUSTOM_GLOW);
  useEffect(() => { setGlowPreset(readGlowPreset()); setCustomGlow(readCustomGlow()); }, []);
  const [draft, setDraft] = useState<Note[]>([]);
  useEffect(() => { setScarecrow(readScarecrow()); }, []);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSelectedBeforeRecording = useRef(0);
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
    setSelectedBeforeRecording.current = selected;
    setSelected(SONGS.length);
    setDraft([]);
    setRecording(true);
  };
  const cancelRecording = () => {
    setRecording(false);
    setDraft([]);
    setSelected(setSelectedBeforeRecording.current);
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
      <GlowSettings saved={glowPreset} custom={customGlow} onSave={(preset, custom) => { setGlowPreset(preset); setCustomGlow(custom); }} />
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
            <Button variant="ghost" onClick={() => recording ? cancelRecording() : scarecrow ? playSong(SONGS.length) : beginRecording()}
              aria-pressed={recording}
              data-playing={selected === SONGS.length && isPlaying}
              className={`panel song-item flex h-auto w-full items-center justify-start gap-3 whitespace-normal rounded-lg px-4 py-3.5 text-left font-body text-lg font-normal ${selected === SONGS.length ? "song-selected text-gold" : "text-foreground"} ${scarecrow ? "scarecrow-saved" : ""}`}>
              <span aria-hidden="true" className="song-selected-frame" />
              <span aria-hidden="true" className="song-sheen-layer" />
              <span aria-hidden="true" data-playing={selected === SONGS.length && isPlaying} className="song-note-icon inline-flex w-5 shrink-0 justify-center text-2xl leading-none">♪</span>
              <span className="scarecrow-title">Scarecrow’s Song{recording && <span className="scarecrow-recording-dot" role="status" aria-label="Recording notes" />}</span>
              {!scarecrow && <span className="ml-auto text-sm text-muted-foreground">{recording ? `${draft.length}/8` : "Empty"}</span>}
            </Button>
            {scarecrow && <Button variant="ghost" size="icon" className="scarecrow-reset" title="Reset Scarecrow’s Song" aria-label="Reset Scarecrow’s Song"
              onClick={() => { resetScarecrow(); setScarecrow(null); beginRecording(); }}><RotateCcw /></Button>}
          </li>
        </ul>
        </div>
      </section>

      <section className="ocarina-display" data-recording={recording} data-glow={glowPreset} style={glowPreset === "custom" ? customGlowTokens(customGlow) as CSSProperties : undefined} aria-label="Ocarina button sequence">
        <OcarinaShape />
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
          {recording && <Button variant="ghost" size="icon" className="seq-btn seq-btn-reset" title="Reset Scarecrow’s Song" aria-label="Reset Scarecrow’s Song" onClick={beginRecording}><RotateCcw /></Button>}
        </div>
        {recording && <div className="scarecrow-progress" role="status" aria-label={`${draft.length} of 8 notes recorded`}>
          {Array.from({ length: SCARECROW_LENGTH }, (_, i) => <span key={i} data-filled={i < draft.length} aria-hidden="true" />)}
        </div>}
      </section>
    </main>
  );
}
