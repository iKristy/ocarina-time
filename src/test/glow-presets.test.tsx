import { createElement, type ComponentType } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GLOW_COOKIE, parseGlowPreset, readGlowPreset, saveGlowPreset } from "@/lib/glow-presets";
import { Route } from "@/routes/index";

afterEach(() => {
  cleanup();
  document.cookie = `${GLOW_COOKIE}=; Path=/; Max-Age=0`;
});

it("rejects unknown cookie values and restores the original glow", () => {
  expect(parseGlowPreset("unknown")).toBe("mist");
});

it("saves and reads a device-local preset", () => {
  expect(saveGlowPreset("fairy")).toBe(true);
  expect(readGlowPreset()).toBe("fairy");
});

it("keeps previews unsaved until saving and restores the choice on remount", () => {
  const Page = Route.options.component as ComponentType;
  const page = render(createElement(Page));
  fireEvent.click(screen.getByRole("button", { name: "Glow settings" }));
  fireEvent.click(screen.getByRole("button", { name: "Moonlight" }));
  fireEvent.click(screen.getByRole("button", { name: "Preview" }));
  expect(readGlowPreset()).toBe("mist");
  fireEvent.click(screen.getByRole("button", { name: "Save preset" }));
  expect(readGlowPreset()).toBe("moonlight");
  page.unmount();
  render(createElement(Page));
  fireEvent.click(screen.getByRole("button", { name: "Glow settings" }));
  expect(screen.getByRole("button", { name: "Moonlight" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Fairy light" }));
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(readGlowPreset()).toBe("moonlight");
});