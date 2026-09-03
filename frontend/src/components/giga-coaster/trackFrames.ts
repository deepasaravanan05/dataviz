import { Vector3 } from "three";
import { GRAVITY, TRACK_SAMPLES } from "./constants";
import { TRACK_CURVE, TRACK_LENGTH, planRadiusAt, turnSignAt, uAtDistance } from "./trackCurve";
import { speedAtDistance } from "./coasterMotion";

/**
 * THE FRAME AT EVERY POINT OF THE TRACK — and the BANK, which is solved.
 *
 * Everything drawn on this ride needs the same three things at a given point:
 * where the track is, which way it is going, and which way is UP for a train
 * on it. The first two are the curve's; the third is not, and it is the
 * interesting one.
 *
 * A coaster's track is banked into its corners, and how far is not a matter of
 * taste. A train on a curve of radius R at speed v needs `v^2 / R` of lateral
 * acceleration, and the track supplies it by tilting: bank the rails by
 *
 *     theta = atan( (v^2 / R) / g )
 *
 * and the force on the rider is straight down through the seat, which is the
 * whole point of banking a corner. So the bank at every point of this circuit
 * comes from the RADIUS the curve actually has there and the SPEED the energy
 * equation actually gives there. Tight corner, fast train, steep bank; the
 * straights are flat. Nothing is drawn by eye and nothing is animated.
 *
 * WHY NOT FRENET FRAMES, which three will hand out for free: because a Frenet
 * frame is defined by the curve's own curvature, and on a straight it is
 * undefined and rolls wildly. The frame below is built from world up instead,
 * which is stable everywhere, and the bank is then applied on purpose.
 */

export interface TrackFrame {
  /** Where on the track, in metres from the station. */
  distance: number;
  position: Vector3;
  /** Direction of travel. */
  tangent: Vector3;
  /** Up, out of the track, banked. */
  up: Vector3;
  /** Across the track, to the rider's right. */
  right: Vector3;
  /** How far the track is banked here, in radians. */
  bank: number;
  /** The radius of the corner here, in metres. Straights are effectively flat. */
  radius: number;
}

const UP = new Vector3(0, 1, 0);

/**
 * The corner radius at a sample, from three points spread along the track.
 *
 * NOT from the immediate neighbours. The circuit is sampled every half metre,
 * and a circumradius taken across half a metre is dominated by the sampling
 * noise rather than by the corner — measured that way this track came out with
 * one-metre corners and a track banked forty-five degrees on average, which is
 * a spiral staircase and not a roller coaster. Thirteen metres of stencil is
 * long enough to see the corner and short enough not to average two of them
 * together.
 */

/** Every frame on the circuit, solved once. */
export const TRACK_FRAMES: TrackFrame[] = Array.from({ length: TRACK_SAMPLES }, (_, i) => {
  const u = i / TRACK_SAMPLES;
  const distance = (i / TRACK_SAMPLES) * TRACK_LENGTH;
  const position = TRACK_CURVE.getPointAt(u);
  const tangent = TRACK_CURVE.getTangentAt(u).normalize();

  /* A stable frame from world up, so straights do not roll. */
  const right = new Vector3().crossVectors(tangent, UP).normalize();
  if (right.lengthSq() < 1e-9) right.set(1, 0, 0);
  const flatUp = new Vector3().crossVectors(right, tangent).normalize();

  const radius = planRadiusAt(distance);
  const speed = speedAtDistance(distance);
  const lateral = radius === Infinity ? 0 : (speed * speed) / radius;
  const bank = Math.atan2(lateral, GRAVITY) * turnSignAt(i, tangent);

  const up = flatUp.clone().applyAxisAngle(tangent, bank);
  const banked = new Vector3().crossVectors(tangent, up).normalize().negate();

  return { distance, position, tangent, up, right: banked, bank, radius };
});

/** The frame at any distance along the track, interpolated between samples. */
export function frameAtDistance(distance: number): TrackFrame {
  const d = ((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
  const t = (d / TRACK_LENGTH) * TRACK_SAMPLES;
  const i = Math.floor(t) % TRACK_SAMPLES;
  const j = (i + 1) % TRACK_SAMPLES;
  const f = t - Math.floor(t);
  const a = TRACK_FRAMES[i];
  const b = TRACK_FRAMES[j];
  const u = uAtDistance(d);
  return {
    distance: d,
    position: TRACK_CURVE.getPointAt(u),
    tangent: TRACK_CURVE.getTangentAt(u).normalize(),
    up: a.up.clone().lerp(b.up, f).normalize(),
    right: a.right.clone().lerp(b.right, f).normalize(),
    bank: a.bank + (b.bank - a.bank) * f,
    radius: a.radius,
  };
}

/** The steepest the track is banked anywhere on the circuit. */
export const MAX_BANK = Math.max(...TRACK_FRAMES.map((f) => Math.abs(f.bank)));

/**
 * The sideways pull a rider gets, in g, at every point — and the worst of it.
 *
 * This is the number the layout has to be judged on rather than the bank
 * angle: a real coaster corners at two to three g and touches four only for a
 * moment. It comes from the plan radius and the speed the energy equation
 * gives, so it is what this circuit at this size actually does to somebody.
 */
export const LATERAL_GEE = TRACK_FRAMES.map((f) =>
  f.radius === Infinity ? 0 : speedAtDistance(f.distance) ** 2 / f.radius / GRAVITY,
);
export const MAX_LATERAL_GEE = Math.max(...LATERAL_GEE);
