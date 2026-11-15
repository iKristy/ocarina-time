export const RECORDING_GLOW = { color: "#43a1dc", spread: 55, opacity: 50, fadeIn: 0.2, fadeOut: 1.5 } as const;

// Shared scoped tokens keep the fixed recording effect consistent.
export function customGlowTokens(glow: typeof RECORDING_GLOW) {
  return {
    "--glow-custom-color": glow.color,
    "--glow-custom-opacity": `${glow.opacity}%`,
    "--glow-spread": `${glow.spread}px`,
    "--glow-inner-spread": `${glow.spread * 0.375}px`,
    "--glow-fade-in": `${glow.fadeIn}s`,
    "--glow-fade-out": `${glow.fadeOut}s`,
  };
}
