import {
  ARM_LENGTH,
  GRAVITY,
  REVOLUTIONS_PER_CYCLE,
  SPINS_PER_CYCLE,
  TOP_GEE,
} from "./constants";

/**
 * THE ARM GOES ALL THE WAY ROUND, AND IT IS STILL A PENDULUM.
 *
 * The user asked for a machine that runs the full circle rather than swinging
 * back and forth. The obvious way to do that is to sweep the arm at a constant
 * rate, and it is the wrong way: a constant sweep is a metronome, and the whole
 * character of this ride — rushing through the bottom, hanging almost still
 * over the top — is exactly what a constant rate throws away.
 *
 * So it is still solved from energy. Nothing about the physics changed except
 * how much of it the machine has: enough to carry past the top instead of
 * falling back from it.
 *
 * THE EXACT SOLUTION.
 *
 * With theta measured from straight down, a rigid arm of length L turning past
 * the top with angular speed omega_top obeys
 *
 *     omega(theta)^2 = omega_top^2 + (2g/L) * (1 + cos theta)
 *                    = omega_top^2 + (4g/L) * cos^2(theta/2)
 *
 * — the energy equation, written so the half-angle identity does the work. It
 * never vanishes, because omega_top never does: the arm is going somewhere at
 * every instant, which is what makes this a rotation rather than a swing.
 *
 * The time to get anywhere is then dt = dtheta / omega(theta), and the whole
 * revolution has a closed form. Writing cos^2 = 1 - sin^2 and substituting
 * u = theta/2,
 *
 *     T = 4 K(k) / omega_bottom,     k = 2 / sqrt(TOP_GEE + 4)
 *
 * where K is the complete elliptic integral of the first kind. The table below
 * marches the integral by Simpson's rule and `armAngle` inverts it; the closed
 * form is computed INDEPENDENTLY by the arithmetic-geometric mean, so the two
 * cannot agree by sharing a mistake. verify-ufo-pendulum.ts checks that they
 * agree anyway, and that differentiating the solver reproduces the energy
 * equation everywhere.
 *
 * HOW FAST IT RUNS is not chosen here either. `TOP_GEE` in constants.ts says
 * how much centripetal acceleration the riders are given at the top — how
 * firmly they are held in their seats while upside down — and every speed and
 * period on this page follows from it.
 */

/** Angular speed over the very top: the ride's one drive setting, as a rate. */
export const OMEGA_TOP = Math.sqrt((TOP_GEE * GRAVITY) / ARM_LENGTH);

/** The arm's angular speed at any angle from straight down. */
export function armSpeedAt(theta: number): number {
  const half = Math.cos(theta / 2);
  return Math.sqrt(OMEGA_TOP ** 2 + ((4 * GRAVITY) / ARM_LENGTH) * half * half);
}

/** Fastest, at the bottom of the circle. */
export const OMEGA_BOTTOM = armSpeedAt(0);

/** Modulus of the elliptic integral, from the drive setting alone. */
export const REVOLUTION_MODULUS = 2 / Math.sqrt(TOP_GEE + 4);

/**
 * The complete elliptic integral of the first kind, by the AGM.
 *
 * K(k) is the limit of pi / (2 * a_n) where (a, b) are driven to their common
 * arithmetic-geometric mean from (1, sqrt(1 - k^2)). It converges quadratically
 * — a dozen iterations is far past double precision — and it shares no code
 * with the Simpson march below, which is the point: the period this yields is
 * an independent check on the table.
 */
export function completeEllipticK(k: number): number {
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 60; i++) {
    if (Math.abs(a - b) < 1e-16) break;
    const nextA = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = nextA;
  }
  return Math.PI / (2 * a);
}

/** One revolution, in closed form. */
export const REVOLUTION_PERIOD =
  (4 * completeEllipticK(REVOLUTION_MODULUS)) / OMEGA_BOTTOM;

/**
 * The phase table: `TIME[i]` is when the arm reaches angle `i * step`.
 *
 * Evenly spaced in ANGLE, and marched with Simpson's rule. There is no
 * singularity to work around here — the integrand 1 / omega is smooth and
 * bounded everywhere, because the arm never stops — so the plain march that
 * would have been wrong for a swing is exactly right for a rotation.
 */
const SAMPLES = 2048;
const STEP = (Math.PI * 2) / SAMPLES;
const TIME: number[] = new Array(SAMPLES + 1);

{
  const integrand = (theta: number) => 1 / armSpeedAt(theta);
  TIME[0] = 0;
  let total = 0;
  for (let i = 1; i <= SAMPLES; i++) {
    const a = (i - 1) * STEP;
    const b = i * STEP;
    total += ((b - a) / 6) * (integrand(a) + 4 * integrand((a + b) / 2) + integrand(b));
    TIME[i] = total;
  }
}

/** What the march says a revolution takes — compared against K by verify. */
export const REVOLUTION_PERIOD_INTEGRATED = TIME[SAMPLES];

/**
 * The arm's angle from straight down, `t` seconds into the ride.
 *
 * Binary search on the monotone time table, then linear interpolation. The
 * angle only ever increases, so the machine turns one way and keeps turning
 * it; which way that is, is asserted by watching a seat go round in
 * verify-ufo-pendulum.ts rather than by reading the sign here.
 *
 * At t = 0 it is zero — the arm hanging straight down, which is now the pose
 * the ride LOADS in: the saucer is at the bottom of its circle, beside the
 * boarding deck, and the seats are where an employee steps into them.
 */
export function armAngle(t: number): number {
  const cycle =
    ((t % REVOLUTION_PERIOD_INTEGRATED) + REVOLUTION_PERIOD_INTEGRATED) %
    REVOLUTION_PERIOD_INTEGRATED;
  if (cycle <= 0) return 0;
  let lo = 0;
  let hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (TIME[mid] <= cycle) lo = mid;
    else hi = mid;
  }
  const span = TIME[hi] - TIME[lo];
  const f = span > 0 ? (cycle - TIME[lo]) / span : 0;
  return (lo + f) * STEP;
}

/** How fast a rider is carried through the bottom, and over the top. */
export const PEAK_SPEED = OMEGA_BOTTOM * ARM_LENGTH;
export const TOP_SPEED = OMEGA_TOP * ARM_LENGTH;

/**
 * THE MACHINE CYCLE — how long until the whole ride is back where it started.
 *
 * This is the number the park's ride operations need. A department ride is
 * stopped between dispatches with its seats back at the boarding platform, and
 * `rideOps.ts` achieves that by running each machine for a whole number of its
 * own periods. So the period has to exist: every motion on the ride must
 * return to its starting pose at the same instant.
 *
 * Three revolutions, seven turns of the saucer. At t = 0 — and at every
 * multiple of this — the arm hangs straight down and the saucer's seat 0 faces
 * the way it started, which is the pose an employee climbs into.
 */
export const RIDE_PERIOD = REVOLUTIONS_PER_CYCLE * REVOLUTION_PERIOD_INTEGRATED;

/** How fast the saucer turns, derived from that cycle rather than chosen. */
export const SPIN_RADIANS_PER_SEC = (SPINS_PER_CYCLE * Math.PI * 2) / RIDE_PERIOD;
export const SPIN_PERIOD = RIDE_PERIOD / SPINS_PER_CYCLE;
export const SPIN_RPM = (SPIN_RADIANS_PER_SEC * 60) / (Math.PI * 2);

/** How far the saucer has turned, `t` seconds into the ride. */
export function spinAngle(t: number): number {
  return SPIN_RADIANS_PER_SEC * t;
}

/**
 * Turns of the saucer per revolution of the arm.
 *
 * Deliberately not a whole number: at exactly one, or two, every rider would
 * come back to the same place in the circle facing the same way each time
 * round and the ride would read as a one-second loop. Seven over three still
 * repeats — it has to, see RIDE_PERIOD — but only after three revolutions.
 */
export const SPIN_PERIOD_RATIO = REVOLUTION_PERIOD_INTEGRATED / SPIN_PERIOD;
