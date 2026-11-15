import { expect, it } from "vitest";
import { RECORDING_GLOW, customGlowTokens } from "@/lib/glow-presets";

it("uses the blue swatch in the supplied screenshot", () => {
  expect(customGlowTokens(RECORDING_GLOW)["--glow-custom-color"]).toBe("#43a1dc");
});
it("uses the requested 55px spread", () => {
  expect(customGlowTokens(RECORDING_GLOW)["--glow-spread"]).toBe("55px");
});
it("uses the requested 50% opacity", () => {
  expect(customGlowTokens(RECORDING_GLOW)["--glow-custom-opacity"]).toBe("50%");
});
it("uses the requested 0.2 second fade in", () => {
  expect(customGlowTokens(RECORDING_GLOW)["--glow-fade-in"]).toBe("0.2s");
});
it("uses the requested 1.5 second fade out", () => {
  expect(customGlowTokens(RECORDING_GLOW)["--glow-fade-out"]).toBe("1.5s");
});
