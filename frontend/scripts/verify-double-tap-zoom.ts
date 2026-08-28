import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Vector3 } from "three";
import {
  DOUBLE_TAP_MAX_DISTANCE_PX,
  DOUBLE_TAP_MAX_GAP_MS,
  RESET_THRESHOLD,
  TAP_MAX_DURATION_MS,
  TAP_MAX_MOVE_PX,
  ZOOM_DURATION,
  easeInOut,
  isDoubleTap,
  zoomStep,
  type ZoomState,
} from "../src/components/park/doubleTapZoom";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const MIN = 30;
const MAX = 2200;
const FACTOR = 0.5;
const HOME: ZoomState = {
  position: new Vector3(70, 330, 980),
  target: new Vector3(55, 40, 250),
};
const opts = { minDistance: MIN, maxDistance: MAX, factor: FACTOR, home: HOME };

// ============ 1. A double tap actually zooms in ============
{
  const cam = HOME.position.clone();
  const tgt = HOME.target.clone();
  const before = cam.distanceTo(tgt);
  const hit = new Vector3(-165, 25, 250); // the Ferris Wheel
  const next = zoomStep(cam, tgt, hit, opts);
  const after = next.position.distanceTo(next.target);

  check("double tap moves the camera closer", after < before, `${before.toFixed(0)}u -> ${after.toFixed(0)}u`);
  check(
    "the distance halves, as configured",
    Math.abs(after - before * FACTOR) < 1e-6,
    `factor ${FACTOR} applied exactly`,
  );
  check(
    "the tapped point becomes the new centre of the view",
    next.target.distanceTo(hit) < 1e-9,
    `target moved to (${hit.x}, ${hit.z})`,
  );
}

// ============ 2. The view direction is preserved (no lurch) ============
{
  const cam = new Vector3(70, 330, 980);
  const tgt = new Vector3(55, 40, 250);
  const hit = new Vector3(205, 20, 90);
  const next = zoomStep(cam, tgt, hit, opts);

  const before = new Vector3().subVectors(cam, hit).normalize();
  const after = new Vector3().subVectors(next.position, next.target).normalize();
  check(
    "the camera approaches along its existing sightline to the tapped point",
    before.dot(after) > 0.9999,
    `direction unchanged (dot ${before.dot(after).toFixed(6)})`,
  );
}

// ============ 3. Repeated taps converge on the limit, never past it ============
{
  let state: ZoomState = { position: HOME.position.clone(), target: HOME.target.clone() };
  const hit = new Vector3(70, 20, -10);
  const distances: number[] = [state.position.distanceTo(state.target)];

  for (let i = 0; i < 12; i++) {
    state = zoomStep(state.position, state.target, hit, opts);
    const d = state.position.distanceTo(state.target);
    // Stop before the reset kicks in, so this leg only tests the zoom-in path.
    if (d <= MIN * RESET_THRESHOLD) {
      distances.push(d);
      break;
    }
    distances.push(d);
  }

  check(
    "every tap gets closer, monotonically",
    distances.every((d, i) => i === 0 || d < distances[i - 1]),
    distances.map((d) => d.toFixed(0)).join(" -> "),
  );
  check(
    "never closer than the controls' minimum distance",
    distances.every((d) => d >= MIN - 1e-9),
    `floor ${MIN}u, closest reached ${Math.min(...distances).toFixed(1)}u`,
  );
  check(
    "reaching the limit takes a handful of taps, not one jump",
    distances.length >= 4,
    `${distances.length - 1} taps from the overview to fully zoomed in`,
  );
}

// ============ 4. Fully zoomed in, the next tap pulls back out ============
{
  const target = new Vector3(70, 10, -10);
  const position = new Vector3(70, 10 + MIN * 0.6, -10 + MIN * 0.8); // exactly MIN away
  check(
    "the test camera really is at the minimum distance",
    Math.abs(position.distanceTo(target) - MIN) < 1e-6,
    `${position.distanceTo(target).toFixed(2)}u`,
  );

  const next = zoomStep(position, target, new Vector3(0, 0, 0), opts);
  check(
    "a further double tap returns to the page's own framing",
    next.position.distanceTo(HOME.position) < 1e-9 && next.target.distanceTo(HOME.target) < 1e-9,
    "camera and target both restored to home",
  );
  check(
    "the reset ignores whatever was under the finger",
    next.target.distanceTo(HOME.target) < 1e-9,
    "zooming out always frames the whole park",
  );
}

// ============ 5. Tapping empty sky still works ============
{
  const cam = HOME.position.clone();
  const tgt = HOME.target.clone();
  const before = cam.distanceTo(tgt);
  const next = zoomStep(cam, tgt, null, opts);

  check(
    "tapping the sky keeps the current centre and just moves closer",
    next.target.distanceTo(tgt) < 1e-9 && next.position.distanceTo(next.target) < before,
    `target unchanged, ${before.toFixed(0)}u -> ${next.position.distanceTo(next.target).toFixed(0)}u`,
  );
}

// ============ 6. Degenerate input cannot produce NaN ============
{
  const p = new Vector3(10, 10, 10);
  const next = zoomStep(p, p.clone(), p.clone(), opts);
  const finite = [next.position, next.target].every(
    (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z),
  );
  check("a tap exactly under the camera does not break the maths", finite, "no NaN produced");
}

// ============ 7. The fly-in is smooth ============
{
  check("easing starts at rest", Math.abs(easeInOut(0)) < 1e-9, "e(0) = 0");
  check("easing ends at rest", Math.abs(easeInOut(1) - 1) < 1e-9, "e(1) = 1");
  check(
    "easing is monotonic — the camera never backs up mid-flight",
    Array.from({ length: 200 }, (_, i) => easeInOut(i / 199)).every((v, i, a) => i === 0 || v >= a[i - 1]),
    "sampled over the whole flight",
  );

  let maxStep = 0;
  for (let i = 0; i < 200; i++) {
    maxStep = Math.max(maxStep, Math.abs(easeInOut((i + 1) / 200) - easeInOut(i / 200)));
  }
  const frames = ZOOM_DURATION * 60;
  check(
    "the flight is unhurried enough to read",
    ZOOM_DURATION >= 0.25 && ZOOM_DURATION <= 1.0 && frames > 15,
    `${ZOOM_DURATION}s (~${frames.toFixed(0)} frames at 60fps)`,
  );
  check("easing is clamped outside [0,1]", easeInOut(-5) === 0 && easeInOut(5) === 1, "no overshoot");
}

// ============ 8. Tap recognition rejects drags and slow taps ============
{
  const first = { x: 100, y: 100, time: 1000 };
  check(
    "two quick taps in the same spot count as a double tap",
    isDoubleTap(first, { x: 104, y: 98, time: 1150 }),
    `${DOUBLE_TAP_MAX_GAP_MS}ms / ${DOUBLE_TAP_MAX_DISTANCE_PX}px window`,
  );
  check(
    "a slow second tap does not",
    !isDoubleTap(first, { x: 100, y: 100, time: 1000 + DOUBLE_TAP_MAX_GAP_MS + 1 }),
    "gap too long",
  );
  check(
    "a second tap far away does not",
    !isDoubleTap(first, { x: 100 + DOUBLE_TAP_MAX_DISTANCE_PX + 5, y: 100, time: 1100 }),
    "too far apart",
  );
  check("the very first tap is never a double tap", !isDoubleTap(null, first), "nothing to pair with");
}

// ============ 9. Wired in without disturbing the existing controls ============
const glue = readFileSync(
  join(__dirname, "..", "src", "components", "park", "DoubleTapZoom.tsx"),
  "utf8",
);
check(
  "drags are rejected, so orbiting still works",
  new RegExp(`moved > TAP_MAX_MOVE_PX`).test(glue) && TAP_MAX_MOVE_PX > 0,
  `a tap that moves more than ${TAP_MAX_MOVE_PX}px is treated as an orbit drag`,
);
check(
  "long presses are rejected",
  /now - down\.time > TAP_MAX_DURATION_MS/.test(glue) && TAP_MAX_DURATION_MS > 0,
  `a press longer than ${TAP_MAX_DURATION_MS}ms is not a tap`,
);
check(
  "the browser's own double-tap page zoom is suppressed",
  /addEventListener\("dblclick"/.test(glue) &&
    /function onDoubleClick[\s\S]*?preventDefault/.test(glue) &&
    true,
  "double-click default prevented",
);
check(
  "the hook never mutates anything it does not own",
  !/el\.style\./.test(glue),
  "touch-action is set declaratively on the Canvas, not imperatively here",
);
check(
  "the sky dome is excluded from picking",
  /ShaderMaterial/.test(glue) && /20000/.test(glue),
  "tapping sky reads as empty, not as a hit 450,000u away",
);
check(
  "it drives the existing OrbitControls rather than replacing them",
  /useThree\(\(s\) => s\.controls\)/.test(glue) && !/<OrbitControls/.test(glue),
  "pinch, orbit and pan are untouched",
);
check(
  "controls are handed back after the flight",
  /Controls\.enabled = false/.test(glue) && /Controls\.enabled = true/.test(glue),
  "no chance of leaving the camera locked",
);
check(
  "the camera and controls are driven through refs, not render bindings",
  /cameraRef/.test(glue) && /controlsRef/.test(glue),
  "matches the animation pattern the rides already use",
);

/* The Phase-1 proof-of-concept scene (src/components/3d/) has been removed —
   the journey layer in ParkScene is the employee simulation now. */
for (const [file, label] of [
  ["src/components/roller-coaster/ParkScene.tsx", "the main park"],
] as const) {
  const text = readFileSync(join(__dirname, "..", file), "utf8");
  check(
    `enabled in ${label}`,
    /<DoubleTapZoom \/>/.test(text) && /OrbitControls/.test(text),
    "sits alongside the scene's existing controls",
  );
  check(
    `${label}: browser page-zoom on double tap is disabled`,
    /touchAction: "none"/.test(text),
    "canvas sets touch-action: none",
  );
}

// ============ Summary ============
console.log(
  `\nDouble tap: halve the distance toward the tapped point over ${ZOOM_DURATION}s, ` +
    `down to a ${MIN}u floor; tap again at the floor to return to the page's framing.`,
);
console.log(
  `Recognition: <=${TAP_MAX_MOVE_PX}px movement, <=${TAP_MAX_DURATION_MS}ms press, ` +
    `two taps within ${DOUBLE_TAP_MAX_GAP_MS}ms and ${DOUBLE_TAP_MAX_DISTANCE_PX}px.`,
);

console.log(failures === 0 ? "\nOK: double-tap zoom verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
