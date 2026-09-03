import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_X,
  GATE_Z,
} from "@/simulation/journey/constants";
import {
  MAIN_VIEWPOINT,
  PARK_CENTER,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  viewAngles,
} from "@/components/park/layout";
import { TRAIN_SCALE } from "@/components/park/parkScale";
import { TRACK_CURVE } from "@/components/park-train/trainTrack";
import { TRACK_HALF_WIDTH_METRES } from "@/components/park-train/constants";
import { HUMAN, METRE as WORLD_METRE, PROP } from "@/world/scale";
import { UNIFORM_RIDE_HEIGHT } from "@/components/park/uniformRideHeight";

/**
 * EVERY RIDE IN THE PARK IS NOW THE SAME SIZE, and this is how this one gets
 * there.
 *
 * The machine below was authored at 89.2 m. The park's common height is the
 * Risk ride's, so this ride is multiplied by ONE factor on every axis — done
 * once, here, by redefining what a metre means inside this file. Every
 * dimension on the page is written as so many metres, so scaling the unit
 * scales the whole machine and no part of it can be missed.
 *
 * DOING IT HERE RATHER THAN AS A GROUP SCALE IN THE SCENE keeps the physics
 * honest: the chairs hang on a CONICAL PENDULUM, whose flare angle is solved from the
 * sweep's radius and the speed it turns at. Scaling the radius here means
 * the flare is re-solved for the machine that is actually built, rather than
 * a small ride's answer drawn at a large ride's size.
 *
 * WHAT DOES NOT SCALE is anything measured from a PERSON, and on this ride
 * that is a longer list than usual because this is the ride people climb into
 * by hand: the CHAIR itself (pan, back, lap bar, footrest, livery board), the
 * LADDER (rung pitch, cage, grab rails) and the clearance the footrest hangs
 * over the deck at are all written in WORLD_METRE. A rung is a rung whatever
 * size the machine that carries it is — scaling the ladder with the tower gave
 * 40 cm between rungs, which is a climb nobody makes. The mast, the sweep, the
 * canopy, the chains and every radius are the machine, and those scale.
 *
 * AUTHORED_OVERALL_HEIGHT is what this page describes at 1x. It is frozen
 * rather than derived, because the scale has to be known before the dimensions
 * it multiplies; the validator below asserts the ride actually lands on the
 * park's common height, so a wrong figure here fails loudly instead of quietly
 * making this ride the odd one out.
 */
const AUTHORED_OVERALL_HEIGHT = 89.2;
export const RIDE_UNIFORM_SCALE = UNIFORM_RIDE_HEIGHT / AUTHORED_OVERALL_HEIGHT;
const METRE = WORLD_METRE * RIDE_UNIFORM_SCALE;

/**
 * THE FLYING CHAIRS — a big carousel chair swing, behind the food court.
 *
 * A recreation from the Sketchfab reference "Carousel Flying Chairs", built in
 * code the way every ride in this park was. The reference is a paid store
 * asset, so nothing is imported from it: this is an original build to the same
 * machine — a tall central column, a decorative rotating canopy, and a ring of
 * single chairs on long chains that fly outward as the ride turns.
 *
 * THE BRIEF, AND WHERE EACH PART OF IT LIVES:
 *
 *   "behind the food court" → PLACEMENT below. The ride stands on the food
 *                             court's own bearing from the main gate, out past
 *                             the far side of the court. It was first built
 *                             behind the sky tower and has since been moved
 *                             here; nothing but its own position changed.
 *   "should be bigg"        → an 82 m column and a 30 m flight radius: 89 m
 *                             overall, the second-tallest ride in the park —
 *                             taller than the Ferris Wheel, and deliberately
 *                             still under the sky tower, which stays the
 *                             landmark you navigate the park by.
 *   "20 seats"              → SEAT_COUNT, and nothing derives another number.
 *   "rotate in clock wise"  → ROTATION_SIGN, and the direction is asserted by
 *                             simulation rather than by reading the sign.
 *
 * THE TEAM IT CARRIES. The user later named this ride — "behind the tower ride
 * one ride is there that is for it support" — so it is signed "IT Support",
 * exactly as the Park Train is signed "DevOps". That is a LABEL, like every
 * other team name in this park: no employee's route changes, and IT Support
 * staff still walk to the Ferris Wheel, because this ride is not a
 * `DepartmentRideId` and adding it to the layout solver would move every
 * existing ride. See TEAM_NAME below.
 *
 * NOTHING ALREADY IN THE PARK MOVES. The ride is not handed to the layout
 * solver — a sixth box would re-solve all five existing positions and shift
 * the whole park — so it is placed in the clear ground that was already there.
 */

/* ------------------------------------------------------------------ *
 * THE TEAM IT IS SIGNED FOR
 * ------------------------------------------------------------------ */

/** This ride's own id, kept distinct from every `DepartmentRideId`. */
export const CHAIRS_TEAM_ID = "chairs" as const;
export type ChairsTeamId = typeof CHAIRS_TEAM_ID;

/** The team the Flying Chairs stand for. */
export const CHAIRS_TEAM_NAME = "IT Support";

/** The ride's own name, as its signboard and its fast-travel chip print it. */
export const CHAIRS_RIDE_NAME = "Flying Chairs";

/* ------------------------------------------------------------------ *
 * THE COUNT
 * ------------------------------------------------------------------ */

/** Exactly twenty chairs, evenly spaced. Nothing derives a different number. */
export const SEAT_COUNT = 20;
/** The angle between one chair and the next: a perfect 18°. */
export const SEAT_PITCH_RADIANS = (Math.PI * 2) / SEAT_COUNT;

/* ------------------------------------------------------------------ *
 * THE MACHINE — big, and in proportion
 * ------------------------------------------------------------------ */

/** Circular plinth the column stands on. */
export const BASE_RADIUS = 16 * METRE;
export const BASE_HEIGHT = 1.2 * METRE;
export const BASE_SKIRT_RADIUS = BASE_RADIUS + 1.8 * METRE;
export const BASE_SKIRT_HEIGHT = 0.5 * METRE;

/** The column, in four bolted sections, tapering as a real mast does. */
export const COLUMN_BOTTOM_Y = BASE_HEIGHT;
export const COLUMN_HEIGHT = 82 * METRE;
export const COLUMN_TOP_Y = COLUMN_BOTTOM_Y + COLUMN_HEIGHT;
export const COLUMN_BASE_RADIUS = 3.2 * METRE;
export const COLUMN_TOP_RADIUS = 1.6 * METRE;
export const COLUMN_JOINT_FRACTIONS = [0.26, 0.52, 0.78];
export const FLANGE_OVERHANG = 0.6 * METRE;
export const FLANGE_THICKNESS = 0.45 * METRE;

/** Foot ring and the gussets that stiffen the mast base. */
export const FOOT_RING_RADIUS = 6.2 * METRE;
export const FOOT_RING_HEIGHT = 1.7 * METRE;
export const GUSSET_COUNT = 10;
/*
 * The gussets' own dimensions, declared here rather than typed into Tower.tsx.
 *
 * They are exactly the numbers that plate was always drawn at — nothing about
 * the mast base has moved — but they are now READ by something: the sweep
 * comes down the mast to load, and how far it can come down is set by where
 * this stiffening starts. See LIFT_TRAVEL below. A dimension that another part
 * of the machine is solved against cannot stay a literal inside a mesh.
 */
export const GUSSET_RADIUS = COLUMN_BASE_RADIUS + 1.0 * METRE;
export const GUSSET_Y = COLUMN_BOTTOM_Y + 2.4 * METRE;
export const GUSSET_LENGTH = 2.0 * METRE;
export const GUSSET_HEIGHT = 4.0 * METRE;
export const GUSSET_THICKNESS = 0.18 * METRE;
/** The highest steel on the mast base — what the descending hub must clear. */
export const GUSSET_TOP_Y = GUSSET_Y + GUSSET_HEIGHT / 2;

/** The rotating hub, under the canopy. */
export const HUB_Y = COLUMN_BOTTOM_Y + 54 * METRE;
export const HUB_RADIUS = 3.4 * METRE;
export const HUB_HEIGHT = 5.0 * METRE;

/** Spider arms from the hub out under the canopy rim. */
export const ARM_COUNT = 10;
export const ARM_THICKNESS = 0.5 * METRE;
export const ARM_TIP_DROP = 1.8 * METRE;

/* ------------------------------------------------------------------ *
 * THE CANOPY
 * ------------------------------------------------------------------ */

export const CANOPY_RADIUS = 24 * METRE;
export const CANOPY_RIM_Y = COLUMN_BOTTOM_Y + 62 * METRE;
export const CANOPY_PEAK_Y = CANOPY_RIM_Y + 8.4 * METRE;
export const CANOPY_SHELL = 0.42 * METRE;
export const CANOPY_SOFFIT_Y = CANOPY_RIM_Y - 1.4 * METRE;

/** Scalloped valance around the rim — one scallop per chair, doubled. */
export const VALANCE_SCALLOPS = SEAT_COUNT * 2;
export const VALANCE_DROP = 2.0 * METRE;
export const VALANCE_RADIUS = 0.85 * METRE;

/** The crown on top: a lit drum and a finial. */
export const CROWN_RADIUS = 4.6 * METRE;
export const CROWN_HEIGHT = 4.4 * METRE;
export const CROWN_LAMP_COUNT = 20;
export const FINIAL_HEIGHT = 6.0 * METRE;

/* ------------------------------------------------------------------ *
 * THE CHAIRS
 * ------------------------------------------------------------------ */

/** Radius at which the hangers are bolted under the canopy. */
export const HANGER_RADIUS = 22 * METRE;
/** Suspension chains, hanger eye to chair shackle. */
/*
 * SHORTENED TWICE at the user's request — 16 m, then 9 m, now 6 m. A shorter
 * chain is not just a shorter line: it re-solves the conical pendulum. From
 * the original 16 m the flare has eased 30.8° → 25.9°, the chairs now fly
 * 24.6 m out instead of 30.2, and they ride 56.4 m up instead of 48.1, tucked
 * close under the canopy. All of that follows from this one number; none of it
 * is set by hand.
 */
export const CHAIN_LENGTH = 6 * METRE;
export const CHAIN_HALF_SPREAD = 0.46 * METRE;
export const CHAIN_LINK_PITCH = 0.6 * METRE;
export const CHAIN_LINK_RADIUS = 0.2 * METRE;
export const CHAIN_WIRE_RADIUS = 0.075 * METRE;

/**
 * The chair, sized from the person sitting in it.
 *
 * A single flying chair is a small object on an 89 m machine — 0.46 m of seat
 * subtends about two pixels from the park's own Drop Tower viewpoint, which is
 * how the first build of this ride came out: twenty chairs that were present,
 * correct and effectively invisible, leaving the ride reading as a bare canopy
 * on a pole.
 *
 * The fix is the one a real fairground already uses rather than a distortion
 * of the scale. Every flying chair has a painted back panel standing above the
 * seat — that is where the ride's livery goes — and its chains are heavy gauge
 * because they carry a person at 48 km/h. Both are modelled at their real
 * sizes, and between them they give each chair around two metres of coloured
 * mass instead of half a metre of dark blue. The rider is still 1.75 m and the
 * seat is still the park's own chair width.
 */
export const SEAT_WIDTH = PROP.chairWidth;
export const SEAT_DEPTH = 0.46 * WORLD_METRE;
export const SEAT_THICKNESS = 0.09 * WORLD_METRE;
export const SEAT_BACK_HEIGHT = HUMAN.shoulderY - PROP.chairSeatY;
export const SEAT_BACK_THICKNESS = 0.08 * WORLD_METRE;
export const LAP_BAR_RADIUS = 0.05 * WORLD_METRE;
export const LAP_BAR_DROP = 0.34 * WORLD_METRE;
export const FOOTREST_DROP = 0.58 * WORLD_METRE;
export const FOOTREST_DEPTH = 0.2 * WORLD_METRE;
/**
 * HOW MUCH BIGGER THE CHAIRS ARE THAN LIFE.
 *
 * The user asked for a bigger seat. Every dimension below is a real one taken
 * from the park's own 1.75 m figure, so rather than editing them apart — which
 * would leave a chair whose back no longer matches its pan — the whole chair
 * is scaled UNIFORMLY by this one factor. The chair stays a chair; it is
 * simply built at 2.2 times life size.
 *
 * Stating plainly what that costs: a seat is now 1.01 m across rather than the
 * 0.46 m a person actually sits in. That is a deliberate trade — a single
 * flying chair on an 89 m ride is otherwise a couple of pixels from anywhere
 * in the park — and it is the only place on this ride where a dimension is not
 * life-sized.
 */
export const CHAIR_SCALE = 2.2;

/** The painted back panel that carries the ride's livery. */
export const BACK_PANEL_HEIGHT = 0.95 * WORLD_METRE;
export const BACK_PANEL_WIDTH = 0.68 * WORLD_METRE;
export const BACK_PANEL_THICKNESS = 0.07 * WORLD_METRE;
/** Everything of a chair a viewer can see, top of panel to underside of footrest. */
export const CHAIR_VISIBLE_HEIGHT =
  (SEAT_BACK_HEIGHT + BACK_PANEL_HEIGHT + FOOTREST_DROP) * CHAIR_SCALE;

/* ------------------------------------------------------------------ *
 * HOW IT TURNS — clockwise, and how far the chairs fly
 * ------------------------------------------------------------------ */

/**
 * CLOCKWISE, SEEN FROM ABOVE.
 *
 * A positive rotation about +Y carries a point from +Z towards +X. In a plan
 * view — X to the right, Z down the screen — that is down-screen towards the
 * right, which is anticlockwise. So clockwise is the NEGATIVE direction, and
 * this constant is the sign the frame loop applies.
 *
 * That reasoning is easy to get backwards, so it is not trusted: the verify
 * script advances a real chair through the real rotation and checks which way
 * it actually went, by the sign of the cross product of its successive
 * positions. Reading a minus sign proves nothing; watching the chair does.
 */
export const ROTATION_SIGN = -1;

/**
 * Working rotation.
 *
 * Slow in revolutions because the ride is a big one: at a 30 m flight radius,
 * 4.2 rpm still carries a rider at 48 km/h, which is what a large wave swinger
 * actually runs at. Turning it faster would not make the ride look busier, it
 * would fling the chairs to an angle no chain swing reaches.
 */
export const ROTATION_RPM = 4.2;
export const ROTATION_RADIANS_PER_SEC = (ROTATION_RPM * Math.PI * 2) / 60;
export const GRAVITY = 9.80665;

/**
 * The flare angle of the chains, from a conical-pendulum balance.
 *
 * A chair hung at `HANGER_RADIUS` on a chain of `CHAIN_LENGTH` flies out until
 * the horizontal component of the chain tension supplies exactly the
 * centripetal force its circular path needs:
 *
 *     tan(theta) = omega^2 * R / g,   R = HANGER_RADIUS + CHAIN_LENGTH * sin(theta)
 *
 * R depends on theta and theta on R, so it is solved by fixed-point iteration
 * rather than assumed. The chairs in the park sit at the angle this geometry
 * at this speed actually produces; change either and they move correctly.
 *
 * The flare is the same either way round: a conical pendulum leans outward
 * along the radius, not backwards along the travel, so reversing the ride to
 * clockwise does not change where a chair hangs — only which way it goes.
 */
export function solveFlareAngle(omega: number = ROTATION_RADIANS_PER_SEC): number {
  let theta = 0.5;
  for (let i = 0; i < 300; i++) {
    const radius = HANGER_RADIUS + CHAIN_LENGTH * Math.sin(theta);
    const next = Math.atan((omega ** 2 * radius) / GRAVITY);
    if (Math.abs(next - theta) < 1e-13) return next;
    theta = next;
  }
  return theta;
}

/**
 * The flare at WORKING SPEED, which is the ride as it cruises.
 *
 * The solve is now a function of speed because the ride no longer runs at one
 * speed for ever: it comes down to load, stands still, and winds back up. A
 * chain hanging off a stationary sweep hangs plumb, and everything between
 * plumb and this angle is the same equation evaluated at the speed of the
 * moment. Called with no argument it is the cruise speed, so this constant —
 * and every number in the park derived from it — is exactly what it was.
 */
export const FLARE_ANGLE = solveFlareAngle();
/** The circle the chairs actually sweep, once flown out. */
export const FLIGHT_RADIUS = HANGER_RADIUS + CHAIN_LENGTH * Math.sin(FLARE_ANGLE);
/** Height of a chair above the ground while flying. */
export const SEAT_FLIGHT_Y = CANOPY_SOFFIT_Y - CHAIN_LENGTH * Math.cos(FLARE_ANGLE);
/** How fast a rider is carried. */
export const RIDER_SPEED = ROTATION_RADIANS_PER_SEC * FLIGHT_RADIUS;

/** Everything the ride occupies. */
export const OVERALL_HEIGHT = COLUMN_TOP_Y + FINIAL_HEIGHT;
export const OVERALL_REACH = Math.max(
  BASE_SKIRT_RADIUS,
  CANOPY_RADIUS,
  FLIGHT_RADIUS + SEAT_DEPTH * CHAIR_SCALE + 0.1,
);

/* ------------------------------------------------------------------ *
 * WHERE IT STANDS — solved against the park, not typed
 * ------------------------------------------------------------------ */

/**
 * Directly behind the food court, on the court's own bearing from the gate.
 *
 * The ride was first built behind the sky tower and has now been asked for
 * behind the food court instead, so the anchor changes and the method does
 * not: "behind" is still a direction rather than a coordinate, still taken
 * from the gate, and still resolved by pushing the ride out along that line
 * until it clears everything the park already has. Only the thing it stands
 * behind is different.
 *
 * The two sideways nudges the tower placement carried — five steps to the
 * right — went with the tower. They existed to settle the ride inside the
 * tower's slice of the view from the gate, and that is a silhouette this ride
 * no longer stands in, so carrying the offset forward would be keeping an
 * arbitrary 3.75 m for no reason anybody could read back.
 *
 * The distance is the nearest the ride can stand on that line while keeping
 * 12 m of clear ground to every ride footprint, 10 m to the railway, 8 m to
 * every department sign, the plaza and the food court, and 6 m to any paving —
 * measured from OVERALL_REACH, which is the flight circle plus a chair, not
 * the column. A swept chair is what arrives at the neighbour first.
 *
 * Behind the court, the court itself is what binds rather than a ride: it is
 * an 82 m square and this bearing leaves it corner-ward, so the constraint set
 * admits the ride from 91.4 m out from the court's centre. 95 m is used, which
 * stands the swept circle 37.3 m off the court's corner against the 33.7 m it
 * owes — a few metres in hand, the same margin the tower placement was given.
 * verify-flying-chairs.ts re-measures the whole set.
 */
/**
 * IT IS SOLVED NOW, NOT TYPED — because the park it was measured against has
 * been rebuilt.
 *
 * Ninety-five metres was the right answer when this ride's swept circle was
 * 25.7 m and its neighbours were the size they were. Every ride in the park is
 * now built to one common height, which grew this one's circle to 37.8 m and
 * the UFO Pendulum's to 80.8 m — and at ninety-five metres the chairs stood
 * 26 m from the pendulum against the 49.8 m the park's own margins ask for.
 * A number that was measured against a park that no longer exists is worse
 * than no number, so the distance is searched the same way every other
 * attraction here searches: straight out along the bearing, a metre at a time,
 * to the first place the ground will take it.
 *
 * The margins are the park's: 12 m to any ride footprint, 10 m past the rail to
 * the railway, 8 m to the plaza ring and the food court it stands behind — all
 * measured from OVERALL_REACH, because a swept chair is what arrives at a
 * neighbour first. Signs are not in this set on purpose: the boards are placed
 * after the rides and it is `rideSigns.ts` that keeps them off this ride's
 * circle, which is the only way round that is not a circular one.
 */
const RAILS: [number, number][] = Array.from({ length: 721 }, (_, i) => {
  const p = TRACK_CURVE.getPointAt(i / 720);
  return [p.x * TRAIN_SCALE, p.z * TRAIN_SCALE];
});

export const PLACEMENT_MARGINS = {
  ride: 12,
  railway: 10,
  plaza: 8,
  foodCourt: 8,
} as const;

function chairsShortfallAt(x: number, z: number): number {
  const reach = OVERALL_REACH;
  const rides = Math.min(
    ...PARK_LAYOUT.map((r) =>
      Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ)),
    ),
  );
  const railway = Math.min(...RAILS.map(([rx, rz]) => Math.hypot(x - rx, z - rz)));
  const plaza = Math.abs(
    Math.hypot(x - PLAZA_CENTER[0], z - PLAZA_CENTER[1]) - PLAZA_RADIUS,
  );
  const court = Math.hypot(
    Math.max(Math.abs(x - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0),
    Math.max(Math.abs(z - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0),
  );
  return Math.min(
    rides - (reach + PLACEMENT_MARGINS.ride),
    railway - (reach + TRACK_HALF_WIDTH_METRES + PLACEMENT_MARGINS.railway),
    plaza - (reach + PLACEMENT_MARGINS.plaza),
    court - (reach + PLACEMENT_MARGINS.foodCourt),
  );
}

/**
 * And it must not stand in FRONT of another ride from the entrance.
 *
 * The park's five silhouettes were separated angularly on purpose, and this
 * ride is big enough now to cover one: at the first distance that cleared every
 * margin it sat squarely across the UFO Pendulum's slice of the view. Standing
 * further out on the same bearing walks it out of that slice, which is what the
 * search does.
 */
function hidesARideFromGate(x: number, z: number): boolean {
  const ux = PARK_CENTER[0] - MAIN_VIEWPOINT[0];
  const uz = PARK_CENTER[1] - MAIN_VIEWPOINT[1];
  const ul = Math.hypot(ux, uz) || 1;
  const dx = x - MAIN_VIEWPOINT[0];
  const dz = z - MAIN_VIEWPOINT[1];
  const distance = Math.hypot(dx, dz) || 1;
  const bearing =
    (Math.atan2((ux / ul) * dz - (uz / ul) * dx, dx * (ux / ul) + dz * (uz / ul)) * 180) / Math.PI;
  const half = (Math.atan(OVERALL_REACH / distance) * 180) / Math.PI;
  return viewAngles(MAIN_VIEWPOINT, PARK_CENTER).some(
    (a) =>
      bearing + half > a.bearingDeg - a.halfWidthDeg &&
      bearing - half < a.bearingDeg + a.halfWidthDeg &&
      distance < a.distance,
  );
}

export const BEHIND_DISTANCE = (() => {
  const dx = (FOOD_COURT_CENTER[0] - GATE_X) / (Math.hypot(FOOD_COURT_CENTER[0] - GATE_X, FOOD_COURT_CENTER[1] - GATE_Z) || 1);
  const dz = (FOOD_COURT_CENTER[1] - GATE_Z) / (Math.hypot(FOOD_COURT_CENTER[0] - GATE_X, FOOD_COURT_CENTER[1] - GATE_Z) || 1);
  for (let d = FOOD_COURT_HALF + OVERALL_REACH; d <= 1200; d += 1) {
    const x = FOOD_COURT_CENTER[0] + dx * d;
    const z = FOOD_COURT_CENTER[1] + dz * d;
    if (chairsShortfallAt(x, z) >= 6 && !hidesARideFromGate(x, z)) return d;
  }
  throw new Error("No ground behind the food court clears every margin the Flying Chairs need");
})();

const toCourtX = FOOD_COURT_CENTER[0] - GATE_X;
const toCourtZ = FOOD_COURT_CENTER[1] - GATE_Z;
const toCourtLength = Math.hypot(toCourtX, toCourtZ) || 1;

/** World position of the column's centre line. */
export const RIDE_CENTER: [number, number] = [
  FOOD_COURT_CENTER[0] + (toCourtX / toCourtLength) * BEHIND_DISTANCE,
  FOOD_COURT_CENTER[1] + (toCourtZ / toCourtLength) * BEHIND_DISTANCE,
];

/* ------------------------------------------------------------------ *
 * LOADING — THE SWEEP COMES DOWN, AND THERE IS A WAY UP TO IT
 * ------------------------------------------------------------------ */

/**
 * "the round roof like structure need to be down and up with that chairs for
 *  the people to claim on the ride and get down on the ride"
 *
 * This is how a real wave swinger works and the one thing this ride was
 * missing: the canopy, its spider and all twenty chairs ride UP AND DOWN the
 * mast as one sweep. It comes down to a loading gallery, stands still while
 * people get on and off, winds up to speed as it climbs, cruises, and comes
 * back down. Nothing about the ride at cruise changes — the canopy, the chairs
 * and the flare at the top of the lift are the numbers they always were; the
 * ride simply now spends part of its cycle somewhere else.
 *
 * HOW FAR DOWN IT CAN COME IS NOT A CHOICE. The sweep is a hub that slides on
 * the mast, and the mast has ten stiffening gussets around its foot. The hub
 * stops when it reaches them, so the drop is the distance from where the hub
 * sits at cruise down to the top of that stiffening, less a steel-to-steel
 * gap. Every height below follows from it, and the loading gallery is put
 * where the chairs actually arrive rather than the chairs being dropped to
 * where a gallery was drawn.
 */

/** Steel-to-steel gap kept between the descending hub and the mast gussets. */
export const SWEEP_CLEARANCE = 0.8 * METRE;

/** How far the whole sweep travels down the mast, solved against the gussets. */
export const LIFT_TRAVEL = HUB_Y - (GUSSET_TOP_Y + SWEEP_CLEARANCE);

/** The canopy soffit at the bottom of the drop — the loading position. */
export const SWEEP_LOAD_SOFFIT_Y = CANOPY_SOFFIT_Y - LIFT_TRAVEL;

/**
 * Where a chair's seat pan is while loading.
 *
 * A stationary sweep means chains hanging plumb, so a chair is simply one
 * chain length below the soffit, on the hanger circle. It does not fly out
 * until the ride turns.
 */
export const SEAT_LOAD_Y = SWEEP_LOAD_SOFFIT_Y - CHAIN_LENGTH;

/** How far the footrest hangs below the seat pan, at the size chairs are built. */
export const CHAIR_FOOT_DROP = FOOTREST_DROP * CHAIR_SCALE;

/* ---------------- the loading gallery ---------------- */

/** Air left between a loaded chair's footrest and the gallery deck. */
export const PLATFORM_CLEARANCE = 0.3 * WORLD_METRE;

/**
 * The gallery deck, set by where the chairs stop rather than by preference.
 *
 * STATING WHAT THIS COSTS. The chairs are built at CHAIR_SCALE — 2.2 times
 * life size, which is the one deliberate distortion on this ride — so a seat
 * pan sits `CHAIR_FOOT_DROP` above its own footrest, and with the deck laid
 * under the footrest the pan comes out about 1.6 m above the boards. A rider
 * steps onto the footrest and climbs in rather than sitting straight down.
 * That is the scale factor showing, not a mistake in the gallery: laying the
 * deck any higher would put the boards through the footrests.
 */
export const PLATFORM_Y = SEAT_LOAD_Y - CHAIR_FOOT_DROP - PLATFORM_CLEARANCE;
export const PLATFORM_THICKNESS = 0.32 * METRE;

/**
 * An annular gallery two metres either side of the hanger circle, so a rider
 * stands under the chair they are getting into.
 *
 * The outer edge stays INSIDE `OVERALL_REACH` — the swept circle of a flying
 * chair, which is already the widest thing about this ride — so the gallery
 * adds nothing to the ride's footprint and every clearance the ride was placed
 * by is exactly as it was. Nothing in the park had to move for it.
 */
export const PLATFORM_HALF_WIDTH = 2.0 * METRE;
export const PLATFORM_INNER_RADIUS = HANGER_RADIUS - PLATFORM_HALF_WIDTH;
export const PLATFORM_OUTER_RADIUS = HANGER_RADIUS + PLATFORM_HALF_WIDTH;

/** Guard rails, at the park's own handrail height. */
export const RAIL_HEIGHT = PROP.railHeight;
export const RAIL_RADIUS = 0.055 * WORLD_METRE;
export const RAIL_POST_COUNT = SEAT_COUNT;
/** Legs and ring beam carrying the deck, on the hanger circle. */
export const PLATFORM_LEG_COUNT = 12;
export const PLATFORM_LEG_RADIUS = 0.24 * METRE;

/* ---------------- the ladder ---------------- */

/**
 * "place a ladder".
 *
 * The gallery is five metres up — that is where the chairs arrive — so the way
 * onto it is a proper caged ladder from the grass, not a step. It stands just
 * inboard of the deck's inner edge, where nothing on the machine can ever
 * reach it: the chairs hang on the 22 m hanger circle and only ever fly
 * outward from there, so the whole inner apron is dead ground.
 *
 * It faces the main gate, because that is the side a visitor arrives from.
 * The bearing is taken from the gate rather than typed, so it stays correct if
 * the ride is ever moved again.
 */
export const LADDER_STANDOFF = 0.45 * WORLD_METRE;
export const LADDER_RADIUS = PLATFORM_INNER_RADIUS - LADDER_STANDOFF;
export const LADDER_WIDTH = 0.52 * WORLD_METRE;
export const LADDER_STILE_RADIUS = 0.05 * WORLD_METRE;
export const LADDER_RUNG_RADIUS = 0.028 * WORLD_METRE;
/** A climbable pitch, and the whole of the ladder in rungs of it. */
export const LADDER_RUNG_PITCH = 0.28 * WORLD_METRE;
export const LADDER_RUNG_COUNT = Math.floor(PLATFORM_Y / LADDER_RUNG_PITCH);
/** Grab extension standing above the landing, as every fixed ladder has. */
export const LADDER_GRAB_HEIGHT = 1.1 * WORLD_METRE;
export const LADDER_TOP_Y = PLATFORM_Y + LADDER_GRAB_HEIGHT;
/** Back hoops start where a fall would start to matter. */
export const LADDER_CAGE_FROM_Y = 2.2 * WORLD_METRE;
export const LADDER_CAGE_PITCH = 0.9 * WORLD_METRE;
export const LADDER_CAGE_RADIUS = 0.38 * WORLD_METRE;

/** Bearing from the ride to the main gate — the side the ladder is put on. */
export const LADDER_AZIMUTH = Math.atan2(GATE_Z - RIDE_CENTER[1], GATE_X - RIDE_CENTER[0]);
/**
 * The opening left in the inner hand rail for a rider to step through at the
 * top of the ladder: the ladder's own width and a clear half metre either
 * side, expressed as the angle that subtends on the gallery's inner edge.
 */
export const LADDER_GATE_ARC = (LADDER_WIDTH + 1.0 * WORLD_METRE) / PLATFORM_INNER_RADIUS;

/* ------------------------------------------------------------------ *
 * THE PALETTE
 * ------------------------------------------------------------------ */

/** Fairground livery: cream and red canopy, brass trim, blue chairs. */
export const PALETTE = {
  steel: "#c6d0dc",
  steelDark: "#7b8797",
  steelShadow: "#4a525f",
  brass: "#dCa73f",
  brassDark: "#a3761d",
  canopyCream: "#f5ede2",
  canopyRed: "#c22a3d",
  valance: "#f2c14e",
  seatBody: "#1f4f8f",
  seatCushion: "#dbe2ea",
  seatTrim: "#dCa73f",
  deck: "#3c4351",
  deckTrim: "#c22a3d",
  lamp: "#ffe6a8",
} as const;

/**
 * The livery the back panels are painted in, dealt round the ring.
 *
 * Bright and varied on purpose: twenty small chairs read as a ring of colour
 * against the grass and the sky where twenty dark ones read as nothing at all.
 * The run is shorter than the seat count so it repeats around the ring, and
 * its length shares no factor with twenty beyond one, so no two neighbours
 * ever come out the same colour.
 */
export const CHAIR_COLORS = [
  "#e8b23c",
  "#d94f3d",
  "#3f9f8f",
  "#e5e0d2",
  "#7a6fb0",
  "#f0f4f8",
  "#2f7fbf",
] as const;

export function chairColor(index: number): string {
  return CHAIR_COLORS[index % CHAIR_COLORS.length];
}

/* ------------------------------------------------------------------ *
 * SELF-CHECK
 * ------------------------------------------------------------------ */

export function validateFlyingChairs(): void {
  console.assert(
    Math.abs(OVERALL_HEIGHT - UNIFORM_RIDE_HEIGHT) < 0.01,
    `Every ride in this park is ${UNIFORM_RIDE_HEIGHT} m; this one is ${OVERALL_HEIGHT}`,
  );
  console.assert(SEAT_COUNT === 20, `The brief is exactly 20 seats; found ${SEAT_COUNT}`);
  console.assert(
    Math.abs(SEAT_PITCH_RADIANS * SEAT_COUNT - Math.PI * 2) < 1e-12,
    "The chairs do not close the circle exactly",
  );
  console.assert(ROTATION_SIGN === -1, "The brief is clockwise; the sign says otherwise");
  console.assert(
    HANGER_RADIUS < CANOPY_RADIUS,
    "The hangers must be under the canopy, not outside its edge",
  );
  console.assert(
    SEAT_FLIGHT_Y - FOOTREST_DROP > BASE_HEIGHT,
    "A flying chair would strike the plinth",
  );
  console.assert(
    LIFT_TRAVEL > 0 && HUB_Y - LIFT_TRAVEL > GUSSET_TOP_Y,
    "The descending sweep would come down onto the mast gussets",
  );
  console.assert(
    SEAT_LOAD_Y - CHAIR_FOOT_DROP > PLATFORM_Y,
    "A chair would land on the loading gallery rather than hang over it",
  );
  console.assert(
    PLATFORM_OUTER_RADIUS <= OVERALL_REACH,
    "The loading gallery would widen the ride and break its placement",
  );
  console.assert(
    PLATFORM_Y + RAIL_HEIGHT < SWEEP_LOAD_SOFFIT_Y - VALANCE_DROP,
    "The canopy would come down onto the gallery rail",
  );
}
