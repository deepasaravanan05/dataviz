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
 * and length a unit-Y cylinder needs to bridge them exactly.
 *
 * Kept local to this ride rather than imported from another attraction's
 * folder, so the Drop Tower stays self-contained and no existing ride gains a
 * new dependency.
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
