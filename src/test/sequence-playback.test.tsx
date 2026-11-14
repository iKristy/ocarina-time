import { createElement, type ComponentType } from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";

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
    createBuffer() { return { getChannelData: () => new Float32Array(44100) }; }
    createBufferSource() { return { ...node(), buffer: null, loop: false, start, stop: vi.fn() }; }
    createGain() {
      return { ...node(), gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() } };
    }
    createBiquadFilter() {
      return { ...node(), type: "", frequency: { value: 0 }, Q: { value: 0 } };
    }
    createOscillator() {
      return {
        ...node(), type: "", start, stop: vi.fn(),
        detune: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        frequency: { set value(value: number) { pitches.push(value); } },
      };
    }
  });
});

it("plays the selected sequence note when tapped", () => {
  const Page = Route.options.component as ComponentType;
  render(createElement(Page));
  fireEvent.click(screen.getByRole("button", { name: "Play Y note 1" }));
  expect(start).toHaveBeenCalledTimes(4);
  expect(pitches[0]).toBe(493.88);
});

it("spaces song notes 600 milliseconds apart for a slightly slower pace", async () => {
  vi.useFakeTimers();
  const Page = Route.options.component as ComponentType;
  render(createElement(Page));
  const timeout = vi.spyOn(globalThis, "setTimeout");
  fireEvent.click(screen.getByRole("button", { name: /Saria's Song/ }));
  expect(timeout).toHaveBeenCalledWith(expect.any(Function), 600);
  await vi.runAllTimersAsync();
  timeout.mockRestore();
});