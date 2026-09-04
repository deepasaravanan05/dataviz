/**
 * The Main Entrance gate's signage, and the food court's height.
 *
 * Three changes are proved here rather than eyeballed: that the check-in colour
 * plates are off the gate WITHOUT the classification leaving the simulation,
 * that the park's name is back on it as a board, and that the rebuilt food
 * court pavilion still clears every camera and every ride.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CAMERA_PLACES, placeById } from "@/components/world/cameraPlaces";
import { PARK_LAYOUT } from "@/components/park/layout";
import { ENTRANCE_CAMERA_POSITION, ENTRANCE_FOV } from "@/components/world/entranceView";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  FOOD_COURT_TABLES,
  GATE_OPENING,
  GATE_PILLAR_HALF,
  GATE_ARCH_Y,
  GATE_X,
  GATE_Z,
} from "@/simulation/journey/constants";
import {
  PAVILION_DEPTH,
  PAVILION_BACK,
  PAVILION_FRONT,
  PAVILION_HALF_WIDTH,
  PAVILION_TOP,
} from "@/components/food-court/FoodCourt";

let fail = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "[PASS] " : "[FAIL] ") + m); if (!c) fail++; };
const root = join(process.cwd(), "src");
const gate = readFileSync(join(root, "components", "main-gate", "MainGate.tsx"), "utf8");
const fc = readFileSync(join(root, "components", "food-court", "FoodCourt.tsx"), "utf8");

// ---------- 1. Colour plates gone from the gate ----------
ok(!/CHECK_IN_COLOR_HEX|CHECK_IN_BAND_LABEL|BANDS/.test(gate),
   "no green/yellow/red plate, label or band list remains on the gate");
ok(!/GREEN|YELLOW|RED/.test(gate.replace(/PANEL_GREEN/g, "")),
   "no colour-band naming left in the gate at all");

// ...but the classification itself is untouched.
const journey = readFileSync(join(root, "simulation", "journey", "journey.ts"), "utf8");
ok(/CHECK_IN_COLOR_HEX/.test(journey) && /CHECK_IN_BAND_LABEL/.test(journey),
   "the simulation still defines the check-in colour bands");
for (const f of ["hud/EmployeePanel.tsx", "hud/JourneyHud.tsx"]) {
  const t = readFileSync(join(root, "components", f), "utf8");
  ok(/CHECK_IN_BAND_LABEL/.test(t), `${f} still shows the band labels`);
}

// ---------- 2. The naming board ----------
/*
 * The park's name is back on the gate, as a BOARD slung under the arch rather
 * than as letters curved around it. What is proved: the letters are very dark
 * and the ground they sit on is light, which is the only arrangement in which
 * dark type reads; the board is sized by the arch rather than nudged into it,
 * so its top corners cannot drive through the band; the name fits the board;
 * and it is legible from the cameras that actually look at the gate.
 *
 * The dark PLATE that used to back the old curved lettering is still gone, and
 * must stay gone — that is checked too, because "dark letters" and "a dark
 * strip across a coral arch" are one edit apart.
 */
const SPAN = GATE_OPENING / 2 + GATE_PILLAR_HALF;
const coeff = (name: string) =>
  SPAN * Number(new RegExp(`const ${name} = ARCH_A \\* ([\\d.]+)`).exec(gate)![1]);
const ARCH_RISE = SPAN * Number(/const ARCH_RISE = PILLAR_X \* ([\d.]+)/.exec(gate)![1]);
const BAND_DEPTH = coeff("BAND_DEPTH");
const BOARD_HALF = coeff("BOARD_HALF");
const BOARD_H = coeff("BOARD_H");
const FRAME = coeff("FRAME");
const TEXT = "EMPLOYEE THEME PARK";

const soffit = (x: number) =>
  GATE_ARCH_Y + Math.sqrt(Math.max(0, 1 - (x / SPAN) ** 2)) * ARCH_RISE - BAND_DEPTH / 2;
const BOARD_TOP = soffit(BOARD_HALF) - SPAN * 0.02;
const BOARD_Y = BOARD_TOP - BOARD_H / 2;
const FONT = (BOARD_HALF * 2 * 0.86) / (TEXT.length * 0.62);

ok(new RegExp(`const SIGN_TEXT = "${TEXT}"`).test(gate) && /function NameBoard/.test(gate),
   `the gate carries its name again, on a ${(BOARD_HALF * 2).toFixed(1)} x ${BOARD_H.toFixed(1)} m board`);

/* Very dark letters on a light ground — the whole point of the change. */
/* Relative luminance the way WCAG defines it, gamma-decoded rather than taken
   straight off the sRGB triplet, so the contrast ratio reported below is the
   real one and not a flattering approximation of it. */
const lum = (hex: string) => {
  const ch = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(1) + 0.0722 * ch(2);
};
const ink = /const INK = "(#[0-9a-f]{6})"/i.exec(gate)![1];
const ground = /const STONE = "(#[0-9a-f]{6})"/i.exec(gate)![1];
ok(lum(ink) < 0.01,
   `the lettering is very dark — ${ink}, relative luminance ${lum(ink).toFixed(4)}`);
ok(lum(ground) > 0.6,
   `and the ground it is cut into is light — ${ground} at ${lum(ground).toFixed(3)}, ` +
   `a WCAG contrast ratio of ${((lum(ground) + 0.05) / (lum(ink) + 0.05)).toFixed(1)}:1`);
ok(!/emissive/.test(/<Text[\s\S]*?<\/Text>/.exec(gate)?.[0] ?? ""),
   "the dark type is an ordinary lit material — type that glowed would stop being dark after dusk");
ok(!/SignPlate|SIGN_PLATE_DEPTH|#0d1b2c/.test(gate),
   "and the old dark backing plate has NOT come back with it");

/* Sized by the arch: the board must tuck under the soffit across its whole width. */
{
  let worst = Infinity;
  for (let x = -BOARD_HALF; x <= BOARD_HALF; x += 0.1) worst = Math.min(worst, soffit(x) - BOARD_TOP);
  ok(worst > 0,
     `the board clears the arch soffit by ${worst.toFixed(2)} m at its tightest point — ` +
     `its top is derived from the soffit height at its own half-width, not typed`);
}
ok(BOARD_HALF + FRAME * 3.7 < SPAN - GATE_PILLAR_HALF,
   `it ends at +-${(BOARD_HALF + FRAME * 3.7).toFixed(1)} u, inside the tower faces at ` +
   `+-${(SPAN - GATE_PILLAR_HALF).toFixed(1)} u`);
ok(BOARD_Y - BOARD_H / 2 > 4 * 4,
   `and it hangs ${(BOARD_Y - BOARD_H / 2).toFixed(1)} m up, four times the height of an employee ` +
   `clear of anybody walking under it`);

/* The name has to fit the board it is on. */
ok(TEXT.length * FONT * 0.62 < BOARD_HALF * 2 * 0.94,
   `nineteen characters at ${FONT.toFixed(2)} u come to about ` +
   `${(TEXT.length * FONT * 0.62).toFixed(1)} u inside a ${(BOARD_HALF * 2).toFixed(1)} u board`);

/* Apparent size from the cameras that actually look at the gate. */
const pxPerUnit = (d: number, fov: number) => 1080 / (2 * d * Math.tan((fov * Math.PI) / 360));
/*
 * THE CAMERAS ARE READ FROM THE MODULES THAT OWN THEM, not typed here.
 *
 * These were the literals (70, 620) and a 95 u standoff on a 30 deg lens, which
 * was the entrance view of the time. Both have since moved: every ride is built
 * to one common height, the park is some 1.4 km across, the main gate stepped
 * back 140 m because the railway grew past it, and the landing page's lens
 * widened to 52 deg at 190 u so that the cast is on screen at all. Comparing
 * the new chip against the old gate coordinate was measuring nothing.
 *
 * WHAT THAT COSTS THE SIGN, stated rather than hidden: from the landing page
 * the name's cap height is about 20 px on a 1080-tall viewport instead of the
 * 46 px the old narrow lens gave. It is still comfortably legible — a 20 px
 * capital is bigger than body text on this page — and the board cannot simply
 * grow to win the pixels back: it is sized by the arch it hangs under, and it
 * already spans it. A bigger name would mean a bigger gate.
 */
const gateX = GATE_X, gateZ = GATE_Z;
const cap = FONT * 0.7;
const dPage = Math.hypot(
  ENTRANCE_CAMERA_POSITION[1] - BOARD_Y,
  ENTRANCE_CAMERA_POSITION[2] - gateZ,
);
ok(cap * pxPerUnit(dPage, ENTRANCE_FOV) > 18,
   `cap height reads ${(cap * pxPerUnit(dPage, ENTRANCE_FOV)).toFixed(0)} px from the Main Entrance ` +
   `page camera, ${ENTRANCE_CAMERA_POSITION[2] - gateZ} u back on a ${ENTRANCE_FOV} deg lens`);
const chip = placeById("entrance");
const dChip = Math.hypot(chip.position[0] - gateX, chip.position[1] - BOARD_Y, chip.position[2] - gateZ);
ok(cap * pxPerUnit(dChip, 46) > 25,
   `and ${(cap * pxPerUnit(dChip, 46)).toFixed(0)} px from the "Main entrance" viewpoint`);

/* Built to the gate, not dropped on it. */
ok(/color={ACCENT}/.test(gate) && /color={TEAL_DEEP}/.test(gate) && /color={STONE}/.test(gate),
   "the frame, fillet and ground are the gate's own gold, teal and cream");
ok(/scalloped/i.test(gate) && /<Bulb/.test(gate),
   "its edges are scalloped with the arch's own lobes and it is outlined in the same bulbs");

// ---------- 3. The food court pavilion ----------
/*
 * The food court was a 40 x 15 m box with a cone on top, stretched 1.75x on the
 * Y axis at render time so that it would not look small. That meant no number
 * in the file was the height of anything, and the roof sign needed a
 * counter-scale to stop its lettering stretching with the walls.
 *
 * It is now a domed octagonal pavilion with two arcaded wings and a veranda,
 * drawn at its true size. What is proved here is that it really is bigger, that
 * nothing is scaled non-uniformly any more, and above all that it still obeys
 * the three limits it has always had to: inside the food-court keep-out, below
 * every ride, and inside the frame of the viewpoint that looks at it.
 */
ok(PAVILION_HALF_WIDTH * 2 > 40 * 1.7 && PAVILION_DEPTH > 15 * 2.5 && PAVILION_TOP > 25.2 * 1.3,
   `the pavilion is ${(PAVILION_HALF_WIDTH * 2).toFixed(1)} m across and ${PAVILION_DEPTH.toFixed(1)} m deep, ` +
   `${PAVILION_TOP.toFixed(1)} m to the finial — against the 40 x 15 m and 25.2 m of the box it replaces`);
/* The terrace is derived from the building, so it can never leave the back
   corners of the pavilion standing on grass. */
ok(/TERRACE_HALF_X = PAVILION_HALF_WIDTH \+/.test(fc) && /TERRACE_BACK = PAVILION_BACK -/.test(fc),
   "the terrace paving is sized from the pavilion rather than typed, so it always reaches past it");
/*
 * And the building must not have grown out into the diners.
 *
 * MEASURED ON THE RADIUS NOW, not on z. The tables used to sit in one file in
 * front of the pavilion, so "the nearest table" was the one with the smallest
 * z and the building only had to stop short of it. The court is a circular
 * plaza and the tables ring it, so the pavilion has to clear the seating in
 * EVERY direction — which is what the radius asks, and what the old test would
 * have missed entirely for a table set behind the hall.
 */
{
  const nearestTable = Math.min(...FOOD_COURT_TABLES.map((t) => Math.hypot(t[0], t[1])));
  const pavilionReach = Math.max(PAVILION_HALF_WIDTH, Math.abs(PAVILION_FRONT), Math.abs(PAVILION_BACK));
  ok(pavilionReach < nearestTable - 2,
     `it reaches ${pavilionReach.toFixed(1)} m from the middle with the nearest table at ` +
     `${nearestTable.toFixed(1)} m — the veranda covers the kiosks without reaching the seating`);
}
ok(/function DomedHall/.test(fc) && /function Wing/.test(fc) && /function Veranda/.test(fc) &&
   /function ArchedBay/.test(fc),
   "a domed octagonal hall, two arcaded wings and a colonnaded veranda — not a box with a cone");
/* The tell-tale of a stretched building is a RECIPROCAL scale somewhere,
   undoing the distortion for the one child that must not inherit it — here, the
   lettering. The dome is still squashed on Y, but that is a segmental dome's
   actual shape rather than a building pretending to be taller. */
ok(!/HALL_HEIGHT_SCALE/.test(fc) && !/1 \//.test(fc),
   "no height fudge and no counter-scale left: every dimension in the file is a real metre, " +
   "and the sign needs no correction because nothing it sits on is distorted");

/* Limit 1: it must stay inside the keep-out the planting and the routes use. */
ok(PAVILION_HALF_WIDTH < FOOD_COURT_HALF,
   `it spans +-${PAVILION_HALF_WIDTH.toFixed(1)} u inside the ${FOOD_COURT_HALF} u food-court keep-out, ` +
   `so the planting and every walked route still clear it`);

/* Limit 2: it must not compete with an attraction. */
const shortestRide = Math.min(...PARK_LAYOUT.map((r) => r.height));
const tallestRide = Math.max(...PARK_LAYOUT.map((r) => r.height));
ok(PAVILION_TOP < shortestRide,
   `at ${PAVILION_TOP.toFixed(1)} m it sits below even the shortest ride (${shortestRide.toFixed(1)} m), ` +
   `let alone the tallest (${tallestRide.toFixed(0)} m)`);

/* Limit 3: the cameras. */
{
  const hallHalfZ = PAVILION_DEPTH / 2;
  let inside = "";
  for (const p of CAMERA_PLACES) {
    const dx = p.position[0] - FOOD_COURT_CENTER[0];
    const dz = p.position[2] - FOOD_COURT_CENTER[1];
    if (
      Math.abs(dx) < PAVILION_HALF_WIDTH + 14 &&
      Math.abs(dz) < hallHalfZ &&
      p.position[1] < PAVILION_TOP
    ) {
      inside = `${p.label} at y=${p.position[1].toFixed(1)}`;
    }
  }
  ok(inside === "", inside || "no viewpoint sits inside or under the taller pavilion");

  const fcv = placeById("food-court");
  const d = Math.hypot(fcv.position[0] - FOOD_COURT_CENTER[0], fcv.position[2] - FOOD_COURT_CENTER[1]);
  const halfFrame = d * Math.tan((46 * Math.PI) / 360);
  ok(PAVILION_TOP - fcv.lookAt[1] < halfFrame,
     `the whole ${PAVILION_TOP.toFixed(1)} m pavilion fits the Food court view — ` +
     `${(PAVILION_TOP - fcv.lookAt[1]).toFixed(1)} u above the look-at against a ${halfFrame.toFixed(1)} u half-frame`);
}

/* And it must not poke into a ride. */
{
  let hits = "";
  for (const r of PARK_LAYOUT) {
    const ox = Math.max(
      r.minX - (FOOD_COURT_CENTER[0] + PAVILION_HALF_WIDTH),
      FOOD_COURT_CENTER[0] - PAVILION_HALF_WIDTH - r.maxX,
      0,
    );
    const oz = Math.max(
      r.minZ - (FOOD_COURT_CENTER[1] + PAVILION_DEPTH / 2),
      FOOD_COURT_CENTER[1] - PAVILION_DEPTH / 2 - r.maxZ,
      0,
    );
    if (ox === 0 && oz === 0) hits = r.label;
  }
  ok(hits === "", hits ? `overlaps ${hits}` : "the pavilion footprint clears every ride footprint");
}

console.log(fail ? `\n${fail} FAILED` : "\nOK: all three entrance/food-court changes verified.");
process.exit(fail ? 1 : 0);
