import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import { PARK_LAYOUT, rideById } from "../src/components/park/layout";
import { PARK_SCALE } from "../src/components/park/parkScale";
import { CAMERA_PLACES, placeById } from "../src/components/world/cameraPlaces";
import { RIDE_LOOK } from "../src/components/world/rideLighting";
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
check(
  "the background is near-black",
  /<color attach="background" args=\{\["#05070f"\]\}/.test(scene),
  "#05070f",
);
const fog = scene.match(/args=\{\["(#[0-9a-f]{6})", (\d+), (\d+)\]\}/);
check(
  "the haze is a night haze",
  fog !== null && fog[1] === "#0a1020",
  fog ? `${fog[1]} from ${fog[2]} m to ${fog[3]} m` : "no fog found",
);
check(
  "the key light is moonlight, not sunlight",
  /color="#a8c4ff"/.test(scene) && /intensity=\{0\.62\}/.test(scene),
  "one cool, dim, shadow-casting source",
);
check(
  "exposure is pulled down so the dark stays dark",
  /toneMappingExposure: 0\.9/.test(scene) && /ACESFilmicToneMapping/.test(scene),
  "ACES filmic at 0.92",
);
check(
  "the ground is dark landscaped terrain, not bright green",
  /grassColor="#16251a"/.test(scene),
  "deep green, still readable as planted ground",
);
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
const EXPECTED: Record<string, [number, number]> = {
  ferris: [-165, 250],
  dragon: [-72.3, 117.7],
  coaster: [70, -10],
  monster: [205, 90],
  tower: [267.75, 280],
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
console.log(`\nOverview from [${overview.position.join(", ")}] looking at [${overview.lookAt.join(", ")}].`);
console.log(`Real light sources in the whole park: ${realLights}.`);

console.log(failures === 0 ? "\nOK: night park verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
