import {
  ARM_COUNT,
  ARM_LENGTH,
  HUB_SPIN,
  MONSTER_ORIGIN,
  SPIDER_SPIN,
  UNDULATION_CENTER_TILT,
  UNDULATION_RATE,
  UNDULATION_SWING,
} from "../src/components/monster-ride/constants";
import {
  cartBottomWorldY,
  clampTiltForGroundClearance,
  MIN_GROUND_CLEARANCE,
  terrainHeightAt,
} from "../src/components/monster-ride/groundClearance";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

/**
 * Re-derives the exact per-frame tilt computed in MonsterRide.tsx's
 * useFrame — including the ground-clearance clamp — for a given arm index,
 * rotor spin angle, and elapsed time. Deliberately duplicated (not imported)
 * since the real logic lives inline in a closure; this pins its behaviour.
 */
function tiltForArm(arm: number, elapsed: number, rotorAngle: number): number {
  const placementAngle = (arm / ARM_COUNT) * Math.PI * 2;
  const rawTilt =
    UNDULATION_CENTER_TILT + Math.sin(elapsed * UNDULATION_RATE + placementAngle) * UNDULATION_SWING;

  const worldAngle = rotorAngle + placementAngle;
  const armWorldX = MONSTER_ORIGIN[0] + Math.cos(worldAngle) * ARM_LENGTH;
  const armWorldZ = MONSTER_ORIGIN[2] + Math.sin(worldAngle) * ARM_LENGTH;
  return clampTiltForGroundClearance(rawTilt, armWorldX, armWorldZ);
}

const DURATION = 60; // seconds of simulated ride time to sweep
const STEPS = 6000;

interface Sample {
  time: number;
  arm: number;
  tilt: number;
  cartY: number;
  groundY: number;
}

const samples: Sample[] = [];
for (let s = 0; s <= STEPS; s++) {
  const t = (s / STEPS) * DURATION;
  const rotorAngle = t * HUB_SPIN;
  for (let arm = 0; arm < ARM_COUNT; arm++) {
    const tilt = tiltForArm(arm, t, rotorAngle);
    const placementAngle = (arm / ARM_COUNT) * Math.PI * 2;
    const worldAngle = rotorAngle + placementAngle;
    const armWorldX = MONSTER_ORIGIN[0] + Math.cos(worldAngle) * ARM_LENGTH;
    const armWorldZ = MONSTER_ORIGIN[2] + Math.sin(worldAngle) * ARM_LENGTH;
    samples.push({
      time: t,
      arm,
      tilt,
      cartY: cartBottomWorldY(tilt),
      groundY: terrainHeightAt(armWorldX, armWorldZ),
    });
  }
}

// ---------- THE core requirement: never below ground + clearance, ever ----------
const minClearanceSeen = Math.min(...samples.map((s) => s.cartY - s.groundY));
check(
  "cart bottom never dips below ground + min clearance, across full cycle",
  minClearanceSeen >= MIN_GROUND_CLEARANCE - 1e-6,
  `worst-case clearance ${minClearanceSeen.toFixed(4)}u (required >= ${MIN_GROUND_CLEARANCE}u), over ${samples.length} samples across ${ARM_COUNT} arms x ${DURATION}s`,
);

const violations = samples.filter((s) => s.cartY - s.groundY < MIN_GROUND_CLEARANCE - 1e-6);
check("zero clearance violations", violations.length === 0, `${violations.length} / ${samples.length} samples violate clearance`);

// ---------- Motion still has the undulating wave character ----------
const tilts0 = samples.filter((s) => s.arm === 0).map((s) => s.tilt);
const swingDeg = ((Math.max(...tilts0) - Math.min(...tilts0)) * 180) / Math.PI;
check("arm still swings through a visible range", swingDeg > 10, `${swingDeg.toFixed(1)} degrees peak-to-peak`);

let bothFound = 0;
const timePoints = Array.from({ length: 100 }, (_, i) => (i / 100) * DURATION);
for (const t of timePoints) {
  const rotorAngle = t * HUB_SPIN;
  const tiltsAtT = Array.from({ length: ARM_COUNT }, (_, arm) => tiltForArm(arm, t, rotorAngle));
  const tiltsAtTplus = Array.from({ length: ARM_COUNT }, (_, arm) =>
    tiltForArm(arm, t + 0.02, rotorAngle + 0.02 * HUB_SPIN),
  );
  const rising = tiltsAtTplus.some((v, i) => v > tiltsAtT[i] + 1e-5);
  const falling = tiltsAtTplus.some((v, i) => v < tiltsAtT[i] - 1e-5);
  if (rising && falling) bothFound++;
}
check("wave: one arm rises while another falls", bothFound > 80, `${bothFound}/100 sampled instants show both`);

// ---------- No sudden jumps: consecutive samples change smoothly ----------
let maxTiltStep = 0;
for (let arm = 0; arm < ARM_COUNT; arm++) {
  const armSamples = samples.filter((s) => s.arm === arm);
  for (let i = 1; i < armSamples.length; i++) {
    maxTiltStep = Math.max(maxTiltStep, Math.abs(armSamples[i].tilt - armSamples[i - 1].tilt));
  }
}
const dt = DURATION / STEPS;
const maxPlausibleStep = (UNDULATION_SWING * UNDULATION_RATE + 0.5) * dt * 3; // generous bound
check("no sudden tilt jumps (smooth, no popping)", maxTiltStep < maxPlausibleStep, `max step ${maxTiltStep.toFixed(5)} rad vs bound ${maxPlausibleStep.toFixed(5)} rad`);

// ---------- Clamp only engages as a safety net, design range already safe ----------
const rawSamples = samples.filter((s) => {
  // Recompute the unclamped raw tilt to see how often the clamp actually bites.
  const placementAngle = (s.arm / ARM_COUNT) * Math.PI * 2;
  const raw = UNDULATION_CENTER_TILT + Math.sin(s.time * UNDULATION_RATE + placementAngle) * UNDULATION_SWING;
  return Math.abs(raw - s.tilt) > 1e-9;
});
check(
  "design range already safe (clamp rarely/never engages)",
  rawSamples.length === 0,
  `clamp engaged on ${rawSamples.length}/${samples.length} samples`,
);

// ---------- Prove the clamp mechanism itself actually works (not just dormant) ----------
const deliberatelyUnsafe = -Math.PI / 4; // -45deg, would bury the cart deep underground
const clamped = clampTiltForGroundClearance(deliberatelyUnsafe, MONSTER_ORIGIN[0] + ARM_LENGTH, MONSTER_ORIGIN[2]);
const clampedCartY = cartBottomWorldY(clamped) - terrainHeightAt(MONSTER_ORIGIN[0] + ARM_LENGTH, MONSTER_ORIGIN[2]);
check(
  "clamp corrects a deliberately unsafe tilt",
  clamped > deliberatelyUnsafe && clampedCartY >= MIN_GROUND_CLEARANCE - 1e-6,
  `raw ${((deliberatelyUnsafe * 180) / Math.PI).toFixed(1)}deg -> clamped ${((clamped * 180) / Math.PI).toFixed(1)}deg, resulting clearance ${clampedCartY.toFixed(3)}u`,
);

check("hub spin rate is nonzero", HUB_SPIN > 0, `${HUB_SPIN} rad/s`);
check("spider spin rate is nonzero", SPIDER_SPIN > 0, `${SPIDER_SPIN} rad/s`);
check("undulation rate is nonzero", UNDULATION_RATE > 0, `${UNDULATION_RATE} rad/s`);

console.log(
  `\nSwept ${DURATION}s x ${ARM_COUNT} arms (${samples.length} samples). ` +
    `Worst-case ground clearance: ${minClearanceSeen.toFixed(3)}u.`,
);
console.log(failures === 0 ? "OK: undulating wave motion verified safe." : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
