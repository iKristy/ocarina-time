export const GLOW_PRESETS = [
  { id: "mist", name: "Blue mist" },
  { id: "moonlight", name: "Moonlight" },
  { id: "fairy", name: "Fairy light" },
  { id: "off", name: "No glow" },
] as const;

export type GlowPreset = typeof GLOW_PRESETS[number]["id"] | "custom";
export const GLOW_COOKIE = "ocarina_glow";
export const CUSTOM_GLOW_COOKIE = "ocarina_custom_glow";
export type CustomGlow = { color: string; spread: number; opacity: number; fadeIn: number; fadeOut: number };
export const DEFAULT_CUSTOM_GLOW: CustomGlow = { color: "#a6d9ed", spread: 32, opacity: 35, fadeIn: 0.18, fadeOut: 1.62 };

export function parseCustomGlow(value: string): CustomGlow | null {
  try {
    const data = JSON.parse(value);
    if (!data || typeof data !== "object" || !/^#[0-9a-f]{6}$/i.test(data.color)) return null;
    const ranges = { spread: [0, 80], opacity: [0, 100], fadeIn: [0.05, 2], fadeOut: [0.1, 5] } as const;
    for (const [key, [min, max]] of Object.entries(ranges)) {
      const number = data[key];
      if (typeof number !== "number" || !Number.isFinite(number) || number < min || number > max) return null;
    }
    return { color: data.color, spread: data.spread, opacity: data.opacity, fadeIn: data.fadeIn, fadeOut: data.fadeOut };
  } catch { return null; }
}

export function readCustomGlow(): CustomGlow {
  const cookie = document.cookie.split("; ").find(part => part.startsWith(`${CUSTOM_GLOW_COOKIE}=`));
  try { return parseCustomGlow(decodeURIComponent(cookie?.slice(CUSTOM_GLOW_COOKIE.length + 1) ?? "")) ?? { ...DEFAULT_CUSTOM_GLOW }; }
  catch { return { ...DEFAULT_CUSTOM_GLOW }; }
}

export function saveCustomGlow(glow: CustomGlow): boolean {
  if (!parseCustomGlow(JSON.stringify(glow))) return false;
  document.cookie = `${CUSTOM_GLOW_COOKIE}=${encodeURIComponent(JSON.stringify(glow))}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return JSON.stringify(readCustomGlow()) === JSON.stringify(glow);
}

// User-adjusted values become scoped semantic tokens, shared by preview and recording.
export function customGlowTokens(glow: CustomGlow) {
  return {
    "--glow-custom-color": glow.color,
    "--glow-custom-opacity": `${glow.opacity}%`,
    "--glow-spread": `${glow.spread}px`,
    "--glow-inner-spread": `${glow.spread * 0.375}px`,
    "--glow-fade-in": `${glow.fadeIn}s`,
    "--glow-fade-out": `${glow.fadeOut}s`,
  };
}

export function parseGlowPreset(value: string): GlowPreset {
  return value === "custom" ? "custom" : GLOW_PRESETS.find(preset => preset.id === value)?.id ?? "mist";
}

export function readGlowPreset(): GlowPreset {
  const cookie = document.cookie.split("; ").find(part => part.startsWith(`${GLOW_COOKIE}=`));
  return parseGlowPreset(cookie?.slice(GLOW_COOKIE.length + 1) ?? "");
}

export function saveGlowPreset(preset: GlowPreset): boolean {
  document.cookie = `${GLOW_COOKIE}=${parseGlowPreset(preset)}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return readGlowPreset() === preset;
}