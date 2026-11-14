import { afterEach, expect, it } from "vitest";
import { parseScarecrow, readScarecrow, resetScarecrow, saveScarecrow } from "@/lib/scarecrow-song";

afterEach(resetScarecrow);

it("starts empty and accepts only complete eight-note combinations", () => {
  expect(readScarecrow()).toBeNull();
  expect(parseScarecrow("ADRLUADR")).toEqual(["A", "D", "R", "L", "U", "A", "D", "R"]);
  expect(parseScarecrow("ADRLUAD")).toBeNull();
  expect(parseScarecrow("ADRLUADX")).toBeNull();
});

it("saves a combination in a cookie and clears it for re-recording", () => {
  expect(saveScarecrow(["A", "D", "R", "L", "U", "A", "D", "R"])).toBe(true);
  expect(readScarecrow()?.join("")).toBe("ADRLUADR");
  resetScarecrow();
  expect(readScarecrow()).toBeNull();
});