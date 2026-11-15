export const GLOW_PRESETS = [
  { id: "mist", name: "Blue mist" },
  { id: "moonlight", name: "Moonlight" },
  { id: "fairy", name: "Fairy light" },
  { id: "off", name: "No glow" },
] as const;

export type GlowPreset = typeof GLOW_PRESETS[number]["id"];
export const GLOW_COOKIE = "ocarina_glow";

export function parseGlowPreset(value: string): GlowPreset {
  return GLOW_PRESETS.find(preset => preset.id === value)?.id ?? "mist";
}

export function readGlowPreset(): GlowPreset {
  const cookie = document.cookie.split("; ").find(part => part.startsWith(`${GLOW_COOKIE}=`));
  return parseGlowPreset(cookie?.slice(GLOW_COOKIE.length + 1) ?? "");
}

export function saveGlowPreset(preset: GlowPreset): boolean {
  document.cookie = `${GLOW_COOKIE}=${parseGlowPreset(preset)}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return readGlowPreset() === preset;
}