import { rideById } from "@/components/park/layout";
import { HUMAN, METRE, PROP } from "@/world/scale";

/**
 * THE SUPER LOOPER — a train that runs the inside of a vertical loop.
 *
 * A recreation of the machine in the Sketchfab model "Super Looper" by
 * 1989pete, which is itself a Parkitect mod approximating a LARSON SUPER LOOP.
 * Nothing is imported from it: like every other ride in this park, this is an
 * original build in code to the same machine.
 *
 * WHAT THE MACHINE IS. Larson International build a family of them — the
 * Fire Ball at 17.9 m, the 22 m Giant Loop, the Giga Loop at 100 ft — and they
 * are all the same idea: one closed circular track standing on edge, a train
 * of two-seat cars captive on it, and rubber drive tyres at the bottom. The
 * train cannot free itself from the rail, which is the whole point of the
 * ride: it is pumped back and forth up the sides until it has the energy to go
 * over, then runs the loop, and can be stopped with its riders hanging upside
 * down at the top.
 *
 * HOW BIG THIS ONE IS, AND WHY. The loop is not a chosen number. The park's
 * standing instruction is that a ride carries thirty to forty people, so this
 * one carries thirty in fifteen two-seat cars; fifteen cars at their own pitch
 * make a 25.5 m train; and a Super Loop's train wraps a bit over a quarter of
 * its circle. That fixes the circumference, and the circumference fixes the
 * radius. The answer comes out at a 29 m loop, which is the Giga Loop end of
 * the family — the biggest one Larson actually build.
 *
 * That leaves it one of the SMALLER rides in this park, which is worth saying
 * plainly rather than quietly scaling the machine up: its neighbours are a
 * 66 m pendulum and 89 m flying chairs. If it should be a landmark instead of
 * a fairground ride, `TRAIN_ARC_FRACTION` and the car pitch are the two knobs,
 * and every dimension and speed on this page follows them.
 *
 * NOTHING ALREADY IN THE PARK MOVES. Like the Flying Chairs, this ride is not
 * handed to the layout solver — a sixth box would re-solve all five existing
 * positions and shift the whole park — so it is placed in ground that was
 * already clear. See placement.ts.
 */

/* ------------------------------------------------------------------ *
 * WHAT IT IS CALLED
 * ------------------------------------------------------------------ */

/** This ride's own id, kept distinct from every `DepartmentRideId`. */
export const LOOPER_RIDE_ID = "looper" as const;
export type LooperRideId = typeof LOOPER_RIDE_ID;

/** The ride's own name, as its page and its fast-travel chip print it. */
export const LOOPER_RIDE_NAME = "Super Looper";

/**
 * THE TEAM IT IS SIGNED FOR.
 *
 * The user named this ride — "this ride is for UI/UX" — so it carries a
 * signboard saying so, exactly as the Park Train is signed "DevOps" and the
 * Flying Chairs "IT Support".
 *
 * That is a LABEL and nothing more, which is the standing rule in this park.
 * No roster changes, no mapping changes, and no employee's route changes:
 * UI/UX staff still walk to the Ferris Wheel, because that is where
 * `departments.ts` sends them and this ride is not a `DepartmentRideId`.
 * Making it one would mean handing a sixth box to the layout solver, which
 * would move every ride in the park. verify-super-looper.ts asserts both
 * halves — that the board says UI/UX, and that nobody was re-routed.
 */
export const LOOPER_TEAM_NAME = "UI/UX";

/* ------------------------------------------------------------------ *
 * HOW BIG — "equal to the dragon ride"
 * ------------------------------------------------------------------ */

/**
 * THE RIDE IS BUILT TO A HEIGHT IT WAS GIVEN, and everything else follows.
 *
 * It was first built at the size Larson actually make one — a 29 m ring, the
 * Giga Loop end of their range — and that left it the smallest thing in a park
 * of sixty-to-ninety-metre machines. The user has asked for it to match the
 * Dragon Ride, which is the tallest ride in the park, so the target is read
 * out of the park layout rather than typed here: change the Dragon Ride and
 * this follows it.
 *
 * UNIFORMLY, WHICH IS THE POINT. There is exactly one factor and every length
 * on the machine is multiplied by it, so the Super Looper stays the same shape
 * — the same ring, the same train, the same proportions between them — and is
 * simply built at two and a half times the size. Nothing is stretched, and the
 * chain that decides the ring's radius is untouched: the car sets the pitch,
 * the pitch sets the train, the train sets the loop. Scaling the car scales
 * all three together.
 *
 * WHAT IT COSTS, stated rather than hidden. A car comes out 3.7 m long and a
 * seat two and a half times life size — the same trade the Flying Chairs make
 * at 2.2x and the UFO Pendulum's seats at 2.4x, and for the same reason: a
 * life-sized car on an 84 m ring is a couple of pixels from anywhere in the
 * park. And the train now comes to rest eight metres up rather than three, so
 * the platform beside it needs two flights of steps where one used to do.
 *
 * The STATION is not scaled. Its boards, its rail and its steps are for people
 * to stand on and climb, and the park sizes those from the people — every
 * boarding stair in it does. Only its HEIGHT follows the machine, because it
 * has to meet the car floor.
 */

/** The ride this one was told to match. */
export const SIZE_MATCH_ID = "dragon";
const TARGET_HEIGHT = rideById(SIZE_MATCH_ID).height;

/* The machine at the size Larson build it, before that target is applied. */
const REF_CAR_LENGTH = 1.45;
const REF_CAR_GAP = 0.25;
const REF_BASE_HEIGHT = 1.6;
const REF_RAIL_CLEARANCE = 0.5;
const REF_SPINE_OFFSET = 1.15;
const REF_SPINE_RADIUS = 0.55;
const REF_CAR_COUNT = 15;
const REF_TRAIN_ARC = 0.28 * Math.PI * 2;
const REF_LOOP_RADIUS = (REF_CAR_COUNT * (REF_CAR_LENGTH + REF_CAR_GAP)) / REF_TRAIN_ARC;

/**
 * The reference machine's overall height, by the same formula the finished
 * ride's is — chassis, air under the rail, the loop twice over, and the spine
 * standing proud of it. Written out here so the factor below is a ratio of two
 * heights measured the same way, rather than a number that happens to work.
 */
const REF_OVERALL_HEIGHT =
  REF_BASE_HEIGHT +
  REF_RAIL_CLEARANCE +
  2 * REF_LOOP_RADIUS +
  REF_SPINE_OFFSET +
  REF_SPINE_RADIUS;

/** The one factor. Every length on the machine is multiplied by it. */
export const RIDE_SCALE = TARGET_HEIGHT / REF_OVERALL_HEIGHT;

/* ------------------------------------------------------------------ *
 * THE TRAIN — which is what sizes the loop
 * ------------------------------------------------------------------ */

/**
 * Thirty riders, two to a car, because this park's rides carry thirty to
 * forty. A real Larson train carries twenty-four in twelve cars; three more
 * cars is the same train, longer.
 */
export const RIDERS_PER_CAR = 2;
export const CAR_COUNT = 15;
export const RIDER_CAPACITY = CAR_COUNT * RIDERS_PER_CAR;

/** A two-seat car, at the size of the people in it. */
export const CAR_WIDTH = (RIDERS_PER_CAR * PROP.chairWidth + 0.34 * METRE) * RIDE_SCALE;
export const CAR_LENGTH = REF_CAR_LENGTH * RIDE_SCALE * METRE;
export const CAR_FLOOR_THICKNESS = 0.12 * RIDE_SCALE * METRE;
export const SEAT_PAN_Y = PROP.chairSeatY * RIDE_SCALE;
export const SEAT_BACK_HEIGHT = (HUMAN.shoulderY - PROP.chairSeatY) * RIDE_SCALE;
export const HEADREST_HEIGHT = (HUMAN.headY - PROP.chairSeatY + 0.22 * METRE) * RIDE_SCALE;
/** The over-the-shoulder restraint every looping ride carries. */
export const HARNESS_RADIUS = 0.06 * RIDE_SCALE * METRE;
export const HARNESS_Y = (HUMAN.shoulderY - PROP.chairSeatY - 0.12 * METRE) * RIDE_SCALE;

/** Coupling gap between cars, and so the pitch the train is measured in. */
export const CAR_GAP = REF_CAR_GAP * RIDE_SCALE * METRE;
export const CAR_PITCH = CAR_LENGTH + CAR_GAP;
export const TRAIN_LENGTH = CAR_COUNT * CAR_PITCH;

/* ------------------------------------------------------------------ *
 * THE LOOP — solved from the train, not chosen
 * ------------------------------------------------------------------ */

/**
 * How much of the circle the train occupies.
 *
 * A Larson's train is a little over a quarter of its loop: short enough that
 * the whole of it is over the top together, long enough that the ride reads as
 * a train rather than a car. Everything about the loop's size comes from this
 * one fraction and the train that has to fit in it.
 */
export const TRAIN_ARC_FRACTION = 0.28;
export const TRAIN_ARC = TRAIN_ARC_FRACTION * Math.PI * 2;
export const LOOP_RADIUS = TRAIN_LENGTH / TRAIN_ARC;

/**
 * WHERE THE TRAIN'S WEIGHT ACTUALLY IS, which is not on the rail.
 *
 * The train is a quarter of the ring long, so treating it as a point on the
 * track would be wrong in a way that changes the whole ride. Its mass is
 * spread along an arc, and the centre of mass of an arc sits INSIDE the circle
 * it lies on — at `R sin(a) / a` for a half-angle `a`. For this train that is
 * about 88% of the loop's radius.
 *
 * It matters twice. Gravity pulls on the centre of mass, so the train swings
 * as a shorter pendulum than the rail suggests; and the height it has to be
 * lifted to get over the top is twice THAT radius rather than twice the rail's
 * — some 12% less energy, and a good ten km/h off the speed it has to come
 * through the bottom at. Every part of it still runs at the rail's radius, so
 * the kinetic energy is the rail's. loopMotion.ts uses both, each where it
 * belongs.
 */
export const TRAIN_CM_RADIUS =
  (LOOP_RADIUS * Math.sin(TRAIN_ARC / 2)) / (TRAIN_ARC / 2);

/** Two rails at a gauge, with ties between them — a real track, not a ribbon. */
export const TRACK_GAUGE = 1.9 * RIDE_SCALE * METRE;
export const RAIL_RADIUS = 0.17 * RIDE_SCALE * METRE;
export const TIE_COUNT = 84;
export const TIE_RADIUS = 0.09 * RIDE_SCALE * METRE;
/** The spine hoop behind the rails, which is what carries the loop's load. */
export const SPINE_RADIUS = REF_SPINE_RADIUS * RIDE_SCALE * METRE;
export const SPINE_OFFSET = REF_SPINE_OFFSET * RIDE_SCALE * METRE;

/** Lamp bulbs round the loop — a fairground ring is a ring of lights. */
export const LAMP_COUNT = TIE_COUNT / 2;
export const LAMP_RADIUS = 0.17 * RIDE_SCALE * METRE;

/* ------------------------------------------------------------------ *
 * WHAT IT STANDS ON
 * ------------------------------------------------------------------ */

/** The chassis the whole machine is built on, as a transportable ride is. */
export const BASE_HEIGHT = REF_BASE_HEIGHT * RIDE_SCALE * METRE;
export const BASE_HALF_LENGTH = LOOP_RADIUS + 4.5 * RIDE_SCALE * METRE;
export const BASE_HALF_WIDTH = 5.0 * RIDE_SCALE * METRE;

/** Clear air under the bottom of the rail, over the chassis. */
export const RAIL_GROUND_CLEARANCE = REF_RAIL_CLEARANCE * RIDE_SCALE * METRE;
export const RAIL_BOTTOM_Y = BASE_HEIGHT + RAIL_GROUND_CLEARANCE;
/** The centre of the loop. Every height on the ride is measured from it. */
export const LOOP_CENTER_Y = RAIL_BOTTOM_Y + LOOP_RADIUS;

/**
 * The legs, which take the loop at its own widest points.
 *
 * Two A-frames, one either side of the loop, each meeting the ring at three
 * o'clock and nine o'clock — the hard points a real Super Loop is trussed at —
 * and splaying out and back across the loop's plane so the ring is braced
 * sideways as well as held up.
 */
export const LEG_RADIUS = 0.62 * RIDE_SCALE * METRE;
export const LEG_SPLAY = 4.2 * RIDE_SCALE * METRE;
export const LEG_HALF_SPREAD = 4.6 * RIDE_SCALE * METRE;
export const BRACE_RADIUS = 0.26 * RIDE_SCALE * METRE;

/* ------------------------------------------------------------------ *
 * THE STATION
 * ------------------------------------------------------------------ */

/**
 * The platform is laid where the CAR FLOOR actually stops, and the steps up to
 * it are counted from there — the user's standing preference on this park is
 * that a ride brings itself down to the people and a short straight ladder
 * does the rest. This ride needs no lift to manage it: its train comes to rest
 * at the bottom of the loop by itself, a couple of metres up.
 */
export const CAR_CENTER_OFFSET = 1.05 * RIDE_SCALE * METRE;
/** Where a seat pan waits while the train is stopped at the bottom. */
export const SEAT_LOAD_Y = RAIL_BOTTOM_Y + CAR_CENTER_OFFSET + SEAT_PAN_Y;
/**
 * The boards are laid level with the CAR FLOOR, not with the seat pan.
 *
 * They used to be levelled with the pan, which is the same thing on a
 * life-sized car: a pan is a seat height above its own floor. It stops being
 * the same thing once the car is built two and a half times life size, because
 * the pan goes up with it and the person stepping in does not. Level with the
 * floor, a rider steps across on to the deck of the car and sits down.
 */
export const PLATFORM_Y = RAIL_BOTTOM_Y + CAR_CENTER_OFFSET;
export const PLATFORM_THICKNESS = 0.28 * METRE;
export const PLATFORM_HALF_LENGTH = 8.0 * RIDE_SCALE * METRE;
/** Which side of the loop's plane riders board from. */
export const PLATFORM_SIDE = 1;
/** Its near edge: clear of the cars, which are what pass closest to it. */
export const PLATFORM_INNER_Z = TRACK_GAUGE / 2 + CAR_WIDTH / 2 + 0.5 * METRE;
/**
 * ITS FAR EDGE REACHES THE CHASSIS EDGE, which is what sets the width.
 *
 * Room to stand is the floor on it — a couple of metres would do — but the
 * deck is not free to be that narrow, because the STEPS have to come down off
 * its far edge and land on the ground. Stop the boards short of the chassis
 * and the flight below them runs down inside a four-metre steel box: which is
 * exactly what happened when the ride was scaled up and the chassis grew past
 * the deck. So the deck reaches the chassis edge and the stair starts beyond
 * it, on open ground, however big the machine gets.
 */
export const PLATFORM_WIDTH = Math.max(3.4 * METRE, BASE_HALF_WIDTH - PLATFORM_INNER_Z);
export const RAIL_HEIGHT = PROP.railHeight;

/* ------------------------------------------------------------------ *
 * HOW IT RUNS — physics, not animation
 * ------------------------------------------------------------------ */

export const GRAVITY = 9.80665;

/**
 * THE DRIVE TYRES, and why the ride has to be pumped at all.
 *
 * A Super Loop's train is captive on its rail — wheels above, below and either
 * side of it — so it does not need to be going fast enough to hold itself on
 * at the top the way a free pendulum does. It only needs the ENERGY to get
 * there: half v squared at the bottom must exceed g times the full height of
 * the loop, which is twice its radius. No motor can deliver that in one push
 * from a standstill, so the tyres shove it a little every time it comes
 * through the bottom and it swings higher each pass until it goes over.
 *
 * That is the whole model. Both numbers below are ordinary machine figures —
 * about half a g of push over a third of a radian of track — and how many
 * swings it takes to get round is not set here: it is whatever the integration
 * in loopMotion.ts comes out at.
 */
export const DRIVE_ARC = 0.45;
export const DRIVE_ACCEL = 7.0 * METRE;
export const BRAKE_ACCEL = 9.0 * METRE;
/**
 * The speed below which the brake simply holds the train, and the speed the
 * tyres then jog it back to the platform at.
 *
 * A real tyre brake does not asymptotically damp a train to a halt; it grips
 * and stops it, and then the operator inches it round to the platform. Without
 * that last part the integration spends four minutes watching a rocking train
 * converge on the bottom of the loop, which is neither what the machine does
 * nor anything anybody would watch.
 */
export const BRAKE_HOLD_SPEED = 5.0 * METRE;
export const CREEP_SPEED = 3.4 * METRE;

/** How fast the train is still going as it crosses the top. */
export const TOP_SPEED = 3.0 * METRE;
/** So the speed it has to leave the bottom at, straight from energy. */
export const LAUNCH_SPEED = Math.sqrt(TOP_SPEED ** 2 + 4 * GRAVITY * TRAIN_CM_RADIUS);

/** How many times round before the brakes come on. */
export const LOOP_REVOLUTIONS = 4;
/** Dwell at the platform, either side of the run. */
export const LOAD_SECONDS = 9;
export const UNLOAD_SECONDS = 7;

/* ------------------------------------------------------------------ *
 * WHAT IT OCCUPIES
 * ------------------------------------------------------------------ */

/**
 * The highest steel on the ride: the top of the loop's spine.
 *
 * By construction this is the height the ride was asked for — RIDE_SCALE is
 * the ratio of that height to this same sum taken on the unscaled machine — so
 * it lands on the Dragon Ride's exactly rather than nearly.
 */
export const OVERALL_HEIGHT = LOOP_CENTER_Y + LOOP_RADIUS + SPINE_OFFSET + SPINE_RADIUS;

/**
 * Everything the ride claims on the ground, as a radius.
 *
 * The loop is a flat object — thirty metres across its own plane and about ten
 * across the other way — so a single radius overstates it in one direction.
 * It is still the right figure for placement: it is what nothing else may
 * stand inside, and taking the larger of the two is the safe way round.
 */
export const OVERALL_REACH = Math.max(
  BASE_HALF_LENGTH,
  LOOP_RADIUS + SPINE_OFFSET + SPINE_RADIUS,
  LEG_HALF_SPREAD + LEG_RADIUS,
  PLATFORM_INNER_Z + PLATFORM_WIDTH,
);

/* ------------------------------------------------------------------ *
 * THE PALETTE
 * ------------------------------------------------------------------ */

/**
 * Orange, white and steel blue — a fairground ring, and a colour no other ride
 * in this park wears.
 *
 * The five department rides take their structural paint from
 * `world/ridePaint.ts`, one hue each, and `verify-night.ts` re-proves that
 * those five stay separated on the hue wheel. This ride is an attraction
 * rather than a department ride, so — exactly like the Flying Chairs and their
 * cream-and-red canopy — it carries its own livery here and adds nothing to
 * that registry. Nothing in the park's colour system had to move to admit it.
 */
export const PALETTE = {
  loopOrange: "#f0761f",
  loopWhite: "#f3f1ea",
  rail: "#c9d2dc",
  spine: "#e35b12",
  steel: "#8f9aa6",
  steelDark: "#4f5966",
  truss: "#2f5f8f",
  trussDark: "#1f4064",
  chassis: "#3b424c",
  deck: "#54606e",
  deckTrim: "#f0761f",
  brass: "#d8a53a",
  carBody: "#1d2733",
  seatCushion: "#e3e7ec",
  harness: "#ffd23d",
  lamp: "#fff2c0",
} as const;

/**
 * The cars' liveries, dealt round the train.
 *
 * Five colours over fifteen cars would repeat every five and read as a
 * pattern; four over fifteen walks the whole train without two neighbours ever
 * matching and without the run landing back where it started until the end.
 */
export const CAR_COLORS = ["#e8443a", "#ffc22e", "#2fb5c9", "#8a5cd6"] as const;

export function carColor(index: number): string {
  return CAR_COLORS[index % CAR_COLORS.length];
}

/* ------------------------------------------------------------------ *
 * SELF-CHECK
 * ------------------------------------------------------------------ */

export function validateSuperLooper(): void {
  console.assert(
    RIDER_CAPACITY >= 30 && RIDER_CAPACITY <= 40,
    `Every ride in this park carries 30-40; this one carries ${RIDER_CAPACITY}`,
  );
  console.assert(
    Math.abs(LOOP_RADIUS * TRAIN_ARC - TRAIN_LENGTH) < 1e-12,
    "The loop was not solved from the train that has to fit on it",
  );
  console.assert(TRAIN_ARC < Math.PI, "The train would wrap more than half the loop");
  console.assert(
    LAUNCH_SPEED > Math.sqrt(4 * GRAVITY * TRAIN_CM_RADIUS),
    "The train could not reach the top of its own loop",
  );
  console.assert(
    TRAIN_CM_RADIUS < LOOP_RADIUS,
    "The train's centre of mass cannot sit outside the rail it runs on",
  );
  console.assert(
    Math.abs(OVERALL_HEIGHT - rideById(SIZE_MATCH_ID).height) < 1e-9,
    "The ride is not the height it was told to match",
  );
  console.assert(PLATFORM_Y > 0, "The platform is underground");
  console.assert(
    RAIL_BOTTOM_Y > BASE_HEIGHT,
    "The rail would run through the chassis it stands on",
  );
}
