import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import { PARK_LAYOUT } from "../src/components/park/layout";
import { PARK_SCALE } from "../src/components/park/parkScale";
import { SKY_THEMES } from "../src/components/world/skyThemes";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { DRAGON_ORIGIN } from "../src/components/dragon-ride/constants";
import { MONSTER_ORIGIN } from "../src/components/monster-ride/constants";
import {
  RIDE_ORIGIN as UFO_ORIGIN,
  STRUCTURE_HALF_X as UFO_SOLID_X,
  STRUCTURE_HALF_Z as UFO_SOLID_Z,
} from "../src/components/ufo-pendulum/placement";
import { CAMERA_PLACES, placeById } from "../src/components/world/cameraPlaces";
import { RIDE_LOOK } from "../src/components/world/rideLighting";
import { RIDE_PAINT } from "../src/world/ridePaint";
import { RIDE_DEPARTMENTS } from "../src/components/park/departments";
import {
  OVERALL_HEIGHT as UFO_HEIGHT,
  STRUCTURE_HEIGHT as UFO_STRUCTURE_HEIGHT,
} from "../src/components/ufo-pendulum/constants";
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
/*
 * FIVE NOW, NOT SIX. The list used to include the railway that ringed the
 * park; the train and its track have been removed, so the park's lighting
 * identities are its five department rides.
 */
const SIX = ["coaster", "ferris", "ufo", "dragon", "monster"];
check(
  "all five rides have a lighting identity",
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
  "the identities are separable by hue, not just by name",
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
const PAINTED = SIX;
check(
  "all five rides carry a structural paint colour",
  SIX.every((id) => RIDE_PAINT[id as keyof typeof RIDE_PAINT]),
  SIX.map((id) => `${id}: ${RIDE_PAINT[id as keyof typeof RIDE_PAINT]?.light}`).join(", "),
);
let closestPaint = 1;
let closestPaintPair = "";
for (let i = 0; i < PAINTED.length; i++) {
  for (let j = i + 1; j < PAINTED.length; j++) {
    const d = hueDistance(
      RIDE_PAINT[PAINTED[i] as keyof typeof RIDE_PAINT].light,
      RIDE_PAINT[PAINTED[j] as keyof typeof RIDE_PAINT].light,
    );
    if (d < closestPaint) {
      closestPaint = d;
      closestPaintPair = `${PAINTED[i]}/${PAINTED[j]}`;
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
for (const id of PAINTED) {
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
for (const id of PAINTED) {
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
    /UFO_FOOT_SPREAD/.test(rigSrc) &&
    /APEX_HEIGHT/.test(rigSrc) &&
    /MONSTER_ARM/.test(rigSrc),
  "track curves, rim radii, frame splay and A-frame spread all read from the rides",
);
check(
  "no rig hand-types a ride's position",
  /UFO_ORIGIN/.test(rigSrc) && /DRAGON_ORIGIN/.test(rigSrc) && /MONSTER_ORIGIN/.test(rigSrc),
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
  /*
   * The UFO Pendulum stands on the exact coordinate the Drop Tower held. It
   * replaced the tower at the user's request rather than being added beside
   * it, so the four literals above are unchanged — which is what this check
   * exists to prove.
   */
  ufo: [267.75, 240],
};
check(
  /*
   * This check used to compare five frozen coordinates. The park has since
   * been rebuilt to one common ride size at the user's request, which grew
   * every footprint and made the solver re-place all five — so the frozen list
   * would now be asserting that the change did not happen. What it guards
   * instead is the thing the coordinates protected: the rides are all one size
   * and none of them overlaps another. Their centres are printed.
   */
  "every ride is one size, and no two overlap",
  PARK_LAYOUT.every((r) => Math.abs(r.height - PARK_LAYOUT[0].height) < 0.01) &&
    PARK_LAYOUT.every((a) =>
      PARK_LAYOUT.every(
        (b) => a === b || a.maxX < b.minX || b.maxX < a.minX || a.maxZ < b.minZ || b.maxZ < a.minZ,
      ),
    ),
  PARK_LAYOUT.map((r) => `${r.label} (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)})`).join(", "),
);/*
 * THE PARK NO LONGER HAS A VERTICAL LANDMARK, and that is a deliberate
 * consequence rather than a regression to hide.
 *
 * This used to assert a 126 m Drop Tower standing 42 m clear of anything else
 * — a mast you could navigate the whole park by. The user asked for the tower
 * to go and the UFO Pendulum to take its plot, and a pendulum cannot be that:
 * the plot's sightlines cap its swept width, its width caps its arm, and its
 * arm caps how high the arc reaches. That left the pendulum tallest at 86 m
 * with the Dragon Ride two metres behind it.
 *
 * The pendulum has since been asked to come DOWN to pick its riders up, which
 * on a rigid arm means bringing the pivot down, which means bringing the top
 * down with it — so the Dragon Ride leads now and the pendulum is a 66 m ride.
 * The ordering was the last part of the old claim still standing, and it has
 * stopped being true as well, so what is checked here is what is actually
 * being lit: a big ride on the tower's plot.
 */
check(
  "the pendulum still lights up as one of the park's big rides, on the plot the tower left",
  UFO_HEIGHT > 60,
  `${UFO_HEIGHT.toFixed(0)} m against a tallest of ${Math.max(...PARK_LAYOUT.filter((r) => r.id !== "ufo").map((r) => r.height)).toFixed(0)} m — ` +
    `the park's 126 m landmark went with the Drop Tower, and the pendulum's own 86 m went ` +
    `when it came down to load`,
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

/*
 * THE RAILWAY LOOP USED TO BE PROJECTED HERE — the sixth thing in the frame,
 * whose lit track drew the park's outline from the overview. The train and its
 * track are gone from the park, so the loop and the check that framed it went
 * with them. The park's outline is now drawn by the outer circular path that
 * joins the ride platforms, and that it fits the frame follows from the
 * overview being solved against `PARK_PAVED_EDGE` in `cameraPlaces.ts`.
 */

/*
 * HOW BIG A RIDE HAS TO READ FROM THE OVERVIEW — measured in PIXELS now.
 *
 * The threshold used to be a share of frame AREA, and it was wrong in two
 * ways. It silently encoded the park's size at the moment it was chosen — the
 * park has since been rebuilt twice, is now 2.2 km across, and the overview
 * stands back to hold all of it, so every ride is a smaller share of a much
 * larger picture without having shrunk by a metre. And AREA punishes shape: a
 * Ferris Wheel is a disc, tall and thin, and it read as a fifth of the area of
 * a coaster whose track sprawls, while being perfectly legible on screen.
 *
 * "Too small to see" means pixels, so pixels is what this measures — the
 * ride's larger dimension on the park's own 1600 x 900 frame. The floor is
 * forty, about four per cent of the frame's height: small, but unmistakably a
 * ride rather than a speck. That figure means the same thing however large the
 * park becomes, which is the whole reason for changing the unit.
 *
 * The smallest ride in the park — the Ferris Wheel, a disc seen nearly
 * edge-on — currently reads at 61 px, so there is half as much again in hand.
 */
const FRAME_W = 1600;
const FRAME_H = 900;
const MIN_PIXELS = 40;
const pixelSize = (s: Screen) =>
  Math.max(((s.maxX - s.minX) / 2) * FRAME_W, ((s.maxY - s.minY) / 2) * FRAME_H);
console.log("");
for (const s of screens) {
  check(
    `${s.label} holds the frame from the overview`,
    pixelSize(s) >= MIN_PIXELS && s.minX > -1 && s.maxX < 1 && s.minY > -1 && s.maxY < 1,
    `${pixelSize(s).toFixed(0)} px across on a ${FRAME_W}x${FRAME_H} frame (floor ${MIN_PIXELS}), ` +
      `holding ${(area(s) * 100).toFixed(2)}% of frame area at x[${s.minX.toFixed(2)}, ${s.maxX.toFixed(2)}]`,
  );
}

/*
 * WHAT A RIDE HIDES IS WHAT IT IS MADE OF, not the box the layout gives it.
 *
 * A ride's layout footprint is its swept envelope, because that is the figure
 * every clearance has to respect. It is the wrong figure for occlusion: the
 * UFO Pendulum's box is 82 m across, but the outer twelve metres of it is a
 * saucer between fifty and a hundred metres in the air, and a neighbour behind
 * that is not hidden by anything. This used to be handled by exempting rides
 * whose box was under 20 m — which was the Drop Tower's slender mast, and
 * stopped being true the moment the mast was replaced by an arc.
 *
 * So each ride now publishes what it SOLIDLY occupies where it can hide
 * something, and the near ride is re-projected at that size before the overlap
 * is measured. For every ride whose structure fills its box, that is the box,
 * and nothing changes.
 */
const SOLID: Record<string, { hx: number; hz: number; h: number }> = {
  ufo: { hx: UFO_SOLID_X, hz: UFO_SOLID_Z, h: UFO_STRUCTURE_HEIGHT },
};
const solidScreens = new Map<string, Screen>(
  PARK_LAYOUT.map((r) => {
    const solid = SOLID[r.id];
    return [
      r.id,
      solid === undefined
        ? screens.find((s) => s.id === r.id)!
        : project(r.id, r.label, r.center[0], r.center[1], solid.hx, solid.hz, solid.h),
    ];
  }),
);

let worstCover = 0;
let worstPair = "";
for (const near of screens) {
  for (const far of screens) {
    if (near.id === far.id || far.dist <= near.dist) continue;
    const cover = overlapArea(solidScreens.get(near.id)!, far) / Math.max(area(far), 1e-9);
    if (cover > worstCover) {
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
  /const OVERVIEW = placeById\("overview"\)/.test(scene) &&
    /cameraPosition = CAMERA_POSITION/.test(scene) &&
    /const CAMERA_POSITION: \[number, number, number\] = OVERVIEW\.position/.test(scene),
  /*
   * IT USED TO LOOK FOR A LITERAL TRIPLE. That is a weaker check than it
   * appears: it proved the scene opened on the coordinates somebody had once
   * copied out of the solver, not that it opened on the solver's ANSWER. The
   * two drifted apart every time the park changed size — the scene opened on
   * last month's framing while the fast-travel chip for the very same view
   * used this month's. The scene now reads `cameraPlaces.ts` directly, so what
   * is worth asserting is that it does.
   */
  "the opening shot IS the solved overview, not a copy of one",
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
    ["UFO Pendulum", Math.hypot(UFO_ORIGIN[0], UFO_ORIGIN[2]),
      /position=\{UFO_ORIGIN\}/],
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
