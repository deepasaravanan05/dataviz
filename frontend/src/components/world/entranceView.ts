import { GATE_X, GATE_Z } from "@/simulation/journey/constants";

/**
 * The framing of the landing page: what a visitor sees before they touch
 * anything.
 *
 * THE COMPOSITION. Standing back from the gate on its axis with a long lens.
 * The rides cannot grow — the park's sightline rule caps them at their current
 * size — so the framing is what puts them at the size the reference art shows.
 * At 95u back the gate and the Ferris Wheel hold the gate-to-ride proportion
 * the reference has, and the 30deg lens fills the frame with both.
 *
 * WHY THE LOOK-AT IS BELOW THE CAMERA, AND WHY THAT MATTERS.
 *
 * This view used to aim at y=22 — ABOVE the camera's own y=14 — which had two
 * consequences, both bad and neither obvious from reading the numbers:
 *
 *   1. `OrbitControls` clamps the polar angle to `maxPolarAngle` (PI/2.05).
 *      A camera below its target is past 90deg, so the controls silently
 *      lifted the camera from y=14 to roughly y=37 on the first frame. The
 *      carefully composed height was never actually used.
 *   2. Aiming upward pushed the ground out of the bottom of the frame. An
 *      employee walking through the gate 95u away projected to about y=-1.95
 *      in normalised device coordinates — a full frame-height BELOW the
 *      viewport. The park rendered, the rides rendered, the thirty people
 *      rendered, and not one of them was on screen. The page looked like an
 *      empty park, which is exactly what it was reported as.
 *
 * So the look-at now sits BELOW the camera. That keeps the polar angle inside
 * the clamp (so the composed height survives), tilts the view down onto the
 * arrival road and the gate, and puts the walking employees in the lower third
 * of the frame where the story actually happens. `verify-legibility` re-derives
 * the projection and fails if the cast ever leaves the frame again.
 */
export const ENTRANCE_FOV = 30;

export const ENTRANCE_CAMERA_POSITION: [number, number, number] = [GATE_X, 14, GATE_Z + 95];

/**
 * Aimed at the paving just inside the gate.
 *
 * The DEPTH of this point matters as much as its height. `maxPolarAngle` is
 * PI/2.05, which is 2.2deg above the target's horizon, so the camera has to
 * clear the target by more than `horizontalDistance * tan(2.2deg)` or the
 * controls lift it anyway. Aiming 300u downrange demanded a 15u rise the
 * composition does not have; aiming 60u past the gate needs only 6u, and the
 * 12u this view actually has clears it comfortably.
 *
 * The result is a 4.4deg downward tilt: the arrival road, the turnstiles and
 * the employees walking through them sit in the lower half of the frame, while
 * the rides and the sunset still fill the upper half exactly as before.
 */
export const ENTRANCE_CAMERA_TARGET: [number, number, number] = [GATE_X, 2, GATE_Z - 60];
