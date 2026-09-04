import { PARK_CENTER, PARK_LAYOUT, PLAZA_CENTER, rideById } from "@/components/park/layout";
import {
  FOOD_COURT_PATH_RADIUS,
  FOOD_COURT_PLAZA_RADIUS,
  PARK_PAVED_EDGE,
  PERIMETER_ROAD_RADIUS,
  RIDE_RING_OUTER_EDGE,
  ringPoint,
} from "@/components/park/parkRing";
import { RIDE_DEPARTMENTS, type DepartmentRideId } from "@/components/park/departments";
import { FOOD_COURT_CENTER, GATE_X, GATE_Z } from "@/simulation/journey/constants";
import {
  CHAIRS_RIDE_NAME,
  CHAIRS_TEAM_ID,
  CHAIRS_TEAM_NAME,
  OVERALL_HEIGHT as CHAIRS_HEIGHT,
  OVERALL_REACH as CHAIRS_REACH,
} from "@/components/flying-chairs/constants";
import { RIDE_CENTER as CHAIRS_CENTER } from "@/components/flying-chairs/placement";
import {
  LOOPER_RIDE_ID,
  LOOPER_RIDE_NAME,
  LOOPER_TEAM_NAME,
  OVERALL_HEIGHT as LOOPER_HEIGHT,
  OVERALL_REACH as LOOPER_REACH,
} from "@/components/super-looper/constants";
import { RIDE_CENTER as LOOPER_CENTER } from "@/components/super-looper/placement";
import {
  TEACUPS_RIDE_ID,
  TEACUPS_RIDE_NAME,
  TEACUPS_TEAM_NAME,
  OVERALL_HEIGHT as TEACUPS_HEIGHT,
  OVERALL_REACH as TEACUPS_REACH,
} from "@/components/tea-cups/constants";
import { RIDE_CENTER as TEACUPS_CENTER } from "@/components/tea-cups/placement";
import { OVERALL_REACH as GIGA_REACH } from "@/components/giga-coaster/envelope";
import { RIDE_CENTER as GIGA_CENTER } from "@/components/giga-coaster/placement";
import {
  DUMBO_RIDE_ID,
  DUMBO_RIDE_NAME,
  DUMBO_TEAM_NAME,
  OVERALL_HEIGHT as DUMBO_HEIGHT,
  OVERALL_REACH as DUMBO_REACH,
} from "@/components/dumbo-ride/constants";
import { RIDE_CENTER as DUMBO_CENTER } from "@/components/dumbo-ride/placement";

/**
 * Named viewpoints the camera can travel to.
 *
 * Every one is computed from where the thing actually is, so a viewpoint can
 * never drift away from its subject. Each frames its subject from the side the
 * arriving employee sees it from, which keeps the park legible: you always
 * approach an attraction the way the people do.
 */

export interface CameraPlace {
  id: string;
  label: string;
  group: "park" | "department" | "facility";
  position: [number, number, number];
  lookAt: [number, number, number];
}

/**
 * Frames a subject of the given radius and height from the side people
 * approach it from — which, in a concentric park, is the INWARD side.
 *
 * It used to frame from the gate. That was the same thing while every ride
 * stood in a fan in front of the entrance; on a ring it is not, because for
 * the attractions at the back of the park the gate is on the far side of the
 * lake and framing "from the gate" means standing behind the ride. What holds
 * for all ten is that they are entered off the ring path, so the camera stands
 * between the ride and the middle of the park, which is also the side the
 * queue, the plaza and the boarding steps are on.
 */
function frame(
  center: readonly [number, number],
  radius: number,
  height: number,
  pull = 2.1,
): { position: [number, number, number]; lookAt: [number, number, number] } {
  const dx = PARK_CENTER[0] - center[0];
  const dz = PARK_CENTER[1] - center[1];
  const len = Math.hypot(dx, dz) || 1;
  const distance = Math.max(radius * pull + 26, height * 1.8 + 24);
  return {
    position: [
      center[0] + (dx / len) * distance,
      height * 0.72 + 12,
      center[1] + (dz / len) * distance,
    ],
    lookAt: [center[0], height * 0.42, center[1]],
  };
}

const places: CameraPlace[] = [];

/**
 * Full park overview.
 *
 * Not a guess, and no longer a fixed one either. The position was originally
 * solved by projecting every ride's bounding box into screen space across a
 * sweep of bearings, distances and altitudes, and taking the viewpoint that
 * kept the whole property — railway loop included — inside the frame with the
 * smallest ride still reading. Then every ride was rebuilt to one common
 * height, the layout spread to fit them, and the railway grew round the
 * result: from the old spot the park no longer fitted in the lens at all.
 *
 * So the BEARING and the ELEVATION of that solved viewpoint are kept — they
 * are what makes the fan read left to right — and only the DISTANCE is
 * re-derived, from the park's own reach and the camera's own field of view.
 * The park grows, the camera steps back, and the framing stays what it was.
 * `verify-night.ts` re-projects everything from here and re-checks it.
 */
const OVERVIEW_FOV_DEG = 46;
/** How far the furthest thing in the park stands from the point we look at. */
const PARK_REACH = (() => {
  let reach = 0;
  const take = (x: number, z: number) =>
    (reach = Math.max(reach, Math.hypot(x - PARK_CENTER[0], z - PARK_CENTER[1])));
  for (const r of PARK_LAYOUT) {
    take(r.minX, r.minZ);
    take(r.maxX, r.minZ);
    take(r.minX, r.maxZ);
    take(r.maxX, r.maxZ);
  }
  for (const [c, k] of [
    [CHAIRS_CENTER, CHAIRS_REACH],
    [LOOPER_CENTER, LOOPER_REACH],
    [TEACUPS_CENTER, TEACUPS_REACH],
    [GIGA_CENTER, GIGA_REACH],
    [DUMBO_CENTER, DUMBO_REACH],
  ] as [readonly [number, number], number][]) {
    take(c[0] + k, c[1]);
    take(c[0] - k, c[1]);
    take(c[0], c[1] + k);
    take(c[0], c[1] - k);
  }
  /*
   * AND THE OUTER CIRCULAR PATH, which is the park's outline in this view.
   *
   * It used to be the railway that drew that outline. The train and its track
   * have been removed, so the outermost thing the overview has to hold is the
   * path that joins the ride platforms — which is what the plan uses to
   * describe the park's extent anyway.
   */
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    take(
      PARK_CENTER[0] + Math.cos(a) * PARK_PAVED_EDGE,
      PARK_CENTER[1] + Math.sin(a) * PARK_PAVED_EDGE,
    );
  }
  return reach;
})();

{
  /* The solved viewpoint's own geometry: bearing and elevation, kept. */
  const OFFSET: [number, number] = [398 - PARK_CENTER[0], 887 - PARK_CENTER[1]];
  const OLD_GROUND = Math.hypot(OFFSET[0], OFFSET[1]);
  const ELEVATION = Math.atan2(360, OLD_GROUND);
  /* Far enough back that the park's reach fits the frame, with a little air —
     and no more than that, because every extra metre of standoff shrinks the
     rides, and the smallest of them still has to read as a ride. */
  const distance = (PARK_REACH / Math.tan((OVERVIEW_FOV_DEG / 2) * (Math.PI / 180))) * 1.03;
  const ground = distance * Math.cos(ELEVATION);
  places.push({
    id: "overview",
    label: "Full overview",
    group: "park",
    position: [
      PARK_CENTER[0] + (OFFSET[0] / OLD_GROUND) * ground,
      distance * Math.sin(ELEVATION),
      PARK_CENTER[1] + (OFFSET[1] / OLD_GROUND) * ground,
    ],
    lookAt: [PARK_CENTER[0], 24, PARK_CENTER[1]],
  });
}

/**
 * HOW CLOSE THE CAMERA MAY ORBIT.
 *
 * Its far counterpart, ORBIT_MAX_DISTANCE, is solved below from the overview
 * itself: the shot the park opens on stands back far enough for the whole
 * property to fit the lens, and an orbit limit shorter than that would snap
 * the opening framing inward on the viewer's first drag — which is what a
 * remembered 1800 did once the park grew.
 */
export const ORBIT_MIN_DISTANCE = 30;

/**
 * Mid park: the entrance half of the ring — the lake, the two big rides that
 * flank the avenue, and the ring path joining them.
 *
 * Placed off the ring's own geometry rather than at a remembered offset: high
 * over the entrance side, far enough out to hold the ride ring's near arc in
 * the frame, aimed at the lake.
 */
const MID_STAND = ringPoint(14, RIDE_RING_OUTER_EDGE * 0.95);
places.push({
  id: "mid",
  label: "Mid park",
  group: "park",
  position: [MID_STAND[0], RIDE_RING_OUTER_EDGE * 0.42, MID_STAND[1]],
  lookAt: [PARK_CENTER[0], 30, PARK_CENTER[1]],
});

/**
 * Ground level: standing where the avenue meets the food court's circular
 * path, looking straight in at the court.
 *
 * The stance follows the plan rather than a remembered offset: this is the
 * junction a visitor actually arrives at, and what they see from it is the
 * centrepiece.
 */
const GROUND_STAND = ringPoint(0, FOOD_COURT_PATH_RADIUS);
places.push({
  id: "ground",
  label: "Ground level",
  group: "park",
  position: [GROUND_STAND[0], 2.4, GROUND_STAND[1]],
  lookAt: [PLAZA_CENTER[0], 26, PLAZA_CENTER[1] + FOOD_COURT_PLAZA_RADIUS * 0.4],
});

places.push({
  id: "entrance",
  label: "Main entrance",
  group: "facility",
  position: [GATE_X + 22, 26, GATE_Z + 78],
  lookAt: [GATE_X, 7, GATE_Z - 14],
});

{
  /*
   * THE FOOD COURT'S OWN VIEW, framed on the COURT rather than on the
   * pavilion inside it.
   *
   * It used to be framed as a 30 m subject 14 m tall, which was the old
   * pavilion standing on its own beside the avenue. The court is now the
   * park's centrepiece — a 500 m plaza with a colonnade, a ring of stalls and
   * thirty tables around that hall — so a camera framed on the hall shows a
   * roof filling the screen with the court out of shot on every side.
   *
   * `frame()` sets its distance from the subject's radius and height, so
   * handing it the plaza's radius and the colonnade's height is all that is
   * needed; the stance, the elevation and the look-at all follow.
   */
  /*
   * `frame()` CANNOT BE USED FOR THIS ONE, and the reason is worth stating.
   * It stands the camera between its subject and the middle of the park — the
   * side people approach from — and this subject IS the middle of the park, so
   * that direction is undefined. Fed the court, it divided by a zero-length
   * vector and parked the camera inside the pavilion.
   *
   * The court's own approach is the entrance avenue, so the viewpoint stands
   * on it: out along bearing zero far enough for the whole 500 m plaza to fit
   * the park's 46-degree lens, high enough to see over the colonnade and into
   * the seating, looking at the hall.
   */
  const stand = ringPoint(0, FOOD_COURT_PLAZA_RADIUS * 2.2);
  places.push({
    id: "food-court",
    label: "Food court",
    group: "facility",
    position: [stand[0], FOOD_COURT_PLAZA_RADIUS * 0.55, stand[1]],
    lookAt: [FOOD_COURT_CENTER[0], 20, FOOD_COURT_CENTER[1]],
  });
}

/**
 * The order the department chips read in along the nav bar.
 *
 * Kept here rather than by reordering `RIDE_ORDER`, which is what the paving
 * network, the department panel and the dashboard are all built from — this is
 * a presentation order for one row of chips, and it has no business changing
 * how the park itself is assembled. Any ride missing from this list still
 * appears, on the end, so a new attraction can never fall out of fast travel.
 */
const DEPARTMENT_NAV_ORDER: DepartmentRideId[] = [
  "coaster",
  "dragon",
  "ferris",
  "monster",
  "ufo",
  /* The Giga Coaster reads last, where its own standalone chip used to sit. */
  "giga",
];

const departmentsInNavOrder = [...RIDE_DEPARTMENTS].sort((a, b) => {
  const rank = (id: DepartmentRideId) => {
    const i = DEPARTMENT_NAV_ORDER.indexOf(id);
    return i === -1 ? DEPARTMENT_NAV_ORDER.length : i;
  };
  return rank(a.rideId) - rank(b.rideId);
});

for (const d of departmentsInNavOrder) {
  const ride = rideById(d.rideId);
  const f = frame(ride.center, Math.hypot(ride.halfX, ride.halfZ), ride.height);
  places.push({
    id: d.rideId,
    label: `${d.department} — ${d.rideName}`,
    group: "department",
    ...f,
  });
}

/*
 * THE PARK TRAIN'S CHIP IS GONE, with the train.
 *
 * There was a solved viewpoint here for the railway loop — `frame()` was no
 * use for a subject twice the width of the whole park, so the stance was swept
 * out to 1.67 loop radii back and 0.34 up, kept as ratios of the loop's own
 * radius. The train and its track have been removed at the user's request, and
 * the DevOps name it carried now belongs to the Giga Coaster, which has a chip
 * of its own further down.
 */


/*
 * THE PARK TRAIN'S CHIP IS GONE, with the train.
 *
 * There was a solved viewpoint here for the railway loop — `frame()` was no
 * use for a subject that ringed the whole park, so the stance was swept out to
 * 1.67 loop radii back and 0.34 up, kept as ratios of the loop's own radius.
 * The train, its track and its route have been removed at the user's request,
 * and the DevOps name its chip carried went with them.
 */

/*
 * The Flying Chairs' chip.
 *
 * Unlike the train, this ride is a compact object standing on the ground, so
 * `frame()` sizes it correctly from its own reach and height — the same way
 * every department chip is sized from its ride's box. It sits with the
 * department chips because it carries a team name, and after them because it
 * is not a department ride.
 */
{
  /*
   * ITS BEARING IS SEARCHED NOW, like the Tea Cups' and the Dumbo Ride's.
   *
   * `frame()` stands back from a ride along the gate's own direction, which was
   * open ground when this ride sat close behind the food court. Every ride is
   * built to one common height now, the fan is far wider, and the ride stands
   * three hundred metres out — and from there the gate side of it is the
   * Monster Ride, so the framed viewpoint landed inside another ride. The
   * bearing walks away from the gate direction two degrees at a time,
   * alternating sides, and stops at the first one standing the camera in clear
   * air.
   */
  const distance = Math.max(CHAIRS_REACH * 2.1 + 26, CHAIRS_HEIGHT * 1.8 + 24);
  const toGate = Math.atan2(GATE_Z - CHAIRS_CENTER[1], GATE_X - CHAIRS_CENTER[0]);
  const clear = (x: number, z: number) =>
    !PARK_LAYOUT.some(
      (r) => x > r.minX - 12 && x < r.maxX + 12 && z > r.minZ - 12 && z < r.maxZ + 12,
    );

  let bearing = toGate;
  for (let step = 0; step <= 90; step++) {
    const swing = ((step + 1) >> 1) * ((step % 2 === 0 ? 1 : -1) * (Math.PI / 90));
    const a = toGate + swing;
    if (clear(CHAIRS_CENTER[0] + Math.cos(a) * distance, CHAIRS_CENTER[1] + Math.sin(a) * distance)) {
      bearing = a;
      break;
    }
  }

  places.push({
    id: CHAIRS_TEAM_ID,
    label: `${CHAIRS_TEAM_NAME} — ${CHAIRS_RIDE_NAME}`,
    group: "department",
    position: [
      CHAIRS_CENTER[0] + Math.cos(bearing) * distance,
      CHAIRS_HEIGHT * 0.72 + 12,
      CHAIRS_CENTER[1] + Math.sin(bearing) * distance,
    ],
    lookAt: [CHAIRS_CENTER[0], CHAIRS_HEIGHT * 0.42, CHAIRS_CENTER[1]],
  });
}

/*
 * The Super Looper's chip.
 *
 * It is signed for UI/UX, so its chip reads the way the Park Train's and the
 * Flying Chairs' do — team name, then ride name — and sits with the
 * department chips, after them, because it is a label rather than a routing
 * destination. The shot is sized from the ride's own reach and height, the
 * same way every other chip is sized.
 *
 * THE BEARING, THOUGH, HAS TO BE SEARCHED. Every other chip frames its subject
 * from the gate side, which works because every other subject has open ground
 * between it and the gate. This one does not: it was asked to stand beside the
 * Roller Coaster, and the line from there back to the entrance runs straight
 * through the Dragon Ride — so framing it from the gate side would put the
 * camera inside another ride, which `verify-world.ts` catches and is right to.
 *
 * So the bearing walks away from the gate direction, a couple of degrees at a
 * time and alternating sides, and stops at the first one that stands the
 * camera in clear air. The first candidate tried is still the gate side, so
 * nothing about how the other chips are framed changes, and this one only
 * moves as far as it has to.
 */
{
  const distance = Math.max(LOOPER_REACH * 2.1 + 26, LOOPER_HEIGHT * 1.8 + 24);
  const toGate = Math.atan2(GATE_Z - LOOPER_CENTER[1], GATE_X - LOOPER_CENTER[0]);
  const eye = LOOPER_HEIGHT * 0.72 + 12;

  const clear = (x: number, z: number) =>
    !PARK_LAYOUT.some(
      (r) => x > r.minX - 12 && x < r.maxX + 12 && z > r.minZ - 12 && z < r.maxZ + 12,
    );

  let bearing = toGate;
  for (let step = 0; step <= 90; step++) {
    const swing = ((step + 1) >> 1) * ((step % 2 === 0 ? 1 : -1) * (Math.PI / 90));
    const a = toGate + swing;
    if (clear(LOOPER_CENTER[0] + Math.cos(a) * distance, LOOPER_CENTER[1] + Math.sin(a) * distance)) {
      bearing = a;
      break;
    }
  }

  places.push({
    id: LOOPER_RIDE_ID,
    label: `${LOOPER_TEAM_NAME} — ${LOOPER_RIDE_NAME}`,
    group: "department",
    position: [
      LOOPER_CENTER[0] + Math.cos(bearing) * distance,
      eye,
      LOOPER_CENTER[1] + Math.sin(bearing) * distance,
    ],
    lookAt: [LOOPER_CENTER[0], LOOPER_HEIGHT * 0.42, LOOPER_CENTER[1]],
  });
}

/*
 * The Tea Cups' chip.
 *
 * Signed for Risk, so it reads team-then-ride like the other three team chips
 * and sits with them.
 *
 * ITS BEARING HAS TO BE SEARCHED, for the same reason the Super Looper's does
 * and even more obviously: this ride was asked to stand BEHIND the UFO
 * Pendulum, so the gate side of it is, by construction, the pendulum. Framing
 * it from there would put the camera inside another ride. The bearing
 * therefore walks away from the gate direction a couple of degrees at a time,
 * alternating sides, and stops at the first one standing the camera in clear
 * air — trying the gate side first, so nothing about the other chips changes.
 */
{
  const distance = Math.max(TEACUPS_REACH * 2.1 + 26, TEACUPS_HEIGHT * 1.8 + 24);
  const toGate = Math.atan2(GATE_Z - TEACUPS_CENTER[1], GATE_X - TEACUPS_CENTER[0]);
  const clear = (x: number, z: number) =>
    !PARK_LAYOUT.some(
      (r) => x > r.minX - 12 && x < r.maxX + 12 && z > r.minZ - 12 && z < r.maxZ + 12,
    );

  let bearing = toGate;
  for (let step = 0; step <= 90; step++) {
    const swing = ((step + 1) >> 1) * ((step % 2 === 0 ? 1 : -1) * (Math.PI / 90));
    const a = toGate + swing;
    if (
      clear(TEACUPS_CENTER[0] + Math.cos(a) * distance, TEACUPS_CENTER[1] + Math.sin(a) * distance)
    ) {
      bearing = a;
      break;
    }
  }

  places.push({
    id: TEACUPS_RIDE_ID,
    label: `${TEACUPS_TEAM_NAME} — ${TEACUPS_RIDE_NAME}`,
    group: "department",
    position: [
      TEACUPS_CENTER[0] + Math.cos(bearing) * distance,
      TEACUPS_HEIGHT * 0.72 + 12,
      TEACUPS_CENTER[1] + Math.sin(bearing) * distance,
    ],
    lookAt: [TEACUPS_CENTER[0], TEACUPS_HEIGHT * 0.42, TEACUPS_CENTER[1]],
  });
}


/*
 * The Dumbo Ride's chip.
 *
 * Named for Finance, so it reads team-then-ride like the other team chips and
 * sits with them rather than with the facilities.
 *
 * ITS BEARING IS SEARCHED, exactly as the Tea Cups' is and for exactly the same
 * reason: this ride was asked to stand BEHIND the UFO Pendulum, so the gate
 * side of it is the pendulum, and framing it from there stands the camera
 * inside another ride. The bearing therefore walks away from the gate
 * direction two degrees at a time, alternating sides, and stops at the first
 * one that puts the camera in clear air.
 */
{
  const distance = Math.max(DUMBO_REACH * 2.1 + 26, DUMBO_HEIGHT * 1.8 + 24);
  const toGate = Math.atan2(GATE_Z - DUMBO_CENTER[1], GATE_X - DUMBO_CENTER[0]);
  const clear = (x: number, z: number) =>
    !PARK_LAYOUT.some(
      (r) => x > r.minX - 12 && x < r.maxX + 12 && z > r.minZ - 12 && z < r.maxZ + 12,
    );

  let bearing = toGate;
  for (let step = 0; step <= 90; step++) {
    const swing = ((step + 1) >> 1) * ((step % 2 === 0 ? 1 : -1) * (Math.PI / 90));
    const a = toGate + swing;
    if (clear(DUMBO_CENTER[0] + Math.cos(a) * distance, DUMBO_CENTER[1] + Math.sin(a) * distance)) {
      bearing = a;
      break;
    }
  }

  places.push({
    id: DUMBO_RIDE_ID,
    label: `${DUMBO_TEAM_NAME} — ${DUMBO_RIDE_NAME}`,
    group: "department",
    position: [
      DUMBO_CENTER[0] + Math.cos(bearing) * distance,
      DUMBO_HEIGHT * 0.72 + 12,
      DUMBO_CENTER[1] + Math.sin(bearing) * distance,
    ],
    lookAt: [DUMBO_CENTER[0], DUMBO_HEIGHT * 0.42, DUMBO_CENTER[1]],
  });
}

/*
 * THE GIGA COASTER'S OWN CHIP IS GONE, because it has a better one.
 *
 * It stood here as a "facility" — an attraction with no department behind it —
 * labelled simply "Giga Coaster". DevOps ride it now, so it is a department
 * ride like the other five and the loop above gives it the chip they all get:
 * the departments it serves, then its name. Leaving this one as well would have
 * put two chips with the same id in the bar.
 *
 * Its framing is now the same rule every department ride's chip uses, which
 * stands a little further back from a subject this wide than the bespoke line
 * here did — the same `frame()`, given the ride's layout box rather than its
 * track reach.
 */

export const CAMERA_PLACES: CameraPlace[] = places;

/**
 * HOW FAR THE CAMERA MAY PULL BACK.
 *
 * Two things have to fit inside it, and the larger wins:
 *
 *   - the OPENING SHOT, plus a little room to pull back past it. A limit
 *     shorter than the shot the park opens on snaps the framing inward on the
 *     viewer's first drag, which is what a remembered 1800 did once the park
 *     grew past it;
 *   - the WHOLE PROPERTY. The overview frames the park — the attractions and
 *     the railway that rings them — and the property is larger than that: the
 *     perimeter road and the main gate stand outside the railway. Somebody who
 *     wants to see the boundary should be able to.
 *
 * Both are solved from the park's own geometry, so the limit follows it.
 */
export const ORBIT_MAX_DISTANCE = (() => {
  const o = places.find((p) => p.id === "overview")!;
  const overview = Math.hypot(
    o.position[0] - o.lookAt[0],
    o.position[1] - o.lookAt[1],
    o.position[2] - o.lookAt[2],
  );
  const property = Math.max(
    PERIMETER_ROAD_RADIUS,
    Math.hypot(GATE_X - PARK_CENTER[0], GATE_Z - PARK_CENTER[1]),
  );
  const frameProperty =
    (property / Math.tan((OVERVIEW_FOV_DEG / 2) * (Math.PI / 180))) * 1.06;
  return Math.max(overview * 1.1, frameProperty);
})();

export function placeById(id: string): CameraPlace {
  const p = CAMERA_PLACES.find((c) => c.id === id);
  if (!p) throw new Error(`Unknown camera place: ${id}`);
  return p;
}

/** Sanity: every ride in the park must be reachable by fast travel. */
export const UNREACHABLE_RIDES = PARK_LAYOUT.filter(
  (r) => !CAMERA_PLACES.some((p) => p.id === r.id),
).map((r) => r.id);
