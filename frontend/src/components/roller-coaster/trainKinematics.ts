import { Matrix4, Quaternion, Vector3 } from "three";
import { TRACK_SEGMENTS } from "./constants";
import { TRACK_CURVE, TRACK_FRAMES } from "./trackCurve";

/** How far the car body sits above the spine so its wheels grip the rails. */
export const CAR_RIDE_HEIGHT = 0.46;

export interface CarTransform {
  position: Vector3;
  quaternion: Quaternion;
  /** World direction the car's nose points — must track the curve tangent. */
  forward: Vector3;
  /** World "up" of the car; inverts through the loop. */
  up: Vector3;
}

export function createCarTransform(): CarTransform {
  return {
    position: new Vector3(),
    quaternion: new Quaternion(),
    forward: new Vector3(),
    up: new Vector3(),
  };
}

const _matrix = new Matrix4();
const _binormal = new Vector3();

function wrap01(u: number): number {
  return ((u % 1) + 1) % 1;
}

/**
 * Interpolates the track's rotation-minimizing frame at an arbitrary u and
 * builds the car's full transform from it.
 *
 * Orientation is derived entirely from the curve tangent (plus the frame's
 * normal for roll) — never from hard-coded rotation values. That is what makes
 * the train pitch up on climbs, pitch down on drops, yaw through turns, and
 * roll through banked sections and the inversion.
 *
 * The car's local forward axis is +Z, matching Car.tsx's nose placement.
 */
export function carTransform(u: number, out: CarTransform = createCarTransform()): CarTransform {
  const f = wrap01(u);
  const raw = f * TRACK_SEGMENTS;
  const i0 = Math.floor(raw) % TRACK_SEGMENTS;
  const i1 = (i0 + 1) % TRACK_SEGMENTS;
  const t = raw - Math.floor(raw);

  out.forward
    .copy(TRACK_FRAMES.tangents[i0])
    .lerp(TRACK_FRAMES.tangents[i1], t)
    .normalize();
  out.up.copy(TRACK_FRAMES.normals[i0]).lerp(TRACK_FRAMES.normals[i1], t).normalize();

  // Re-orthogonalize: lerping two unit vectors does not preserve orthogonality.
  _binormal.crossVectors(out.up, out.forward).normalize();
  out.up.crossVectors(out.forward, _binormal).normalize();

  TRACK_CURVE.getPointAt(f, out.position);
  out.position.addScaledVector(out.up, CAR_RIDE_HEIGHT);

  // Local axes: x = across track, y = car up, z = direction of travel.
  _matrix.makeBasis(_binormal, out.up, out.forward);
  out.quaternion.setFromRotationMatrix(_matrix);

  return out;
}
