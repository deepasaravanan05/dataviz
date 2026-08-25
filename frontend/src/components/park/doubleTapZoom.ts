import { Vector3 } from "three";

/**
 * The maths behind double-tap-to-zoom, kept separate from the React glue so it
 * can be swept and proved rather than only clicked at.
 *
 * A double tap pulls the camera halfway in toward whatever was tapped, keeping
 * the same viewing direction so the view never swings unexpectedly. Once the
 * camera is as close as the controls allow, the next double tap returns to the
 * page's own framing — so the gesture is a complete cycle you can always get
 * out of, not a one-way trip.
 */

export interface ZoomState {
  position: Vector3;
  target: Vector3;
}

export interface ZoomOptions {
  minDistance: number;
  maxDistance: number;
  /** Fraction of the current distance to keep. 0.5 = halve the distance. */
  factor: number;
  /** The page's own default framing, returned to when already fully zoomed in. */
  home: ZoomState;
}

/** How close to minDistance counts as "fully zoomed in". */
export const RESET_THRESHOLD = 1.25;

/** Seconds the camera takes to fly to the new framing. */
export const ZOOM_DURATION = 0.45;

/** Quintic smoothstep: starts and ends at rest, so the fly-in has no jolt. */
export function easeInOut(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Where the camera should end up after one double tap.
 *
 * `hit` is the world point under the tap, or null when the tap landed on empty
 * sky — in which case the framing centre is left alone and the camera simply
 * moves closer to what it was already looking at.
 */
export function zoomStep(
  cameraPosition: Vector3,
  currentTarget: Vector3,
  hit: Vector3 | null,
  opts: ZoomOptions,
): ZoomState {
  const distance = cameraPosition.distanceTo(currentTarget);

  // Already as close as the controls allow: the next tap frames the whole park.
  if (distance <= opts.minDistance * RESET_THRESHOLD) {
    return { position: opts.home.position.clone(), target: opts.home.target.clone() };
  }

  const target = (hit ?? currentTarget).clone();

  const nextDistance = Math.min(
    Math.max(distance * opts.factor, opts.minDistance),
    opts.maxDistance,
  );

  // Keep the current viewing direction. If the tap landed almost exactly under
  // the camera, fall back to the direction of the existing target so the
  // result is never degenerate.
  let direction = new Vector3().subVectors(cameraPosition, target);
  if (direction.lengthSq() < 1e-6) {
    direction = new Vector3().subVectors(cameraPosition, currentTarget);
  }
  if (direction.lengthSq() < 1e-6) {
    direction = new Vector3(0, 1, 1);
  }
  direction.normalize();

  return {
    position: new Vector3().copy(target).addScaledVector(direction, nextDistance),
    target,
  };
}

/** Tap-recognition thresholds, shared by the component and its tests. */
export const TAP_MAX_MOVE_PX = 12;
export const TAP_MAX_DURATION_MS = 300;
export const DOUBLE_TAP_MAX_GAP_MS = 320;
export const DOUBLE_TAP_MAX_DISTANCE_PX = 40;

/** True when a second tap counts as a double tap on the first. */
export function isDoubleTap(
  first: { x: number; y: number; time: number } | null,
  second: { x: number; y: number; time: number },
): boolean {
  if (!first) return false;
  if (second.time - first.time > DOUBLE_TAP_MAX_GAP_MS) return false;
  return Math.hypot(second.x - first.x, second.y - first.y) <= DOUBLE_TAP_MAX_DISTANCE_PX;
}
