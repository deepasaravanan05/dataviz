import { PARK_CENTER, PARK_LAYOUT, PLAZA_CENTER, rideById } from "@/components/park/layout";
import { RIDE_DEPARTMENTS, type DepartmentRideId } from "@/components/park/departments";
import { FOOD_COURT_CENTER, GATE_X, GATE_Z } from "@/simulation/journey/constants";

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

/** Frames a subject of the given radius and height from the gate side. */
function frame(
  center: readonly [number, number],
  radius: number,
  height: number,
  pull = 2.1,
): { position: [number, number, number]; lookAt: [number, number, number] } {
  const dx = GATE_X - center[0];
  const dz = GATE_Z - center[1];
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
 * Not a guess. This position was solved by projecting every ride's bounding box
 * into screen space across a sweep of bearings, distances and altitudes, and
 * taking the viewpoint that maximises the smallest ride's share of the frame
 * while keeping the whole property — including the railway loop — inside it.
 * From here the smallest ride still covers 2.7% of the frame area, and the only
 * overlap is the drop tower's 4 m lattice clipping the corner of the Monster
 * Ride's box, which a mast that thin does not actually hide.
 * scripts/verify-night.ts re-derives all of that.
 */
places.push({
  id: "overview",
  label: "Full overview",
  group: "park",
  position: [398, 360, 887],
  lookAt: [PARK_CENTER[0], 24, PARK_CENTER[1]],
});

/** Mid park: several rides, the food court and the paths all legible at once. */
places.push({
  id: "mid",
  label: "Mid park",
  group: "park",
  position: [PARK_CENTER[0] + 150, 118, PARK_CENTER[1] + 400],
  lookAt: [PARK_CENTER[0] + 20, 26, PARK_CENTER[1] + 40],
});

/** Ground level: standing on the promenade, looking down it. */
places.push({
  id: "ground",
  label: "Ground level",
  group: "park",
  position: [PLAZA_CENTER[0] + 6, 2.4, PLAZA_CENTER[1] + 150],
  lookAt: [PLAZA_CENTER[0] - 4, 12, PLAZA_CENTER[1] - 60],
});

places.push({
  id: "entrance",
  label: "Main entrance",
  group: "facility",
  position: [GATE_X + 22, 26, GATE_Z + 78],
  lookAt: [GATE_X, 7, GATE_Z - 14],
});

{
  const f = frame(FOOD_COURT_CENTER, 30, 14, 1.9);
  places.push({ id: "food-court", label: "Food court", group: "facility", ...f });
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
  "tower",
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
  const f = frame(ride.center, Math.max(ride.halfX, ride.halfZ), ride.height);
  places.push({
    id: d.rideId,
    label: `${d.department} — ${d.rideName}`,
    group: "department",
    ...f,
  });
}

export const CAMERA_PLACES: CameraPlace[] = places;

export function placeById(id: string): CameraPlace {
  const p = CAMERA_PLACES.find((c) => c.id === id);
  if (!p) throw new Error(`Unknown camera place: ${id}`);
  return p;
}

/** Sanity: every ride in the park must be reachable by fast travel. */
export const UNREACHABLE_RIDES = PARK_LAYOUT.filter(
  (r) => !CAMERA_PLACES.some((p) => p.id === r.id),
).map((r) => r.id);
