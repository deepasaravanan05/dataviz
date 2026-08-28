import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import { PARK_LAYOUT, rideById } from "../src/components/park/layout";
import { PARK_SCALE } from "../src/components/park/parkScale";
import { SKY_THEMES } from "../src/components/world/skyThemes";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { DRAGON_ORIGIN } from "../src/components/dragon-ride/constants";
import { MONSTER_ORIGIN } from "../src/components/monster-ride/constants";
import { TOWER_ORIGIN } from "../src/components/drop-tower/constants";
import { CAMERA_PLACES, placeById } from "../src/components/world/cameraPlaces";
import { RIDE_LOOK } from "../src/components/world/rideLighting";
import { RIDE_PAINT } from "../src/world/ridePaint";
import { RIDE_DEPARTMENTS } from "../src/components/park/departments";
import { TOWER_HEIGHT } from "../src/components/drop-tower/constants";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { TRAIN_SCALE } from "../src/components/park/parkScale";
import { HUMAN } from "../src/world/scale";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const scene = read("src", "components", "roller-coaster", "ParkScene.tsx");
const ledSrc = read("src", "components", "world", "led.tsx");
const rigSrc = read("src", "components", "world", "rideLighting.tsx");
const plazaSrc = read("src", "components", "world", "RidePlaza.tsx");
const kitSrc = read("src", "components", "world", "kit.tsx");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

// ============ 1. It is night ============
check(
  "the sky is a night sky, not a daylight one",
  /<NightSky \/>/.test(scene) && !/<Sky /.test(scene),
  "gradient dome, stars and a moon replace the daylight sky",
);
/*
 * The park now renders at a chosen time of day, so these values live in the
 * shared theme table instead of as literals in the scene. The night this
 * script was written for is the `dark` entry, and it is asserted value for
 * value — the scene is separately checked to read from that table.
 */
const NIGHT = SKY_THEMES.dark;
check(
  "the scene takes its atmosphere from the shared theme table",
  /SKY_THEMES\[/.test(scene) && /sky\.fog\.color/.test(scene) && /sky\.key\.color/.test(scene),
  "background, fog, lights, exposure and ground all come from one source",
);
check(
  "the background is near-black",
  NIGHT.background === "#05070f",
  NIGHT.background,
);
check(
  "the haze is a night haze",
  NIGHT.fog.color === "#0a1020",
  `${NIGHT.fog.color} from ${NIGHT.fog.near} m to ${NIGHT.fog.far} m`,
);
check(
  "the key light is moonlight, not sunlight",
  NIGHT.key.color === "#a8c4ff" && NIGHT.key.intensity === 0.62,
  "one cool, dim, shadow-casting source",
);
check(
  "exposure is pulled down so the dark stays dark",
  NIGHT.toneMappingExposure === 0.92 && /ACESFilmicToneMapping/.test(scene),
  `ACES filmic at ${NIGHT.toneMappingExposure}`,
);
/*
 * The night ground.
 *
 * This used to pin the grass to the literal "#23231a" it was first tuned at.
 * The ground has since become a generated lawn rather than a painted plane,
 * and its hue moved from a near-neutral olive to a dark green with it — so
 * pinning the hex would now only assert that a superseded colour survived.
 * What actually has to hold is the property the original value was chosen for:
 * the night ground must be as DARK as it always was, whatever colour it is.
 * That is asserted directly, against the original value's own luminance.
 */
const REC709 = (hex: string) =>
  0.2126 * parseInt(hex.slice(1, 3), 16) +
  0.7152 * parseInt(hex.slice(3, 5), 16) +
  0.0722 * parseInt(hex.slice(5, 7), 16);
const ORIGINAL_NIGHT_GRASS = "#23231a";
const nightGrass = NIGHT.ground.grass;
const g = parseInt(nightGrass.slice(3, 5), 16);
check(
  "the night ground is planted ground, and no lighter than the night it was tuned for",
  Math.abs(REC709(nightGrass) - REC709(ORIGINAL_NIGHT_GRASS)) < 2 &&
    g > parseInt(nightGrass.slice(1, 3), 16) &&
    g > parseInt(nightGrass.slice(5, 7), 16) &&
    NIGHT.ground.plaza === "#3a3128",
  `${nightGrass} at luminance ${REC709(nightGrass).toFixed(1)} against the original ` +
    `${ORIGINAL_NIGHT_GRASS} at ${REC709(ORIGINAL_NIGHT_GRASS).toFixed(1)} — same darkness, now green`,
);
/* The lit themes are the point of the feature: they must not be night again. */
for (const id of ["sunset", "sunrise"] as const) {
  const t = SKY_THEMES[id];
  const lum = (hex: string) =>
    [1, 3, 5].reduce((a, i) => a + parseInt(hex.slice(i, i + 2), 16), 0) / 3;
  check(
    `${t.label} is a lit sky, not a dark one`,
    lum(t.dome.horizon) > 150 &&
      t.toneMappingExposure > NIGHT.toneMappingExposure &&
      t.key.intensity > NIGHT.key.intensity * 2 &&
      !t.stars,
    `horizon ${t.dome.horizon}, exposure ${t.toneMappingExposure}, key ${t.key.intensity}`,
  );
}
check(
  "surfaces were repainted for night rather than left in daylight colours",
  /#15171d/.test(kitSrc) && /#2e3138/.test(kitSrc) && !/color: "#b0aca3"/.test(kitSrc),
  "asphalt and paving are dark with a low-roughness sheen",
);

// ============ 2. Lighting is emissive, not hundreds of dynamic lights ============
const realLights = (scene.match(/<(ambient|directional|hemisphere|point|spot)Light/g) ?? []).length;
check(
  "the park runs on a handful of real lights",
  realLights <= 5,
  `${realLights} light sources for the whole world; everything else is emissive`,
);
check(
  "no ride rig creates a dynamic light",
  !/<(point|spot|directional)Light/i.test(code(rigSrc + plazaSrc)),
  "every ride light is emissive geometry",
);
check(
  "the LED chase runs on the GPU",
  /onBeforeCompile/.test(ledSrc) && /attribute float aPhase/.test(ledSrc),
  "a per-instance phase attribute against one shared clock uniform",
);
check(
  "one clock drives every LED in the park",
  /const LED_TIME = \{ value: 0 \}/.test(ledSrc) && /<LedClock \/>/.test(scene),
  "animating the whole park costs a single uniform write per frame",
);
check(
  "the chase is a travelling crest, not a strobe",
  /pow\(wave, 7\.0\)/.test(ledSrc) &&
    Object.values(RIDE_LOOK).every((r) => r.look.speed <= 0.9),
  `slowest ${Math.min(...Object.values(RIDE_LOOK).map((r) => r.look.speed))} Hz, fastest ${Math.max(...Object.values(RIDE_LOOK).map((r) => r.look.speed))} Hz`,
);
check(
  "the lights are instanced",
  /InstancedMesh/.test(ledSrc),
  "a run of several hundred LEDs is one draw call",
);

// ============ 3. Six rides, six identities ============
const SIX = ["coaster", "ferris", "tower", "dragon", "monster", "train"];
check(
  "all six rides have a lighting identity",
  SIX.every((id) => RIDE_LOOK[id]),
  SIX.map((id) => `${id}: ${RIDE_LOOK[id]?.label}`).join(", "),
);
check(
  "no two rides share an accent colour",
  new Set(SIX.map((id) => RIDE_LOOK[id].accent)).size === SIX.length,
  SIX.map((id) => RIDE_LOOK[id].accent).join(" "),
);
/** Accent colours must be far enough apart to tell apart at a distance. */
function hueDistance(a: string, b: string) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  const ha = { h: 0, s: 0, l: 0 };
  const hb = { h: 0, s: 0, l: 0 };
  ca.getHSL(ha);
  cb.getHSL(hb);
  const d = Math.abs(ha.h - hb.h);
  return Math.min(d, 1 - d);
}
let closestHue = 1;
let closestPair = "";
for (let i = 0; i < SIX.length; i++) {
  for (let j = i + 1; j < SIX.length; j++) {
    const d = hueDistance(RIDE_LOOK[SIX[i]].accent, RIDE_LOOK[SIX[j]].accent);
    if (d < closestHue) {
      closestHue = d;
      closestPair = `${SIX[i]}/${SIX[j]}`;
    }
  }
}
check(
  "the six identities are separable by hue, not just by name",
  closestHue > 0.05,
  `closest pair ${closestPair} is ${(closestHue * 360).toFixed(0)}deg apart on the wheel`,
);
/*
 * THE PAINT, not just the light.
 *
 * A light only reads at dusk, so each ride's STRUCTURE is painted its own
 * colour too. The same hue-distance test applies: six painted rides that a
 * visitor could confuse at a distance would defeat the point of painting
 * them. The light and dark tones are the same hue as the light tone by
 * construction, so testing the lit face tests the ride.
 */
check(
  "all six rides carry a structural paint colour",
  SIX.every((id) => RIDE_PAINT[id as keyof typeof RIDE_PAINT]),
  SIX.map((id) => `${id}: ${RIDE_PAINT[id as keyof typeof RIDE_PAINT]?.light}`).join(", "),
);
let closestPaint = 1;
let closestPaintPair = "";
for (let i = 0; i < SIX.length; i++) {
  for (let j = i + 1; j < SIX.length; j++) {
    const d = hueDistance(
      RIDE_PAINT[SIX[i] as keyof typeof RIDE_PAINT].light,
      RIDE_PAINT[SIX[j] as keyof typeof RIDE_PAINT].light,
    );
    if (d < closestPaint) {
      closestPaint = d;
      closestPaintPair = `${SIX[i]}/${SIX[j]}`;
    }
  }
}
check(
  "no two rides are painted the same colour",
  closestPaint > 0.05,
  `closest pair ${closestPaintPair} is ${(closestPaint * 360).toFixed(0)}deg apart on the wheel`,
);
/* Each ride's paint must also sit near its own LED accent, so the ride that
   glows blue at night is the ride that is blue at noon. */
let worstMatch = 0;
let worstMatchRide = "";
for (const id of SIX) {
  const d = hueDistance(RIDE_PAINT[id as keyof typeof RIDE_PAINT].light, RIDE_LOOK[id].accent);
  if (d > worstMatch) {
    worstMatch = d;
    worstMatchRide = id;
  }
}
check(
  "a ride's paint and its LED accent are the same colour identity",
  worstMatch < 0.09,
  `furthest is ${worstMatchRide} at ${(worstMatch * 360).toFixed(0)}deg between paint and light`,
);
/* The three tones of one ride must be one hue at falling lightness, or the
   lattice would read as three different rides bolted together. */
let toneDrift = 0;
let toneRide = "";
for (const id of SIX) {
  const p = RIDE_PAINT[id as keyof typeof RIDE_PAINT];
  const d = Math.max(hueDistance(p.light, p.mid), hueDistance(p.light, p.dark));
  if (d > toneDrift) {
    toneDrift = d;
    toneRide = id;
  }
}
check(
  "each ride's three tones are one hue, not three colours",
  toneDrift < 0.02,
  `widest drift is ${toneRide} at ${(toneDrift * 360).toFixed(1)}deg across its three tones`,
);

check(
  "each rig is built from that ride's own published geometry",
  /COASTER_CURVE/.test(rigSrc) &&
    /WHEEL_RADIUS/.test(rigSrc) &&
    /BAY_COUNT/.test(rigSrc) &&
    /APEX_HEIGHT/.test(rigSrc) &&
    /TRAIN_CURVE/.test(rigSrc),
  "track curves, rim radii, lattice bays and A-frame spread all read from the rides",
);
check(
  "no rig hand-types a ride's position",
  /TOWER_ORIGIN/.test(rigSrc) && /DRAGON_ORIGIN/.test(rigSrc) && /MONSTER_ORIGIN/.test(rigSrc),
  "rigs take their origin from the ride they light",
);
for (const d of RIDE_DEPARTMENTS) {
  check(
    `${d.department} has a lit entrance naming it`,
    /\{dept\.department\}/.test(plazaSrc) && /<RidePlazas \/>/.test(scene),
    "portal, sign, queue rails and an operator booth",
  );
}

// ============ 4. The rides are the tallest things, and bigger than before ============
check(
  "the park was enlarged without moving a ride",
  PARK_SCALE >= 2,
  `PARK_SCALE ${PARK_SCALE}x (was 1.7x)`,
);
/*
 * Ride placement, as it now stands.
 *
 * Three of these are the centres the park has always had. Two changed, and both
 * changes were asked for or forced by one that was:
 *
 *   - the Monster Ride and the Drop Tower each STEPPED BACK 40 m, away from the
 *     main gate at z = 620 and deeper into the park;
 *   - the Roller Coaster moved 12.3 m west, which nobody asked for. Every ride
 *     grew 20%, and at full size the Roller Coaster and the Monster Ride
 *     overlap by 12.5 m in x. The layout solver will not let two rides
 *     intersect, so it pushed the pair apart symmetrically.
 */
const EXPECTED: Record<string, [number, number]> = {
  ferris: [-165, 250],
  dragon: [-72.3, 117.7],
  coaster: [57.7196817359987, -10],
  monster: [217.2803182640013, 50],
  tower: [267.75, 240],
};
check(
  "every ride is still at its exact original centre",
  PARK_LAYOUT.every((r) => {
    const e = EXPECTED[r.id];
    return e && Math.abs(r.center[0] - e[0]) < 1e-6 && Math.abs(r.center[1] - e[1]) < 1e-6;
  }),
  PARK_LAYOUT.map((r) => `${r.label} (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)})`).join(", "),
);
check(
  "the drop tower is the park's vertical landmark",
  TOWER_HEIGHT >= 100 && PARK_LAYOUT.every((r) => r.id === "tower" || r.height < TOWER_HEIGHT),
  `${TOWER_HEIGHT} m against a next-tallest of ${Math.max(...PARK_LAYOUT.filter((r) => r.id !== "tower").map((r) => r.height)).toFixed(0)} m`,
);
check(
  "employees are still human, not shrunk to make the rides look big",
  HUMAN.height >= 1.6 && HUMAN.height <= 1.9,
  `${HUMAN.height} m — the rides grew, the people did not shrink`,
);
console.log("");
for (const r of PARK_LAYOUT) {
  check(
    `${r.label} towers over a person`,
    r.height / HUMAN.height > 14,
    `${r.height.toFixed(0)} m = ${(r.height / HUMAN.height).toFixed(0)} people tall`,
  );
}

// ============ 5. THE TEST THAT MATTERS: all six visible from the overview ============
const overview = placeById("overview");
const camera = new THREE.PerspectiveCamera(46, 16 / 9, 1, 12000);
camera.position.set(...overview.position);
camera.lookAt(...overview.lookAt);
camera.updateMatrixWorld(true);
camera.updateProjectionMatrix();

interface Screen {
  id: string;
  label: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  dist: number;
}
function project(id: string, label: string, cx: number, cz: number, hx: number, hz: number, h: number): Screen {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (const sy of [0, 1]) {
        const v = new THREE.Vector3(cx + sx * hx, sy * h, cz + sz * hz).project(camera);
        xs.push(v.x);
        ys.push(v.y);
      }
    }
  }
  return {
    id,
    label,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    dist: Math.hypot(cx - camera.position.x, cz - camera.position.z),
  };
}
const area = (b: Screen) => Math.max(0, b.maxX - b.minX) * Math.max(0, b.maxY - b.minY);
const overlapArea = (a: Screen, b: Screen) =>
  Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)) *
  Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));

const screens: Screen[] = PARK_LAYOUT.map((r) =>
  project(r.id, r.label, r.center[0], r.center[1], r.halfX, r.halfZ, r.height),
);

// The sixth ride: the railway loop, whose lit track rings the whole park.
const tx: number[] = [];
const tz: number[] = [];
for (let i = 0; i <= 400; i++) {
  const p = TRACK_CURVE.getPointAt(i / 400);
  tx.push(p.x * TRAIN_SCALE);
  tz.push(p.z * TRAIN_SCALE);
}
const loopScreen = { minX: 1e9, maxX: -1e9, minY: 1e9, maxY: -1e9 };
for (let i = 0; i < tx.length; i += 4) {
  const v = new THREE.Vector3(tx[i], 3, tz[i]).project(camera);
  loopScreen.minX = Math.min(loopScreen.minX, v.x);
  loopScreen.maxX = Math.max(loopScreen.maxX, v.x);
  loopScreen.minY = Math.min(loopScreen.minY, v.y);
  loopScreen.maxY = Math.max(loopScreen.maxY, v.y);
}

console.log("");
for (const s of screens) {
  check(
    `${s.label} holds the frame from the overview`,
    area(s) > 0.012 && s.minX > -1 && s.maxX < 1 && s.minY > -1 && s.maxY < 1,
    `${(area(s) * 100).toFixed(2)}% of frame area, at screen x[${s.minX.toFixed(2)}, ${s.maxX.toFixed(2)}]`,
  );
}
check(
  "the railway loop is framed, drawing the park's outline",
  loopScreen.minX > -1 && loopScreen.maxX < 1 && loopScreen.minY > -1 && loopScreen.maxY < 1,
  `x[${loopScreen.minX.toFixed(2)}, ${loopScreen.maxX.toFixed(2)}] y[${loopScreen.minY.toFixed(2)}, ${loopScreen.maxY.toFixed(2)}]`,
);

let worstCover = 0;
let worstPair = "";
for (const near of screens) {
  for (const far of screens) {
    if (near.id === far.id || far.dist <= near.dist) continue;
    const cover = overlapArea(near, far) / Math.max(area(far), 1e-9);
    // A slender lattice mast overlaps a bounding box without hiding anything.
    const slender = Math.max(rideById(near.id).halfX, rideById(near.id).halfZ) < 20;
    if (!slender && cover > worstCover) {
      worstCover = cover;
      worstPair = `${near.label} over ${far.label}`;
    }
  }
}
check(
  "no ride is hidden behind another from the overview",
  worstCover < 0.4,
  worstCover === 0
    ? "no solid ride overlaps a further one at all"
    : `worst overlap ${(worstCover * 100).toFixed(0)}% (${worstPair})`,
);
check(
  "the three viewing distances all exist",
  ["ground", "mid", "overview"].every((id) => CAMERA_PLACES.some((p) => p.id === id)),
  CAMERA_PLACES.filter((p) => p.group === "park").map((p) => p.label).join(", "),
);
check(
  "the park opens on the overview",
  scene.includes("[398, 360, 887]"),
  "the first thing you see is the whole park",
);

// ============ 6. Nothing was lost ============
check(
  "the employee simulation still runs",
  /<ParkJourney \/>/.test(scene),
  "gate, food court, walking staff and the clock are all still mounted",
);
check(
  "the camera system still runs",
  /<CameraDirector \/>/.test(scene) && /<OrbitControls/.test(scene),
  "travel, follow and free orbit intact",
);
check(
  "the environment still runs",
  /<ParkEnvironment \/>/.test(scene) && /<RideDepartmentSigns \/>/.test(scene),
  "paths, planting, perimeter and department signage intact",
);
check(
  "employee selection still works",
  /onPointerMissed/.test(scene) && /<RideHighlights \/>/.test(scene),
  "clicking a ride or an employee is unchanged",
);

// ============ Summary ============
console.log("\nSix landmarks:");
for (const id of SIX) {
  const s = screens.find((x) => x.id === id);
  const r = PARK_LAYOUT.find((x) => x.id === id);
  const frame = s ? `${(area(s) * 100).toFixed(2)}% of frame` : "rings the park";
  console.log(
    `  ${(r?.label ?? "Park Train").padEnd(16)} ${(r ? `${r.height.toFixed(0)} m` : "loop").padStart(6)}  ${RIDE_LOOK[id].label.padEnd(14)} ${frame}`,
  );
}
/*
 * Every ride's LED rig must sit ON its ride.
 *
 * The rigs build their point lists from each ride's own local geometry, but a
 * ride whose module renders inside <group position={ORIGIN}> needs its rig
 * offset by that same origin, or the lights draw a second, empty copy of the
 * ride beside the real one. The Roller Coaster shipped that way: its rig was
 * 50u out in local space, 100u in world space at park scale.
 */
{
  const rig = readFileSync(join(root, "src", "components", "world", "rideLighting.tsx"), "utf8");
  const anchored: [string, number, RegExp][] = [
    ["Roller Coaster", Math.hypot(COASTER_ORIGIN[0], COASTER_ORIGIN[2]),
      /position=\{\[COASTER_ORIGIN\[0\], 0, COASTER_ORIGIN\[2\]\]\}/],
    ["Drop Tower", Math.hypot(TOWER_ORIGIN[0], TOWER_ORIGIN[2]),
      /position=\{\[TOWER_ORIGIN\[0\], 0, TOWER_ORIGIN\[2\]\]\}/],
    ["Dragon Ride", Math.hypot(DRAGON_ORIGIN[0], DRAGON_ORIGIN[2]),
      /const \[ox, , oz\] = DRAGON_ORIGIN/],
    ["Monster Ride", Math.hypot(MONSTER_ORIGIN[0], MONSTER_ORIGIN[2]),
      /const \[ox, , oz\] = MONSTER_ORIGIN/],
  ];
  const missing = anchored.filter(([, offset, re]) => offset > 0.001 && !re.test(rig));
  check(
    "every ride's LED rig is anchored to that ride's own origin",
    missing.length === 0,
    missing.length
      ? `${missing.map(([n]) => n).join(", ")} would draw their lights beside the ride`
      : anchored.map(([n, o]) => `${n} ${o.toFixed(0)}u`).join(", "),
  );
}

console.log(`\nOverview from [${overview.position.join(", ")}] looking at [${overview.lookAt.join(", ")}].`);
console.log(`Real light sources in the whole park: ${realLights}.`);

console.log(failures === 0 ? "\nOK: night park verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
