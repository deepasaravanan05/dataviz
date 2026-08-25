import { Quaternion, Vector3 } from "three";

const UP = new Vector3(0, 1, 0);

export interface Strut {
  key: string;
  position: [number, number, number];
  quaternion: Quaternion;
  length: number;
}

/**
 * A structural beam spanning two points, returned as the position, orientation
 * and length a unit-Y cylinder needs to bridge them. Every beam in the ride's
 * frame is built this way, so joints always meet exactly at their end points
 * and nothing floats.
 */
export function strut(key: string, from: [number, number, number], to: [number, number, number]): Strut {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dir = new Vector3().subVectors(b, a);
  return {
    key,
    position: new Vector3().addVectors(a, b).multiplyScalar(0.5).toArray() as [number, number, number],
    quaternion: new Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
    length: dir.length(),
  };
}

/** Linear interpolation between two points, used to place bracing along a leg. */
export function lerpPoint(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
