import { HUMAN, METRE, PROP } from "@/world/scale";

/**
 * THE TEA CUPS — a Beston tea cup ride.
 *
 * Built to the manufacturer's own published machine at
 * bestonrides.com/tea-cup-rides: twenty-four riders a cycle, a six-metre
 * rotating plate in an eight-metre square of ground, turning at 3.8 rpm, under
 * a decorated ceiling with cornices, middle screens and RGB lighting. Nothing
 * is imported from anywhere; like every other ride in this park it is an
 * original build in code to the same machine.
 *
 * WHAT THE MACHINE IS. Two rotations, stacked: one big plate carrying the cups
 * round, and every cup spinning on its own axis. The counter-rotation is the
 * whole sensation of the ride — the two motions add on one side of each turn
 * and cancel on the other, so a rider is swung out and let go, over and over,
 * on a machine that never goes faster than a walk.
 *
 * THE BRIEF: "i want this ride should be present behind the dataengineering
 * ride". The Data Engineering ride is the UFO Pendulum, so that is what this
 * one stands behind — see placement.ts, which takes "behind" as a direction
 * from the main gate rather than as a coordinate.
 *
 * HOW BIG, AND WHY IT IS NOT THE MANUFACTURER'S SIZE. Every dimension here is
 * Beston's, multiplied by one factor. A real tea cup ride is an eight-metre
 * square machine, and eight metres in a park whose rides run from sixty to
 * ninety would be a model of a ride rather than a ride: its cups would be a
 * couple of pixels from anywhere a visitor stands, which is exactly how the
 * Flying Chairs' first build came out. So it is scaled the way this park
 * always scales a thing too small to read — uniformly, never stretched — and
 * the factor is stated rather than hidden. See RIDE_SCALE.
 *
 * NOTHING ALREADY IN THE PARK MOVES. The ride is not handed to the layout
 * solver — a sixth box would re-solve all five existing positions and shift
 * the whole park — so it is placed in ground that was already clear.
 */

/* ------------------------------------------------------------------ *
 * WHAT IT IS CALLED
 * ------------------------------------------------------------------ */

/** This ride's own id, kept distinct from every `DepartmentRideId`. */
export const TEACUPS_RIDE_ID = "teacups" as const;
export type TeacupsRideId = typeof TEACUPS_RIDE_ID;

/** The ride's own name, as its page and its fast-travel chip print it. */
export const TEACUPS_RIDE_NAME = "Tea Cups";

/** The ride it was asked to stand behind: the Data Engineering ride. */
export const BEHIND_RIDE_ID = "ufo";

/**
 * THE TEAM IT IS SIGNED FOR.
 *
 * The user named this ride — "tea cups is for the (risk)" — so it carries a
 * signboard saying so, exactly as the Park Train is signed "DevOps", the
 * Flying Chairs "IT Support" and the Super Looper "UI/UX".
 *
 * That is a LABEL and nothing more, which is the standing rule in this park.
 * Risk is not a department in the roster at all, so there is not even anybody
 * to re-route: no mapping changes, no employee's walk changes, and the ride is
 * not added to `DepartmentRideId` — which would mean a sixth box in the layout
 * solver and every ride in the park moving to admit it.
 */
export const TEACUPS_TEAM_NAME = "Risk";

/* ------------------------------------------------------------------ *
 * HOW BIG — one factor, applied to the manufacturer's machine
 * ------------------------------------------------------------------ */

/**
 * TWENTY TIMES THE REAL MACHINE, uniformly.
 *
 * The ride was first built at three times Beston's own, which is what it takes
 * for a cup to read as a cup from the ride next door. The user has since asked
 * for it twenty times over, and this is that number: one factor, on every
 * length, so the machine keeps exactly the proportions Beston publish and
 * nothing is stretched.
 *
 * WHY IT IS TWENTY TIMES THE MANUFACTURER'S MACHINE AND NOT TWENTY TIMES WHAT
 * WAS ALREADY BUILT. Twenty times the ride as it stood is sixty times Beston's,
 * and that ride cannot be in this park at all: its apron alone would be 480 m
 * across, against a park whose entire fan of rides measures 508 m by 356 m, and
 * clearing the railway it would have to stand seven hundred metres out — past
 * the track, off the property, and nowhere near the pendulum it was asked to
 * stand behind. The brief that put it there and the brief that enlarges it
 * cannot both be met at sixty; at twenty they both can, and twenty is the knob
 * this ride was described by.
 *
 * WHAT IT COSTS, plainly: a cup comes out 33 m across and a seat twenty times
 * the size of the person in it. That is what a uniform twenty-fold increase
 * means — the alternative, growing the machine and leaving the cups alone,
 * is not uniform scaling, and uniform is this park's rule.
 */
export const RIDE_SCALE = 20;

/* ------------------------------------------------------------------ *
 * TWENTY-FOUR RIDERS, IN SIX CUPS
 * ------------------------------------------------------------------ */

/** Beston's own figure: 24 persons a cycle, four to a cup. */
export const SEATS_PER_CUP = 4;
export const CUP_COUNT = 6;
export const SEAT_COUNT = CUP_COUNT * SEATS_PER_CUP;
/** The angle between one cup and the next: a perfect 60°. */
export const CUP_PITCH_RADIANS = (Math.PI * 2) / CUP_COUNT;

/* ------------------------------------------------------------------ *
 * THE PLATE
 * ------------------------------------------------------------------ */

/** Beston's "rotating diameter (large plate): 6 m", at this ride's scale. */
export const PLATE_RADIUS = 3 * RIDE_SCALE * METRE;
export const PLATE_THICKNESS = 0.22 * RIDE_SCALE * METRE;
/**
 * The plinth under the plate: a FOUNDATION, and so not scaled with the machine.
 *
 * Everything that is part of the ride's own shape grows by RIDE_SCALE, because
 * that is what keeps the proportions Beston publish. This is not part of its
 * shape — it is the ground clearance that lifts the plate off the pad, and a
 * turntable a hundred and twenty metres across still sits half a metre up, not
 * eleven. Scaled with the rest it put the boarding deck fifteen metres in the
 * air and turned the shortest climb in the park into four flights of stairs.
 *
 * The same reasoning already applies to the apron's paving, the hand rail and
 * the steps: those are sized for the people who stand on them, and the park
 * sizes every one of those from the people.
 */
export const PLINTH_HEIGHT = 0.55 * METRE;
/** Beston's "equipment size required: 8 x 8 m" — the apron, as a radius. */
export const APRON_RADIUS = 4 * RIDE_SCALE * METRE;
/** Laid as paving, not as a kerb: the rail and the stair both stand on it. */
export const APRON_THICKNESS = 0.12 * METRE;

/* ------------------------------------------------------------------ *
 * THE CUPS
 * ------------------------------------------------------------------ */

/**
 * A cup for four, and where six of them sit on the plate.
 *
 * The ring radius is not chosen: a cup has to clear the plate's own rim on the
 * outside and its two neighbours on either side, and on a machine this
 * compact those two constraints very nearly meet. `validateTeaCups` re-checks
 * both, so a change to the cup's size cannot quietly push one cup through
 * another.
 */
export const CUP_INNER_RADIUS = 0.72 * RIDE_SCALE * METRE;
export const CUP_WALL = 0.12 * RIDE_SCALE * METRE;
export const CUP_RADIUS = CUP_INNER_RADIUS + CUP_WALL;
export const CUP_HEIGHT = 1.05 * RIDE_SCALE * METRE;
export const CUP_BASE_HEIGHT = 0.26 * RIDE_SCALE * METRE;
export const CUP_BASE_RADIUS = CUP_INNER_RADIUS * 0.55;
export const CUP_FLOOR_Y = 0.14 * RIDE_SCALE * METRE;
/** The handle, which is what makes a teacup read as a teacup at all. */
export const CUP_HANDLE_RADIUS = CUP_RADIUS * 0.4;
export const CUP_HANDLE_TUBE = 0.075 * RIDE_SCALE * METRE;
/** The wheel in the middle that the riders spin their own cup with. */
export const CUP_WHEEL_RADIUS = 0.36 * RIDE_SCALE * METRE;

/** The bench round the inside. The cup's wall is the seat back. */
export const SEAT_PAN_Y = PROP.chairSeatY * RIDE_SCALE;
export const CUSHION_HEIGHT = (HUMAN.hipY - PROP.chairSeatY) * RIDE_SCALE;
export const SEAT_DEPTH = 0.42 * RIDE_SCALE * METRE;
/** Where a seated rider's hands find the wheel. */
export const WHEEL_GRIP_Y = SEAT_PAN_Y + (HUMAN.shoulderY - PROP.chairSeatY) * 0.5 * RIDE_SCALE;

/** Clear air a cup keeps from its neighbours and from the plate's rim. */
export const CUP_CLEARANCE = 0.22 * RIDE_SCALE * METRE;
export const CUP_RING_RADIUS = PLATE_RADIUS - CUP_RADIUS - CUP_CLEARANCE;

/* ------------------------------------------------------------------ *
 * THE CEILING — "cornices, middle screens, ceilings, lights"
 * ------------------------------------------------------------------ */

/**
 * The canopy does NOT turn.
 *
 * It hangs from a column standing through the middle of the plate, which is
 * how these machines are built: the ceiling, its cornice and its lights are
 * fixed, and the plate revolves underneath them. That is also what makes the
 * ride read from outside — a still roof over a moving floor.
 */
export const COLUMN_RADIUS = 0.36 * RIDE_SCALE * METRE;
export const CANOPY_RIM_Y = 3.5 * RIDE_SCALE * METRE;
export const CANOPY_RADIUS = PLATE_RADIUS + 0.7 * RIDE_SCALE * METRE;
export const CANOPY_PEAK_Y = CANOPY_RIM_Y + 1.15 * RIDE_SCALE * METRE;
export const CANOPY_SHELL = 0.12 * RIDE_SCALE * METRE;
/** The cornice board hanging from the rim, scalloped one per cup, doubled. */
export const CORNICE_SCALLOPS = CUP_COUNT * 4;
export const CORNICE_DROP = 0.55 * RIDE_SCALE * METRE;
/** The crown over the peak, and the finial that tops the ride out. */
export const CROWN_RADIUS = 0.62 * RIDE_SCALE * METRE;
export const CROWN_HEIGHT = 0.7 * RIDE_SCALE * METRE;
export const FINIAL_HEIGHT = 1.0 * RIDE_SCALE * METRE;

/** RGB-LED runs, which is what Beston light these with. */
export const RIM_LAMP_COUNT = CORNICE_SCALLOPS;
export const LAMP_RADIUS = 0.09 * RIDE_SCALE * METRE;

/* ------------------------------------------------------------------ *
 * HOW IT TURNS
 * ------------------------------------------------------------------ */

/**
 * THE MANUFACTURER'S 3.8 rpm CANNOT SURVIVE THE ENLARGEMENT, and pretending it
 * could would be the one dishonest number on this page.
 *
 * A rotation rate is an angular speed, so it does not scale with the machine —
 * but what a rider FEELS is metres per second, and that does. Beston's 3.8 rpm
 * on their own 6 m plate carries a rider at walking pace; the same 3.8 rpm on
 * a plate twenty times across would carry them at 55 km/h, standing in an open
 * cup with a hand wheel to hold. No operator would run it there.
 *
 * So the speed is set the way the rest of this park sets speeds — from what it
 * does to the person on the ride — and the rpm falls out of it. The
 * manufacturer's figure is kept below as the reference it is, and
 * `verify-tea-cups.ts` prints what it would have meant at this size.
 */
export const GRAVITY = 9.80665;
export const BESTON_PLATE_RPM = 3.8;
export const RIDER_SPEED = 6.0 * METRE;
export const PLATE_RADIANS_PER_SEC = RIDER_SPEED / CUP_RING_RADIUS;
export const PLATE_RPM = (PLATE_RADIANS_PER_SEC * 60) / (Math.PI * 2);

/**
 * The cups spin the other way, and their rate comes out of a COMFORT BUDGET.
 *
 * Counter-rotation is the ride, and the two rotations add: at one point on
 * every turn a rider is being pulled sideways by the plate and by their own
 * cup at once. Nobody on a tea cup ride is restrained — they are sitting in an
 * open cup with a hand wheel to hold — so what the machine may do to them is
 * the thing to design against, and it is a PULL rather than a speed. A ride
 * this size can carry somebody at twenty km/h and barely lean on them at all.
 *
 * So the budget is stated once, the plate takes its share of it from the speed
 * it carries a rider at, and the cups get exactly what is left. Nothing is
 * picked to look right, and if the ride is ever resized again the cups slow
 * down by themselves.
 *
 * A FIFTH OF A G, near enough, is the figure — about what leaning into a brisk
 * corner on foot feels like. Beston sell this ride as "suitable age: all ages",
 * and that is what all ages means.
 */
export const COMFORT_GEE = 0.18;
export const CUP_ROTATION_SIGN = -1;
/** What the plate already spends of the budget, from its own rider speed. */
export const PLATE_GEE = (PLATE_RADIANS_PER_SEC ** 2 * CUP_RING_RADIUS) / GRAVITY;
/** So this is what the cups may have. */
export const CUP_GEE = COMFORT_GEE - PLATE_GEE;
export const CUP_RADIANS_PER_SEC = Math.sqrt((CUP_GEE * GRAVITY) / CUP_INNER_RADIUS);
export const CUP_RIDER_SPEED = CUP_RADIANS_PER_SEC * CUP_INNER_RADIUS;
export const CUP_RPM = (CUP_RADIANS_PER_SEC * 60) / (Math.PI * 2);

/** The dwell either side of the run, and the ramps between. */
export const LOAD_SECONDS = 8;
export const SPIN_UP_SECONDS = 6;
export const RUN_SECONDS = 24;
export const SPIN_DOWN_SECONDS = 6;
export const UNLOAD_SECONDS = 6;

/* ------------------------------------------------------------------ *
 * GETTING ON
 * ------------------------------------------------------------------ */

/**
 * The plate IS the floor riders walk on, which is what a cups ride does: it
 * stops, the gate opens, people walk across the deck into a cup. So the only
 * climb on the whole ride is the plinth, and the steps up to it are counted
 * from its height rather than chosen.
 */
export const DECK_Y = PLINTH_HEIGHT + PLATE_THICKNESS;
export const RAIL_HEIGHT = PROP.railHeight;
export const GATE_WIDTH = 3.2 * METRE;

/* ------------------------------------------------------------------ *
 * WHAT IT OCCUPIES
 * ------------------------------------------------------------------ */

export const OVERALL_HEIGHT = CANOPY_PEAK_Y + CROWN_HEIGHT + FINIAL_HEIGHT;
export const OVERALL_REACH = Math.max(APRON_RADIUS, CANOPY_RADIUS);

/* ------------------------------------------------------------------ *
 * THE PALETTE
 * ------------------------------------------------------------------ */

/**
 * A fairground tea cup ride: a cream and rose ceiling, gilt cornice, and six
 * glazed cups.
 *
 * The five department rides take their structural paint from
 * `world/ridePaint.ts`, one hue each, and `verify-night.ts` re-proves that
 * those five stay separated on the hue wheel. This is an attraction rather
 * than a department ride, so — like the Flying Chairs and the Super Looper —
 * it carries its own livery here and adds nothing to that registry.
 */
export const PALETTE = {
  canopyCream: "#f6efe2",
  canopyRose: "#d9718a",
  cornice: "#e8c26a",
  column: "#f0e6d6",
  columnTrim: "#b8546e",
  plinth: "#cdc6ba",
  plinthTrim: "#b8546e",
  deck: "#8a6f5c",
  deckTrim: "#e8c26a",
  rail: "#f0e6d6",
  steel: "#9aa3ad",
  steelDark: "#565f6b",
  saucer: "#f7f3ea",
  cushion: "#f0e3cf",
  brass: "#d2a441",
  lamp: "#fff0c4",
} as const;

/**
 * The cups' glazes: six cups, six colours, one each.
 *
 * With only six there is no need for a repeating run — every cup can be told
 * from every other at a glance, which is what a rider looking for the one
 * their friends are in actually needs.
 */
export const CUP_COLORS = [
  "#d94f4f",
  "#e39a2f",
  "#f2d64b",
  "#4f9e6a",
  "#3f8fbf",
  "#8a6fb5",
] as const;

export function cupColor(index: number): string {
  return CUP_COLORS[index % CUP_COLORS.length];
}

/* ------------------------------------------------------------------ *
 * SELF-CHECK
 * ------------------------------------------------------------------ */

export function validateTeaCups(): void {
  console.assert(
    SEAT_COUNT === 24,
    `Beston's machine carries 24 a cycle; found ${SEAT_COUNT}`,
  );
  console.assert(
    Math.abs(CUP_PITCH_RADIANS * CUP_COUNT - Math.PI * 2) < 1e-12,
    "The cups do not close the circle exactly",
  );
  console.assert(
    CUP_RING_RADIUS + CUP_RADIUS <= PLATE_RADIUS - CUP_CLEARANCE + 1e-9,
    "A cup would overhang the plate it stands on",
  );
  console.assert(
    2 * CUP_RING_RADIUS * Math.sin(CUP_PITCH_RADIANS / 2) > CUP_RADIUS * 2,
    "Neighbouring cups would touch",
  );
  console.assert(
    CUP_GEE > 0,
    "The plate alone spends the whole comfort budget; the cups have nothing left to spin on",
  );
  console.assert(
    CANOPY_RIM_Y > CUP_HEIGHT + HUMAN.height,
    "A rider standing in a cup would hit the ceiling",
  );
}
