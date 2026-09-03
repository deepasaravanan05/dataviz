import { CatmullRomCurve3, Vector3 } from "three";
import { CREST_Y, STATION_Y, TRACK_SAMPLES, VALLEY_Y } from "./constants";

/**
 * THE CIRCUIT.
 *
 * A giga coaster's layout is not a wave: it is a sequence of named elements,
 * and they are laid out here as the control points of one closed curve, in the
 * order the train meets them.
 *
 *   station        low and straight, where the train waits
 *   lift hill      a long steady climb to the crest — the top of the ride
 *   first drop     straight back down past the station's height to the valley
 *   speed hill     the biggest thing the drop's own energy can buy
 *   turnaround     a wide banked sweep at the far end
 *   airtime hills  three of them on the way home, each lower than the last
 *   brake run      into the station
 *
 * THE HEIGHTS ARE FRACTIONS OF THE CREST, and the crest is the height the ride
 * was told to match. So the whole circuit follows that one number: make the
 * ride taller and the drop, the hills and the speeds all grow with it, in
 * proportion, without a single figure being re-typed.
 *
 * THE PLAN IS FLAT AND FIXED. Every x and z below is in metres in the ride's
 * own frame, and none of them depends on the height — which is what lets the
 * ride's footprint be stated once and stay true.
 */

/** A height as a fraction of the way from the valley floor to the crest. */
const at = (f: number) => VALLEY_Y + (CREST_Y - VALLEY_Y) * f;

/**
 * THE PLAN IS GENERATED, NOT HAND-PLACED — and that is the whole reason this
 * layout works.
 *
 * Drawn by hand, this circuit kept inventing corners it did not mean to have:
 * a control point a few metres out of line is a twenty-metre radius, and a
 * twenty-metre radius at a hundred and seventy km/h is nine g. Chasing them
 * one at a time is a losing game, because the spline decides the curvature
 * between the points and not the points themselves.
 *
 * So the plan is a shape with a RADIUS as an input: a stadium — two straights
 * joined by two half-circles — laid out from the corner radius the forces
 * allow. Nothing on it can be tighter than that radius, by construction, and
 * the ride's footprint follows from the same number rather than fighting it.
 * The heights are then laid over the plan: the lift up one straight, the drop
 * and the hills down the other.
 *
 * TURN_RADIUS is the design input. A train doing v through a corner of radius
 * R pulls `v^2 / R` sideways; at the speed this circuit reaches after its
 * drop, seventy-five metres is what keeps that inside three g.
 */
const TURN_RADIUS = 75;
const STRAIGHT = 150;

/**
 * A point on the stadium, by how far round it is (0..1), with the straights
 * running along x and the turns at either end.
 */
function plan(t: number): [number, number] {
  const straight = STRAIGHT;
  const arc = Math.PI * TURN_RADIUS;
  const perimeter = 2 * straight + 2 * arc;
  const d = ((t % 1) + 1) % 1 * perimeter;

  if (d < straight) return [-straight / 2 + d, -TURN_RADIUS];
  if (d < straight + arc) {
    const a = (d - straight) / TURN_RADIUS - Math.PI / 2;
    return [straight / 2 + Math.cos(a) * TURN_RADIUS, Math.sin(a) * TURN_RADIUS];
  }
  if (d < 2 * straight + arc) return [straight / 2 - (d - straight - arc), TURN_RADIUS];
  const a = (d - 2 * straight - arc) / TURN_RADIUS + Math.PI / 2;
  return [-straight / 2 + Math.cos(a) * TURN_RADIUS, Math.sin(a) * TURN_RADIUS];
}

/**
 * The height at each point round the circuit, as a fraction of the climb.
 *
 * Laid over the plan in the order the train meets them: the station on the
 * first straight, the lift hill up the rest of it, the crest at the first
 * turn, the drop down through it, and three airtime hills down the far
 * straight into the brake run.
 */
const PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.08, 0.0],
  [0.14, 0.06],
  [0.2, 0.28],
  [0.26, 0.62],
  [0.31, 0.9],
  [0.35, 1.0],
  [0.4, 0.92],
  [0.45, 0.55],
  [0.5, 0.12],
  [0.54, 0.02],
  [0.6, 0.34],
  [0.66, 0.08],
  [0.72, 0.26],
  [0.78, 0.06],
  [0.84, 0.18],
  [0.9, 0.04],
  [0.96, 0.0],
];

const CONTROL_POINTS: [number, number, number][] = PROFILE.map(([t, h]) => {
  const [x, z] = plan(t);
  /* The station straight sits at its own deck height, not on the climb. */
  const y = h === 0 ? STATION_Y : at(h);
  return [x, y, z];
});

/**
 * THE CREST HAS TO LAND ON THE NUMBER, and a spline through a control point
 * does not stop there.
 *
 * A Catmull-Rom curve passes through its controls but overshoots BETWEEN them,
 * so a crest control at 127 m produced a track that actually topped out at
 * 127.71 — and the ride's whole brief is that its height equals the Tea Cups'.
 * Nudging the control down by hand until it looked right would be a fudge that
 * broke the next time a control point moved.
 *
 * It does not need one. A Catmull-Rom curve is an AFFINE function of its
 * control points — the basis weights sum to one at every parameter — so
 * mapping every control height by `y -> V + (y - V) * c` maps the whole
 * sampled curve by exactly the same rule. One measurement of the raw
 * overshoot gives the c that lands the peak on CREST_Y, and it lands there
 * exactly rather than nearly, for any layout.
 */
function build(points: [number, number, number][]): CatmullRomCurve3 {
  /*
   * CENTRIPETAL parameterisation, not uniform.
   *
   * A uniform Catmull-Rom through control points that are not evenly spaced —
   * and a coaster's never are, a lift hill being all long straights and a
   * pull-out all short ones — overshoots and kinks between them. Those kinks
   * are not cosmetic here: a kink is a tight radius, a tight radius at a
   * hundred and seventy km/h is nine g, and the curve was inventing corners
   * the layout does not have. The centripetal variant is the one that provably
   * cannot cusp or loop, and it is what the track is drawn with.
   */
  return new CatmullRomCurve3(
    points.map(([x, y, z]) => new Vector3(x, y, z)),
    true,
    "centripetal",
  );
}

function peakOf(curve: CatmullRomCurve3): number {
  let peak = -Infinity;
  for (let i = 0; i <= TRACK_SAMPLES; i++) {
    peak = Math.max(peak, curve.getPointAt(i / TRACK_SAMPLES).y);
  }
  return peak;
}

/**
 * The correction, found by repeating the measurement.
 *
 * One pass would do it if the curve were sampled by parameter, but it is
 * sampled by ARC LENGTH — which is what makes ties and supports come out
 * evenly spaced — and re-scaling the heights changes the arc lengths, so the
 * samples land in slightly different places and the peak moves a fraction.
 * Applying the same correction to the result of the last one converges on the
 * fixed point in three or four passes; it is run for eight and stops as soon
 * as the peak is on the number to a nanometre.
 */
const CREST_CORRECTION = (() => {
  let c = 1;
  for (let pass = 0; pass < 8; pass++) {
    const peak = peakOf(
      build(CONTROL_POINTS.map(([x, y, z]) => [x, VALLEY_Y + (y - VALLEY_Y) * c, z])),
    );
    if (Math.abs(peak - CREST_Y) < 1e-12) break;
    c *= (CREST_Y - VALLEY_Y) / (peak - VALLEY_Y);
  }
  return c;
})();

/** The circuit, closed: the train comes back to where it started. */
export const TRACK_CURVE = build(
  CONTROL_POINTS.map(([x, y, z]) => [x, VALLEY_Y + (y - VALLEY_Y) * CREST_CORRECTION, z]),
);

/** The whole circuit, sampled once — what everything else reads. */
export const TRACK_POINTS: Vector3[] = Array.from({ length: TRACK_SAMPLES + 1 }, (_, i) =>
  TRACK_CURVE.getPointAt(i / TRACK_SAMPLES),
);

/** How long the circuit is, measured along the sampled curve. */
export const TRACK_LENGTH = (() => {
  let total = 0;
  for (let i = 1; i < TRACK_POINTS.length; i++) total += TRACK_POINTS[i].distanceTo(TRACK_POINTS[i - 1]);
  return total;
})();

/** Distance along the track to each sample, so `u` and metres can be swapped. */
const CUMULATIVE: number[] = (() => {
  const out = [0];
  for (let i = 1; i < TRACK_POINTS.length; i++) {
    out.push(out[i - 1] + TRACK_POINTS[i].distanceTo(TRACK_POINTS[i - 1]));
  }
  return out;
})();

/** Where on the curve (0..1) a given distance along the track falls. */
export function uAtDistance(distance: number): number {
  const d = ((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
  let lo = 0;
  let hi = CUMULATIVE.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUMULATIVE[mid] <= d) lo = mid;
    else hi = mid;
  }
  const span = CUMULATIVE[hi] - CUMULATIVE[lo];
  const f = span > 0 ? (d - CUMULATIVE[lo]) / span : 0;
  return (lo + f) / TRACK_SAMPLES;
}

/** The height of the track at a distance along it. */
export function heightAtDistance(distance: number): number {
  return TRACK_CURVE.getPointAt(uAtDistance(distance)).y;
}

/**
 * THE PLAN RADIUS at every sample: how tight the track's SHADOW turns.
 *
 * It lives here rather than with the frames because two different things need
 * it and they cannot both own it — the banking, which answers the sideways
 * force a corner makes, and the trim brake, which is placed where the layout
 * can no longer take the speed. Anything that needed it from the frames would
 * have to import the motion, which imports the track, which is a circle.
 *
 * MEASURED IN PLAN and over a wide stencil, both on purpose. A corner in the
 * VERTICAL — the pull-out at the bottom of the drop — presses a rider into the
 * seat and needs no banking at all, so only the shadow's curvature counts. And
 * a circumradius taken across half a metre of a half-metre sampling is
 * measuring noise: thirteen metres is long enough to see a corner and short
 * enough not to average two together.
 */
const CURVATURE_STENCIL = 25;

export const PLAN_RADIUS: number[] = TRACK_POINTS.slice(0, TRACK_SAMPLES).map((_, index) => {
  const n = TRACK_SAMPLES;
  const flat = (v: Vector3) => new Vector3(v.x, 0, v.z);
  const a = flat(TRACK_POINTS[(index - CURVATURE_STENCIL + n) % n]);
  const b = flat(TRACK_POINTS[index % n]);
  const c = flat(TRACK_POINTS[(index + CURVATURE_STENCIL) % n]);
  const ab = a.distanceTo(b);
  const bc = b.distanceTo(c);
  const ca = c.distanceTo(a);
  const s = (ab + bc + ca) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - ab) * (s - bc) * (s - ca)));
  if (area < 1e-9) return Infinity;
  return (ab * bc * ca) / (4 * area);
});

/** The plan radius at a distance along the track. */
export function planRadiusAt(distance: number): number {
  const d = ((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
  return PLAN_RADIUS[Math.min(TRACK_SAMPLES - 1, Math.floor((d / TRACK_LENGTH) * TRACK_SAMPLES))];
}

/** Which way a corner turns, seen from above — the sign the bank takes. */
export function turnSignAt(index: number, tangent: Vector3): number {
  const n = TRACK_SAMPLES;
  const a = TRACK_POINTS[(index - CURVATURE_STENCIL + n) % n];
  const c = TRACK_POINTS[(index + CURVATURE_STENCIL) % n];
  const toCentre = new Vector3()
    .addVectors(a, c)
    .multiplyScalar(0.5)
    .sub(TRACK_POINTS[index % n]);
  const side = new Vector3().crossVectors(tangent, new Vector3(0, 1, 0));
  const dot = side.dot(toCentre);
  return dot === 0 ? 0 : Math.sign(dot);
}

/** The crest: the highest point the sampled curve actually reaches. */
export const TRACK_PEAK = Math.max(...TRACK_POINTS.map((p) => p.y));
/** And the lowest, at the bottom of the first drop. */
export const TRACK_VALLEY = Math.min(...TRACK_POINTS.map((p) => p.y));

/** Where along the track the crest is — the moment the chain lets go. */
export const CREST_DISTANCE = (() => {
  let best = 0;
  let bestY = -Infinity;
  for (let i = 0; i < TRACK_POINTS.length; i++) {
    if (TRACK_POINTS[i].y > bestY) {
      bestY = TRACK_POINTS[i].y;
      best = CUMULATIVE[i];
    }
  }
  return best;
})();

/** Where the station is: the straight the train waits on. */
export const STATION_DISTANCE = 0;

/**
 * The height the track ACTUALLY sits at along the station straight.
 *
 * Not `STATION_Y`: the crest correction above moves every height on the
 * circuit by a hair, and the platform has to be level with the rail the train
 * really stops on rather than with the number the layout was drawn from.
 */
export const STATION_TRACK_Y = TRACK_CURVE.getPointAt(uAtDistance(STATION_DISTANCE)).y;

/** How far the ride reaches from its own centre line, on the ground. */
export const TRACK_REACH = Math.max(...TRACK_POINTS.map((p) => Math.hypot(p.x, p.z)));
