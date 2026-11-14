import { createElement, type ComponentType } from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";
import { SONGS, songTiming } from "@/lib/ocarina-playback";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const start = vi.fn();
const pitches: number[] = [];
beforeEach(() => {
  start.mockClear();
  pitches.length = 0;
  const node = () => ({ connect: vi.fn().mockReturnThis() });
  vi.stubGlobal("AudioContext", class {
    state = "running";
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    close() { return Promise.resolve(); }
    createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { return { ...node(), buffer: null, loop: false, start, stop: vi.fn() }; }
    createGain() {
      return { ...node(), disconnect: vi.fn(), gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() } };
    }
    createBiquadFilter() {
      return { ...node(), type: "", frequency: { value: 0 }, Q: { value: 0 } };
    }
    createConvolver() { return { ...node(), buffer: null }; }
    createDynamicsCompressor() {
      return { ...node(), ...Object.fromEntries(["threshold", "knee", "ratio", "attack", "release"].map(key => [key, { value: 0 }])) };
    }
    createOscillator() {
      return {
        ...node(), type: "", start, stop: vi.fn(),
        detune: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        frequency: { value: 0, setValueAtTime: (value: number) => pitches.push(value), exponentialRampToValueAtTime: vi.fn() },
      };
    }
  });
});

it("plays the selected sequence note when tapped", () => {
  const Page = Route.options.component as ComponentType;
  render(createElement(Page));
  fireEvent.click(screen.getByRole("button", { name: "Play Y note 1" }));
  expect(start).toHaveBeenCalledTimes(6);
  expect(pitches[0]).toBeCloseTo(987.77 * 0.982);
});

it("schedules Zelda's Lullaby using the attached beat lengths", async () => {
  vi.useFakeTimers();
  const Page = Route.options.component as ComponentType;
  render(createElement(Page));
  const timeout = vi.spyOn(globalThis, "setTimeout");
  fireEvent.click(screen.getByRole("button", { name: /Zelda's Lullaby/ }));
  expect(timeout).toHaveBeenCalledWith(expect.any(Function), 100);
  expect(timeout).toHaveBeenCalledWith(expect.any(Function), 850);
  await vi.runAllTimersAsync();
  timeout.mockRestore();
});

it.each([
  ["Zelda's Lullaby", 160, [2, 1, 3, 2, 1, 3]],
  ["Epona's Song", 190, [1, 1, 4, 1, 1, 4]],
  ["Saria's Song", 250, [1, 1, 2, 1, 1, 2]],
  ["Sun's Song", 240, [1, 1, 3, 1, 1, 3]],
  ["Song of Time", 180, [2, 3, 1, 2, 3, 1]],
  ["Song of Storms", 260, [1, 1, 4, 1, 1, 4]],
  ["Minuet of Forest", 170, [1, 3, 1, 1, 1, 3]],
  ["Bolero of Fire", 220, [1, 1, 1, 1, 1, 1, 1, 3]],
  ["Serenade of Water", 170, [1, 1, 2, 1, 4]],
  ["Requiem of Spirit", 170, [2, 1, 3, 2, 1, 3]],
  ["Nocturne of Shadow", 170, [1, 1, 2, 2, 1, 1, 4]],
  ["Prelude of Light", 170, [1, 1, 2, 1, 1, 3]],
] as const)("preserves %s's tempo and rhythm", (name, bpm, beats) => {
  const song = SONGS.find(song => song.name === name);
  expect(song).toBeDefined();
  if (!song) return;
  expect(song.bpm).toBe(bpm);
  expect(song.beats).toEqual(beats);
  expect(songTiming(song).map(event => event.beat)).toEqual(beats.map(beat => beat * 60 / bpm));
});