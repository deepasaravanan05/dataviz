import { Vector3 } from "three";
import { TRACK_CURVE, TRACK_LENGTH } from "../src/components/roller-coaster/trackCurve";
import { carTransform, createCarTransform, CAR_RIDE_HEIGHT } from "../src/components/roller-coaster/trainKinematics";
import { CAR_COUNT, CAR_LENGTH, CAR_SPACING } from "../src/components/roller-coaster/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const SAMPLES = 2000;
const t = createCarTransform();

// Collect per-sample kinematics using the REAL production code path.
const rows = Array.from({ length: SAMPLES }, (_, i) => {
  const u = i / SAMPLES;
  carTransform(u, t);
  return {
    u,
    pos: t.position.clone(),
    fwd: t.forward.clone(),
    up: t.up.clone(),
    quat: t.quaternion.clone(),
  };
});

// ---------- Forward must equal the curve tangent (§7, §23) ----------
let maxTangentErr = 0;
for (const r of rows) {
  const tangent = TRACK_CURVE.getTangentAt(r.u).normalize();
  maxTangentErr = Math.max(maxTangentErr, 1 - tangent.dot(r.fwd));
}
check("forward axis follows curve tangent", maxTangentErr < 1e-3, `max angular error ${maxTangentErr.toExponential(2)}`);

// ---------- Pitch: nose up on climbs, nose down on drops (§6, §8, §23) ----------
let climbSamples = 0, climbCorrect = 0, dropSamples = 0, dropCorrect = 0;
for (let i = 0; i < SAMPLES; i++) {
  const a = rows[i];
  const b = rows[(i + 1) % SAMPLES];
  const dy = b.pos.y - a.pos.y;
  if (dy > 0.02) { climbSamples++; if (a.fwd.y > 0) climbCorrect++; }
  if (dy < -0.02) { dropSamples++; if (a.fwd.y < 0) dropCorrect++; }
}
check("nose points UP on every climb", climbSamples > 0 && climbCorrect === climbSamples, `${climbCorrect}/${climbSamples} climbing samples`);
check("nose points DOWN on every drop", dropSamples > 0 && dropCorrect === dropSamples, `${dropCorrect}/${dropSamples} dropping samples`);

const steepestClimb = Math.max(...rows.map((r) => r.fwd.y));
const steepestDrop = Math.min(...rows.map((r) => r.fwd.y));
check("has a steep climb", steepestClimb > 0.5, `max forward.y = ${steepestClimb.toFixed(2)} (${(Math.asin(steepestClimb) * 180 / Math.PI).toFixed(0)}deg)`);
check("has a steep drop", steepestDrop < -0.5, `min forward.y = ${steepestDrop.toFixed(2)} (${(Math.asin(steepestDrop) * 180 / Math.PI).toFixed(0)}deg)`);

// ---------- Yaw: train rotates through horizontal curves (§9) ----------
let maxYawRate = 0;
for (let i = 0; i < SAMPLES; i++) {
  const a = rows[i].fwd, b = rows[(i + 1) % SAMPLES].fwd;
  const ha = new Vector3(a.x, 0, a.z).normalize();
  const hb = new Vector3(b.x, 0, b.z).normalize();
  maxYawRate = Math.max(maxYawRate, ha.angleTo(hb));
}
check("train yaws through horizontal curves", maxYawRate > 0.01, `max yaw step ${(maxYawRate * 180 / Math.PI).toFixed(2)}deg`);

// ---------- Roll / banking + inversion (§24) ----------
const minUpY = Math.min(...rows.map((r) => r.up.y));
check("train inverts through the loop", minUpY < -0.8, `min up.y = ${minUpY.toFixed(2)}`);
const banked = rows.filter((r) => Math.abs(r.up.y) < 0.98 && r.up.y > 0).length;
check("train banks on turns", banked > SAMPLES * 0.1, `${banked}/${SAMPLES} banked samples`);

// ---------- Orthonormal basis: train cannot shear or derail (§22) ----------
let maxOrthoErr = 0, maxLenErr = 0;
for (const r of rows) {
  maxOrthoErr = Math.max(maxOrthoErr, Math.abs(r.fwd.dot(r.up)));
  maxLenErr = Math.max(maxLenErr, Math.abs(r.fwd.length() - 1), Math.abs(r.up.length() - 1));
}
check("orientation basis stays orthonormal", maxOrthoErr < 1e-6 && maxLenErr < 1e-6, `ortho err ${maxOrthoErr.toExponential(2)}, len err ${maxLenErr.toExponential(2)}`);

// ---------- Train stays centred on the track (§22) ----------
let maxOffsetErr = 0;
for (const r of rows) {
  const onCurve = TRACK_CURVE.getPointAt(r.u);
  maxOffsetErr = Math.max(maxOffsetErr, Math.abs(r.pos.distanceTo(onCurve) - CAR_RIDE_HEIGHT));
}
check("cars stay centred on the rail", maxOffsetErr < 1e-6, `max ride-height deviation ${maxOffsetErr.toExponential(2)}`);

// ---------- Motion is smooth, no teleporting (§19) ----------
let maxStep = 0;
for (let i = 0; i < SAMPLES; i++) {
  maxStep = Math.max(maxStep, rows[i].pos.distanceTo(rows[(i + 1) % SAMPLES].pos));
}
const avgStep = TRACK_LENGTH / SAMPLES;
check("motion is smooth (no jumps)", maxStep < avgStep * 3, `max step ${maxStep.toFixed(3)}u vs avg ${avgStep.toFixed(3)}u`);

// ---------- Car spacing consistent, no overlap / no gaps (§21) ----------
const spacingU = CAR_SPACING / TRACK_LENGTH;
const a0 = createCarTransform(), a1 = createCarTransform();
let minGap = Infinity, maxGap = 0;
for (let s = 0; s < 400; s++) {
  const base = s / 400;
  for (let c = 0; c < CAR_COUNT - 1; c++) {
    carTransform(base - c * spacingU, a0);
    carTransform(base - (c + 1) * spacingU, a1);
    const d = a0.position.distanceTo(a1.position);
    minGap = Math.min(minGap, d);
    maxGap = Math.max(maxGap, d);
  }
}
check(
  "cars never overlap",
  minGap > CAR_LENGTH,
  `closest car gap ${minGap.toFixed(2)}u vs car length ${CAR_LENGTH}`,
);
check("cars never drift apart", maxGap < CAR_SPACING * 1.25, `widest car gap ${maxGap.toFixed(2)}u vs spacing ${CAR_SPACING}`);

console.log(failures === 0 ? "\nOK: train follows the 3D track correctly." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
