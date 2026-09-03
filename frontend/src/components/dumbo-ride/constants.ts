import { EMPLOYEE_HEIGHT, EMPLOYEE_SCALE, HUMAN, METRE as WORLD_METRE, PROP } from "@/world/scale";
import { UNIFORM_RIDE_HEIGHT } from "@/components/park/uniformRideHeight";

/**
 * EVERY RIDE IN THE PARK IS NOW THE SAME SIZE, and this is how this one gets
 * there.
 *
 * The machine below was authored at 44.2356 m. The park's common height is the
 * Risk ride's, so this ride is multiplied by ONE factor on every axis — done
 * once, here, by redefining what a metre means inside this file. Every
 * dimension on the page is written as so many metres, so scaling the unit
 * scales the whole machine and no part of it can be missed.
 *
 * DOING IT HERE RATHER THAN AS A GROUP SCALE IN THE SCENE keeps the physics
 * honest: the arms' climb is capped by the hydraulics at a speed in metres per second,
 * and SWEEP_BUDGET divides that cap by the excursion the vehicles actually
 * have. Scaling the machine here re-solves how high a rider may take it; a
 * group scale in the scene would have left sixteen riders flying a small
 * ride's arc drawn three times over.
 *
 * WHAT DOES NOT SCALE is anything measured from a PERSON. Riders are 3.4 m
 * tall whatever ride they are on, so seat widths, back heights and handholds
 * stay the size they are everywhere else in the park.
 *
 * AUTHORED_OVERALL_HEIGHT is what this page describes at 1x. It is frozen
 * rather than derived, because the scale has to be known before the dimensions
 * it multiplies; the validator below asserts the ride actually lands on the
 * park's common height, so a wrong figure here fails loudly instead of quietly
 * making this ride the odd one out.
 */
const AUTHORED_OVERALL_HEIGHT = 44.2356;
export const RIDE_UNIFORM_SCALE = UNIFORM_RIDE_HEIGHT / AUTHORED_OVERALL_HEIGHT;
const METRE = WORLD_METRE * RIDE_UNIFORM_SCALE;

/**
 * THE DUMBO RIDE — flying elephants on arms that rise and fall.
 *
 * A recreation of the machine in the Sketchfab model "The Amazing Dumbo Ride"
 * by SamanthaSoliz. The model carries no description at all, so what is built
 * here is the machine everybody means by that name: a rotating hub under a
 * decorated canopy, sixteen arms radiating from it, a flying elephant on the
 * end of each one, and a lever in every vehicle that lets the riders take
 * themselves up and down while the ride turns.
 *
 * THE BRIEF: "i want this ride should be placed behind the data engineers".
 * The Data Engineering ride is the UFO Pendulum, so this stands behind it —
 * on the gate's own line of sight through it, out past the Tea Cups that are
 * already back there. See placement.ts.
 *
 * HOW BIG, AND WHY NOT 127 m. The park's two newest rides are both 127 m, and
 * this one deliberately is not. A Dumbo's height IS the height its vehicles
 * fly at, and they have to come back down to the platform to be got into — so
 * making the ride 127 m tall would mean either a hundred-metre arm, which is a
 * different machine, or elephants flying round the foot of a tower that has
 * nothing to do with them. What it is instead is a BIG one: three and a half
 * times the real thing, forty-three metres to the finial, with the elephants
 * flying to thirty. If it should match the Tea Cups after all, ARM_LENGTH and
 * HUB_Y are the two knobs and everything on this page follows them.
 *
 * NOTHING ALREADY IN THE PARK MOVES. The ride is not handed to the layout
 * solver — a sixth box would re-solve all five existing positions — so it is
 * placed in ground that was already clear.
 */

/* ------------------------------------------------------------------ *
 * WHAT IT IS CALLED
 * ------------------------------------------------------------------ */

export const DUMBO_RIDE_ID = "dumbo" as const;
export type DumboRideId = typeof DUMBO_RIDE_ID;
export const DUMBO_RIDE_NAME = "Dumbo Ride";

/**
 * THE TEAM THIS RIDE IS NAMED FOR — "the dumpo ride is for finance".
 *
 * A LABEL, and nothing else. Naming a team against a ride relabels that ride's
 * signboard in this park; it never touches the roster, the department mapping
 * or where anybody walks. Finance is not a department in the employee data at
 * all, so there is nobody to re-route even if that were the rule — exactly as
 * with Risk on the Tea Cups and DevOps on the Park Train.
 */
export const DUMBO_TEAM_NAME = "Finance";

/** The ride it was asked to stand behind: the Data Engineering ride. */
export const BEHIND_RIDE_ID = "ufo";

/* ------------------------------------------------------------------ *
 * SIXTEEN ELEPHANTS, TWO RIDERS EACH
 * ------------------------------------------------------------------ */

/**
 * Sixteen vehicles carrying two apiece — which is both what a real Dumbo has
 * and what this park's rule about thirty to forty riders asks for.
 */
export const SEATS_PER_VEHICLE = 2;
export const VEHICLE_COUNT = 16;
export const SEAT_COUNT = VEHICLE_COUNT * SEATS_PER_VEHICLE;
/** The angle between one arm and the next: a perfect 22.5°. */
export const ARM_PITCH_RADIANS = (Math.PI * 2) / VEHICLE_COUNT;

/* ------------------------------------------------------------------ *
 * THE MACHINE
 * ------------------------------------------------------------------ */

/**
 * How much larger than life the elephants are built, uniformly.
 *
 * Tied to the PARK'S OWN PEOPLE rather than picked: this park draws an
 * employee 3.4 m tall, so a life-sized 2.6 m elephant would be a pony they
 * could not sit in. A third larger again than the figures it carries is what
 * makes a howdah two of them fit in, and it keeps following the figure if the
 * employee height is reset — which it has been three times already. It lands
 * at about two and a half, next to the Flying Chairs' 2.2x and the Super
 * Looper's 2.56x.
 */
export const RIDE_SCALE = EMPLOYEE_SCALE * 1.3;

export const PLINTH_RADIUS = 26 * METRE;
export const PLINTH_HEIGHT = 1.1 * METRE;

/** The column the whole ride turns on, and the hub the arms pivot at. */
export const COLUMN_RADIUS = 1.5 * METRE;
export const HUB_Y = 26 * METRE;
export const HUB_RADIUS = 3.2 * METRE;
export const HUB_HEIGHT = 4.0 * METRE;

/**
 * The arm, and how far it swings.
 *
 * The arm is hinged at the hub and the elephant rides its far end, so the
 * vehicle's height is `HUB_Y + ARM_LENGTH * sin(angle)` and nothing else. The
 * swing is set by the two ends it has to reach: DOWN must put the elephant on
 * the platform for people to climb into, and UP is then the same angle the
 * other way. So the machine is solved from where a rider gets on rather than
 * from a pair of chosen angles.
 */
/*
 * Long enough that sixteen elephants fit round the circle it sweeps with room
 * between them. Sixteen vehicles on a twenty-seven metre circle get ten and a
 * half metres of arc apiece for a six-and-a-half metre elephant; at twenty-two
 * metres an earlier, larger elephant overlapped its neighbour by half a metre,
 * which is what put the check in `validateDumboRide` in the first place.
 */
export const ARM_LENGTH = 27 * METRE;
export const ARM_RADIUS = 0.42 * METRE;
export const ARM_HANGER = 1.6 * METRE;


/* ------------------------------------------------------------------ *
 * THE ELEPHANT
 * ------------------------------------------------------------------ */

/**
 * A flying elephant, sized from the two people in its howdah and then grown by
 * RIDE_SCALE as one piece. Everything below is a real elephant's proportion —
 * a 2.6 m body, a 0.7 m leg, a 1.5 m trunk — multiplied by the one factor, so
 * the animal stays an animal at any size the ride is built to.
 */
export const BODY_LENGTH = 2.6 * RIDE_SCALE * METRE;
export const BODY_RADIUS = 0.85 * RIDE_SCALE * METRE;
export const HEAD_RADIUS = 0.62 * RIDE_SCALE * METRE;
export const EAR_RADIUS = 0.66 * RIDE_SCALE * METRE;
export const EAR_THICKNESS = 0.1 * RIDE_SCALE * METRE;
export const TRUNK_RADIUS = 0.16 * RIDE_SCALE * METRE;
export const TRUNK_LENGTH = 1.5 * RIDE_SCALE * METRE;
export const LEG_RADIUS = 0.24 * RIDE_SCALE * METRE;
export const LEG_LENGTH = 0.7 * RIDE_SCALE * METRE;
/** The howdah on its back, which is where the riders actually sit. */
export const HOWDAH_LENGTH = 1.5 * RIDE_SCALE * METRE;
export const HOWDAH_WIDTH = SEATS_PER_VEHICLE * PROP.chairWidth * RIDE_SCALE + 0.3 * METRE;
export const HOWDAH_WALL = 0.5 * RIDE_SCALE * METRE;
export const SEAT_PAN_Y = PROP.chairSeatY * RIDE_SCALE;
export const SEAT_BACK_HEIGHT = (HUMAN.shoulderY - PROP.chairSeatY) * RIDE_SCALE;

/**
 * WHERE AN ELEPHANT COMES DOWN TO, and therefore where the platform is.
 *
 * The chain of reasoning runs from the rider outward, not from a chosen deck
 * height inward:
 *
 *   1. A flying elephant is FLYING, so when the ride is stopped its feet still
 *      hang clear of the ride's base — FOOT_CLEARANCE above the plinth, which
 *      is a full headroom, because people walk under them to get in.
 *   2. Its howdah sits on its back, SILL_ABOVE_FEET higher.
 *   3. So the boarding gallery is built at exactly that sill height, and
 *      somebody standing on it steps across into the howdah rather than
 *      climbing anything. DECK_Y is derived; it is not a number picked.
 *   4. The arm carries the vehicle from a hanger above its back, so the arm's
 *      far end when down is one hanger higher again.
 *
 * That is what "the ride comes down to the people" has to mean on a machine
 * this size: the elephants descend twenty-three metres to meet the gallery,
 * and the only climbing anybody does is the park's own boarding stair up to
 * it — the same stair, from the same module, as the other rides here.
 */
/*
 * High enough to WALK UNDER. The gallery stands inside the ring the elephants
 * sweep, so everybody boarding this ride passes beneath a parked one on the
 * way in — which makes the clearance a headroom rather than a gap, and it is
 * measured from the park's own 3.4 m employee.
 */
export const FOOT_CLEARANCE = (EMPLOYEE_HEIGHT + 0.6 * WORLD_METRE) * RIDE_UNIFORM_SCALE;
export const SILL_ABOVE_FEET = LEG_LENGTH + BODY_RADIUS * 1.5;
/** The elephant's feet, stopped, waiting to be got into. */
export const VEHICLE_FOOT_LOAD_Y = PLINTH_HEIGHT + FOOT_CLEARANCE;
/** So the gallery is level with the howdah's sill. */
export const DECK_Y = VEHICLE_FOOT_LOAD_Y + SILL_ABOVE_FEET;
/** And the arm's far end, which is what the swing is actually measured to. */
export const VEHICLE_LOAD_Y = DECK_Y + ARM_HANGER;
/** So the swing is whatever brings it there, and the same again upward. */
export const ARM_SWING = Math.asin((HUB_Y - VEHICLE_LOAD_Y) / ARM_LENGTH);
/** And the top of a vehicle's flight. */
export const VEHICLE_TOP_Y = HUB_Y + ARM_LENGTH * Math.sin(ARM_SWING);
/** The circle the vehicles sweep, at the widest — the arm horizontal. */
export const FLIGHT_RADIUS = ARM_LENGTH;

/* ------------------------------------------------------------------ *
 * THE CANOPY
 * ------------------------------------------------------------------ */

/**
 * The umbrella over the hub, and the one thing it has to clear: the ARMS.
 *
 * The elephants fly a long way outside this canopy — the nearest they ever get
 * is the circle they park on, at twenty-three metres, and the canopy is under
 * ten — so what passes beneath its rim is not a vehicle but the arms that
 * carry them. An arm at the canopy's own radius stands `CANOPY_RADIUS *
 * sin(ARM_SWING)` above the hub at the top of its lift, so THAT is the height
 * the rim is measured from. Drawn from the hub alone it fouled the arms; drawn
 * from the top of the flight instead it became a hat forty metres up with
 * nothing under it.
 */
export const CANOPY_RADIUS = 9.5 * METRE;
export const CANOPY_CLEARANCE = 3 * METRE;
export const CANOPY_RIM_Y =
  HUB_Y + CANOPY_RADIUS * Math.sin(ARM_SWING) + CANOPY_CLEARANCE;
export const CANOPY_PEAK_Y = CANOPY_RIM_Y + 4.2 * METRE;
export const CANOPY_SHELL = 0.3 * METRE;
export const VALANCE_SCALLOPS = VEHICLE_COUNT * 2;
export const VALANCE_DROP = 1.3 * METRE;
export const CROWN_RADIUS = 2.0 * METRE;
export const CROWN_HEIGHT = 2.4 * METRE;
export const FINIAL_HEIGHT = 3.6 * METRE;
export const LAMP_COUNT = VALANCE_SCALLOPS;
export const LAMP_RADIUS = 0.24 * METRE;

/* ------------------------------------------------------------------ *
 * HOW IT TURNS, AND HOW THE ELEPHANTS FLY
 * ------------------------------------------------------------------ */

export const GRAVITY = 9.80665;

/**
 * The turntable's speed is set by how fast it carries a rider, not by an rpm.
 *
 * A Dumbo is a gentle machine — the fun is the lever, not the speed — so the
 * figure that matters is the pace a rider is carried round at, and six metres
 * a second is a brisk jog. The rpm falls out of that and out of how far the
 * arms reach.
 */
export const RIDER_SPEED = 6.0 * METRE;
export const ROTATION_RADIANS_PER_SEC = RIDER_SPEED / FLIGHT_RADIUS;
export const ROTATION_RPM = (ROTATION_RADIANS_PER_SEC * 60) / (Math.PI * 2);

/**
 * How fast an elephant can be flown up and down.
 *
 * The rider works a lever and the arm follows; what stops it being a fairground
 * catapult is the hydraulics, so the vehicle's vertical speed is capped. Two
 * and a half metres a second is a brisk lift and a gentle one to sit in.
 */
export const CLIMB_SPEED = 2.5 * METRE;
/** The whole excursion, gallery to top. */
export const FLIGHT_RISE = VEHICLE_TOP_Y - VEHICLE_LOAD_Y;
/** So the shortest a single climb can take is this. */
export const CLIMB_SECONDS = FLIGHT_RISE / CLIMB_SPEED;

/** The dwell either side of the run, and the ramps between. */
export const LOAD_SECONDS = 9;
export const SPIN_UP_SECONDS = 6;
export const RUN_SECONDS = 40;
export const SPIN_DOWN_SECONDS = 6;
export const UNLOAD_SECONDS = 7;

/**
 * WHAT A RIDER IS ALLOWED TO DO WITH THE LEVER — the one constraint that
 * decides how the sixteen elephants fly.
 *
 * Each rider flies a whole number of sweeps during the run, starting and
 * finishing at the bottom: that is not a stylistic choice but the only way the
 * arms can be down again at the end without the machine hauling them down.
 * A vehicle taking `k` sweeps of amplitude `a` (as a fraction of the full
 * excursion) rises as `a * FLIGHT_RISE * (1 - cos(2 pi k t / RUN)) / 2`, whose
 * fastest moment is `a * k * pi * FLIGHT_RISE / RUN`. Cap that at CLIMB_SPEED
 * and the whole freedom of the ride collapses to one number:
 *
 *     a * k  <=  CLIMB_SPEED * RUN_SECONDS / (pi * FLIGHT_RISE)
 *
 * So one rider may take a single climb to the very top, and another may pump
 * twice at half the height, and neither can outrun the hydraulics. Sixteen
 * different allowances inside that budget are what make the ring fly at
 * sixteen different heights — see ring.ts.
 */
export const SWEEP_BUDGET = (CLIMB_SPEED * RUN_SECONDS) / (Math.PI * FLIGHT_RISE);

/* ------------------------------------------------------------------ *
 * GETTING ON
 * ------------------------------------------------------------------ */

export const RAIL_HEIGHT = PROP.railHeight * EMPLOYEE_SCALE;
export const GATE_WIDTH = 3.4 * METRE;

/**
 * THE BOARDING GALLERY, a ring inside the ring the elephants sweep.
 *
 * The elephants park at `ARM_LENGTH * cos(ARM_SWING)` — not at the full arm
 * length, which they only reach halfway up, when the arm is horizontal. The
 * gallery is built just inside that parking circle, a step's width from the
 * flank of a parked elephant, so a rider walks out along it and steps across
 * into a howdah that is level with the deck.
 */
export const BODY_HALF_WIDTH = BODY_RADIUS * 0.85;
export const BOARDING_RADIUS = ARM_LENGTH * Math.cos(ARM_SWING);
export const STEP_ACROSS = 0.25 * METRE;
export const GALLERY_OUTER_RADIUS = BOARDING_RADIUS - BODY_HALF_WIDTH - STEP_ACROSS;
export const GALLERY_WIDTH = 6 * METRE;
export const GALLERY_INNER_RADIUS = GALLERY_OUTER_RADIUS - GALLERY_WIDTH;
export const GALLERY_THICKNESS = 0.4 * METRE;
export const GALLERY_POSTS = VEHICLE_COUNT;

/* ------------------------------------------------------------------ *
 * WHAT IT OCCUPIES
 * ------------------------------------------------------------------ */

/**
 * The tallest thing on the ride, whichever it is. On this machine it is a race
 * between the finial over the hub and an elephant at the top of its lift, and
 * the two are within a few metres of each other — so it is taken rather than
 * assumed.
 */
export const OVERALL_HEIGHT = Math.max(
  CANOPY_PEAK_Y + CROWN_HEIGHT + FINIAL_HEIGHT,
  VEHICLE_TOP_Y,
);
export const OVERALL_REACH = Math.max(
  PLINTH_RADIUS,
  FLIGHT_RADIUS + BODY_LENGTH / 2 + 1 * METRE,
);

/* ------------------------------------------------------------------ *
 * THE PALETTE
 * ------------------------------------------------------------------ */

export const PALETTE = {
  hide: "#8f93a8",
  hideShade: "#6f7488",
  ear: "#b98fa0",
  eye: "#f4f2ee",
  pupil: "#20222a",
  howdah: "#c9302c",
  howdahTrim: "#e8c26a",
  cushion: "#f2e7d0",
  canopyCream: "#f6efe2",
  canopyRed: "#d4453f",
  valance: "#e8c26a",
  column: "#f0e6d6",
  columnTrim: "#c9302c",
  steel: "#9aa3ad",
  steelDark: "#565f6b",
  plinth: "#cfc7b8",
  plinthTrim: "#3f6f5a",
  deck: "#8a6f5c",
  brass: "#d2a441",
  lamp: "#fff2c0",
} as const;

/** The howdahs' liveries, dealt round the ring. */
export const HOWDAH_COLORS = [
  "#c9302c",
  "#2f7fbf",
  "#e0a53c",
  "#4f9e6a",
  "#8a6fb5",
] as const;

export function howdahColor(index: number): string {
  return HOWDAH_COLORS[index % HOWDAH_COLORS.length];
}

/* ------------------------------------------------------------------ *
 * SELF-CHECK
 * ------------------------------------------------------------------ */

export function validateDumboRide(): void {
  console.assert(
    Math.abs(OVERALL_HEIGHT - UNIFORM_RIDE_HEIGHT) < 0.01,
    `Every ride in this park is ${UNIFORM_RIDE_HEIGHT} m; this one is ${OVERALL_HEIGHT}`,
  );
  console.assert(
    SEAT_COUNT >= 30 && SEAT_COUNT <= 40,
    `Every ride in this park carries 30-40; this one carries ${SEAT_COUNT}`,
  );
  console.assert(
    Math.abs(ARM_PITCH_RADIANS * VEHICLE_COUNT - Math.PI * 2) < 1e-12,
    "The arms do not close the circle exactly",
  );
  console.assert(
    Math.abs(HUB_Y - ARM_LENGTH * Math.sin(ARM_SWING) - VEHICLE_LOAD_Y) < 1e-9,
    "The elephants do not come down to the platform they are boarded from",
  );
  console.assert(
    SWEEP_BUDGET >= 1,
    "The run is too short for even one rider to reach the top of the arc",
  );
  console.assert(
    2 * FLIGHT_RADIUS * Math.sin(ARM_PITCH_RADIANS / 2) > BODY_LENGTH,
    "Neighbouring elephants would touch",
  );
  console.assert(
    CANOPY_RIM_Y > HUB_Y + CANOPY_RADIUS * Math.sin(ARM_SWING),
    "A lifted arm would strike the canopy it passes under",
  );
  console.assert(
    ARM_LENGTH * Math.cos(ARM_SWING) - BODY_RADIUS * 0.85 > CANOPY_RADIUS,
    "The elephants fly through the canopy rather than outside it",
  );
  console.assert(
    BOARDING_RADIUS - BODY_RADIUS * 0.85 > GALLERY_OUTER_RADIUS,
    "A parked elephant overlaps the gallery people board it from",
  );
  console.assert(
    FOOT_CLEARANCE > EMPLOYEE_HEIGHT,
    "Nobody could walk under a parked elephant to reach the gallery",
  );
}
