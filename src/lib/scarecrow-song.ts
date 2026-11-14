import type { Note } from "./ocarina-playback";

export const SCARECROW_LENGTH = 8;
export const SCARECROW_COOKIE = "ocarina_scarecrow";
export const AVAILABLE_NOTES: Note[] = ["A", "D", "R", "L", "U"];

export function parseScarecrow(value: string): Note[] | null {
  if (value.length !== SCARECROW_LENGTH || !/^[ADRLU]+$/.test(value)) return null;
  return value.split("") as Note[];
}

export function readScarecrow(): Note[] | null {
  const cookie = document.cookie.split("; ").find(part => part.startsWith(`${SCARECROW_COOKIE}=`));
  return cookie ? parseScarecrow(cookie.slice(SCARECROW_COOKIE.length + 1)) : null;
}

export function saveScarecrow(notes: Note[]) {
  const value = notes.join("");
  if (!parseScarecrow(value)) return false;
  document.cookie = `${SCARECROW_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return true;
}

export function resetScarecrow() {
  document.cookie = `${SCARECROW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}