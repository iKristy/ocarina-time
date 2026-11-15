import { createElement, type ComponentType } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GLOW_COOKIE, CUSTOM_GLOW_COOKIE, DEFAULT_CUSTOM_GLOW, parseCustomGlow, readCustomGlow, saveCustomGlow, parseGlowPreset, readGlowPreset, saveGlowPreset } from "@/lib/glow-presets";
import { Route } from "@/routes/index";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  document.cookie = `${GLOW_COOKIE}=; Path=/; Max-Age=0`;
  document.cookie = `${CUSTOM_GLOW_COOKIE}=; Path=/; Max-Age=0`;
  vi.unstubAllGlobals();
});

it("saves all custom glow adjustments without losing separate fade times", () => {
  const custom = { color: "#45aacc", spread: 60, opacity: 20, fadeIn: 0.25, fadeOut: 3 };
  expect(saveCustomGlow(custom)).toBe(true);
  expect(readCustomGlow()).toEqual(custom);
});

it("rejects invalid custom values rather than applying unsafe cookie content", () => {
  expect(parseCustomGlow(JSON.stringify({ ...DEFAULT_CUSTOM_GLOW, color: "url(example)" }))).toBeNull();
  expect(saveCustomGlow({ ...DEFAULT_CUSTOM_GLOW, opacity: 101 })).toBe(false);
});

it("saves adjusted color and spread as custom and restores controls after remount", () => {
  const Page = Route.options.component as ComponentType;
  const page = render(createElement(Page));
  fireEvent.click(screen.getByRole("button", { name: "Glow settings" }));
  fireEvent.change(screen.getByLabelText("Glow color"), { target: { value: "#45aacc" } });
  fireEvent.keyDown(screen.getByRole("slider", { name: "Spread" }), { key: "End" });
  expect(readGlowPreset()).toBe("mist");
  fireEvent.click(screen.getByRole("button", { name: "Save preset" }));
  expect(readGlowPreset()).toBe("custom");
  expect(readCustomGlow()).toEqual({ ...DEFAULT_CUSTOM_GLOW, color: "#45aacc", spread: 80 });
  page.unmount();
  render(createElement(Page));
  fireEvent.click(screen.getByRole("button", { name: "Glow settings" }));
  expect(screen.getByLabelText("Glow color")).toHaveValue("#45aacc");
  expect(screen.getByRole("slider", { name: "Spread" })).toHaveAttribute("aria-valuenow", "80");
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