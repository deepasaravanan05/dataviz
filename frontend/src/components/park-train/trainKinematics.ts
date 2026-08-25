import { Matrix4, Quaternion, Vector3 } from "three";
import { RAIL_Y, WHEEL_RADIUS } from "./constants";
import { TRACK_CURVE } from "./trainTrack";

/** Height of each car's axle line above the ground — wheel bottoms sit exactly on the rail. */
export const CAR_RIDE_HEIGHT = RAIL_Y + WHEEL_RADIUS;

export interface CarTransform {
  position: Vector3;
  quaternion: Quaternion;
}

export function createCarTransform(): CarTransform {
  return { position: new Vector3(), quaternion: new Quaternion() };
}

const _tangent = new Vector3();
const _right = new Vector3();
const _up = new Vector3(0, 1, 0);
const _matrix = new Matrix4();

function wrap01(u: number): number {
  return ((u % 1) + 1) % 1;
}

/**
 * Position and yaw-only orientation for a point on the loop. The track is
 * flat, so the car's forward axis is just the curve tangent projected onto
 * the ground plane — no pitch or roll, unlike the roller coaster. The car's
 * local forward axis is +Z.
 */
export function carTransform(u: number, out: CarTransform = createCarTransform()): CarTransform {
  const f = wrap01(u);

  TRACK_CURVE.getTangentAt(f, _tangent);
  _tangent.y = 0;
  _tangent.normalize();

  _right.crossVectors(_up, _tangent).normalize();
  _matrix.makeBasis(_right, _up, _tangent);
  out.quaternion.setFromRotationMatrix(_matrix);

  TRACK_CURVE.getPointAt(f, out.position);
  out.position.y = CAR_RIDE_HEIGHT;

  return out;
}
