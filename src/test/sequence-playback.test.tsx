import { createElement, type ComponentType } from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("plays the selected sequence note when tapped", () => {
  const start = vi.fn();
  const pitches: number[] = [];
  const node = () => ({ connect: vi.fn().mockReturnThis() });
  vi.stubGlobal("AudioContext", class {
    state = "running";
    currentTime = 0;
    destination = {};
    createGain() {
      return { ...node(), gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() } };
    }
    createBiquadFilter() {
      return { ...node(), type: "", frequency: { value: 0 } };
    }
    createOscillator() {
      return {
        ...node(), type: "", start, stop: vi.fn(),
        frequency: { set value(value: number) { pitches.push(value); } },
      };
    }
  });
  const Page = Route.options.component as ComponentType;
  render(createElement(Page));
  fireEvent.click(screen.getByRole("button", { name: "Play Y note 1" }));
  expect(start).toHaveBeenCalledTimes(3);
  expect(pitches[0]).toBe(493.88);
});